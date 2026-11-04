"""Shared model loading, prompting, generation and scoring."""
import json, os, re, time
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get("WSP_MODEL", "Qwen/Qwen2.5-0.5B-Instruct")
SYSTEM = ("You are a spell checker for an online shop's search box. "
          "Fix any misspelled words in the user's search query. "
          "Reply with only the corrected query, nothing else.")
torch.set_num_threads(os.cpu_count())
FORWARD_PASSES = 0  # counts batched generate() calls, our "forward-pass budget"


def load():
    tok = AutoTokenizer.from_pretrained(MODEL)
    tok.padding_side = "left"
    model = AutoModelForCausalLM.from_pretrained(MODEL, dtype=torch.float32).eval()
    return tok, model


def rows(name):
    with open(os.path.join(HERE, f"{name}.jsonl")) as f:
        return [json.loads(l) for l in f]


def prompt(tok, q):
    msgs = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": q}]
    return tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)


@torch.no_grad()
def correct(tok, model, queries, bs=50, max_new_tokens=20, count=True):
    global FORWARD_PASSES
    out = []
    for i in range(0, len(queries), bs):
        batch = [prompt(tok, q) for q in queries[i:i + bs]]
        enc = tok(batch, return_tensors="pt", padding=True)
        gen = model.generate(**enc, max_new_tokens=max_new_tokens, do_sample=False,
                             pad_token_id=tok.pad_token_id)
        out += tok.batch_decode(gen[:, enc.input_ids.shape[1]:], skip_special_tokens=True)
        if count:
            FORWARD_PASSES += 1
    return out


def norm(s):
    return re.sub(r"\s+", " ", s.strip().lower())


def score(data, preds):
    """Exact match after lower-casing and whitespace normalisation, by query length."""
    res = {"all": [0, 0], "typo": [0, 0], "clean": [0, 0]}
    for n in range(1, 6):
        res[n] = [0, 0]
    for r, p in zip(data, preds):
        ok = norm(p) == r["target"]
        for k in ("all", r["n_words"], "clean" if not r["edits"] else "typo"):
            res[k][0] += ok
            res[k][1] += 1
    return {str(k): round(100 * a / b, 1) for k, (a, b) in res.items()}


def run(name, tok, model, tag, save=True, **kw):
    data = rows(name)
    t = time.time()
    preds = correct(tok, model, [r["query"] for r in data], **kw)
    s = score(data, preds)
    print(f"[{tag}] {name}: {s}  ({time.time() - t:.0f}s)", flush=True)
    if save:
        os.makedirs(os.path.join(HERE, "results"), exist_ok=True)
        with open(os.path.join(HERE, "results", f"{tag}_{name}.jsonl"), "w") as f:
            for r, p in zip(data, preds):
                f.write(json.dumps({**r, "pred": p, "ok": norm(p) == r["target"]}) + "\n")
    return s, preds
