"""Diagnostic: does the base model already prefer the right answer?

For every dev query, compare the model's log-probability (under the plain prompt) of
three candidate replies: the correct query, its own greedy reply, and an exact echo
of the input. If log P(target) beats log P(greedy) often, the knowledge is there and
the failure is in *what the model chooses to say*: an obstacle a weight edit can remove.
"""
import json, sys, torch
import common as c

@torch.no_grad()
def logp(tok, model, q, reply):
    p = c.prompt(tok, q)
    ids = tok(p + reply + "<|im_end|>", return_tensors="pt").input_ids
    n = len(tok(p).input_ids)
    lp = torch.log_softmax(model(ids).logits[0, :-1].float(), -1)
    tgt = ids[0, 1:]
    return lp[n - 1:].gather(1, tgt[n - 1:, None]).sum().item()

if __name__ == "__main__":
    tag = sys.argv[1] if len(sys.argv) > 1 else "base"
    tok, model = c.load()
    rs = [json.loads(l) for l in open(f"{c.HERE}/results/{tag}_dev.jsonl")]
    beat_greedy = beat_echo = n = 0
    for r in rs:
        if r["ok"] or not r["edits"]:
            continue
        t, g, e = (logp(tok, model, r["query"], x) for x in (r["target"], r["pred"], r["query"]))
        n += 1; beat_greedy += t > g; beat_echo += t > e
    print(f"{tag}: wrong typo queries {n}; target more likely than greedy reply {beat_greedy} "
          f"({100*beat_greedy/n:.0f}%), than echo {beat_echo} ({100*beat_echo/n:.0f}%)")
