"""The full weight-space-programming session, replayed in order, with the forward-pass count.

Budget: 50 batched forward passes (each <= 50 sequences) on dev.jsonl, no gradients.
Every attempt is kept, including the ones that made the model worse.
The test set is only touched at the end, once, for the final edit.

    python wsp_run.py
"""
import copy, json, os, random, torch
from transformers import AutoModelForCausalLM
import common as c, wsp

tok, base = c.load()
dev = c.rows("dev")
log = []

def record(name, weights, s):
    log.append({"attempt": name, "weights_changed": weights, "dev": s, "passes_so_far": c.FORWARD_PASSES})

# Attempt 1: compile the few-shot prompt's effect into v_proj biases (a constant steering vector).
qs = [r["query"] for r in dev]
diff = wsp.last_token_states(tok, base, qs, wsp.fewshot_prompt) - wsp.last_token_states(tok, base, qs, c.prompt)
for L, layers, alpha in [(8, [2, 3, 4, 5, 6, 7], 1.0), (12, list(range(5, 12)), 1.0)]:
    m = copy.deepcopy(base)
    n, miss = wsp.write_vector(m, layers, alpha * diff[L])
    s, _ = c.run("dev", tok, m, f"steer_L{L}_a{alpha}", save=False)
    record(f"steering vector, layer {L}, alpha {alpha} (unwritable part {miss:.2f})", n, s)
sub = dev[:]; random.Random(0).shuffle(sub); sub = sub[:50]
for L, layers, alpha in [(8, [2, 3, 4, 5, 6, 7], 0.25), (12, list(range(5, 12)), 0.15)]:
    m = copy.deepcopy(base)
    n, _ = wsp.write_vector(m, layers, alpha * diff[L])
    s = c.score(sub, c.correct(tok, m, [r["query"] for r in sub]))
    record(f"steering vector, layer {L}, alpha {alpha} (50-query subset)", n, s)

# Attempt 2 (diagnostic only): is "unfaithful length" a single direction at the last prompt token?
# 4 passes; separation was weak and flipped sign on held-out halves in layers 1-14, so no edit.
with torch.no_grad():
    for i in range(0, len(dev), 50):
        base(**tok([c.prompt(tok, r["query"]) for r in dev[i:i + 50]], return_tensors="pt", padding=True))
        c.FORWARD_PASSES += 1
record("diagnostic: chat-vs-copy direction (no edit)", 0, None)

# Attempt 3: find the heads that read the query while writing the answer, and turn them up.
eager = AutoModelForCausalLM.from_pretrained(c.MODEL, dtype=torch.float32, attn_implementation="eager").eval()
mass = wsp.query_attention_mass(tok, eager, dev)
del eager
order = [divmod(j, mass.shape[1]) for j in mass.flatten().argsort(descending=True).tolist()]
print("top copy heads:", [(L, h, round(mass[L, h].item(), 3)) for L, h in order[:12]])
for k, g in [(6, 1.5), (6, 2.0), (12, 1.5)]:
    m = copy.deepcopy(base)
    n = wsp.scale_heads(m, order[:k], g)
    s = c.score(sub, c.correct(tok, m, [r["query"] for r in sub]))
    record(f"scale top-{k} copy heads x{g} (50-query subset)", n, s)
for k, g in [(6, 2.0), (12, 1.5), (12, 2.0)]:
    m = copy.deepcopy(base)
    n = wsp.scale_heads(m, order[:k], g)
    s, _ = c.run("dev", tok, m, f"copy_k{k}_g{g}", save=False)
    record(f"scale top-{k} copy heads x{g}", n, s)

# Attempt 4: on top of the best copy edit, erase chat-opening tokens from late-layer outputs.
words = ["search", "check", "Please", "please", "listen", "type", "What", "what", "Search", "Check"]
ids = sorted({tok(w).input_ids[0] for w in words})
m = copy.deepcopy(base)
n = wsp.scale_heads(m, order[:12], 1.5)
with torch.no_grad():
    Q, _ = torch.linalg.qr((m.lm_head.weight[ids] * m.model.norm.weight).T)
    P = torch.eye(Q.shape[0]) - Q @ Q.T
    for L in range(18, 24):
        for W in (m.model.layers[L].mlp.down_proj.weight, m.model.layers[L].self_attn.o_proj.weight):
            W.copy_(P @ W); n += W.numel()
s, _ = c.run("dev", tok, m, "copy_nochat", save=False)
record("copy edit + project chat-opening tokens out of layers 18-23", n, s)

print("dev forward passes used:", c.FORWARD_PASSES)

# Final edit: top-12 copy heads x1.5. Test set evaluated once.
final = copy.deepcopy(base)
n = wsp.scale_heads(final, order[:12], 1.5)
s_dev, _ = c.run("dev", tok, final, "wsp", save=True, count=False)
s_test, _ = c.run("test", tok, final, "wsp", save=True, count=False)
out = {"forward_passes": c.FORWARD_PASSES, "attempts": log,
       "final": {"edit": "o_proj blocks of the 12 heads with most attention on the query, x1.5",
                 "heads": [f"L{L}.H{h}" for L, h in order[:12]], "weights_changed": n,
                 "fraction_of_model": n / sum(p.numel() for p in base.parameters()),
                 "dev": s_dev, "test": s_test}}
json.dump(out, open(os.path.join(c.HERE, "results", "wsp_log.json"), "w"), indent=1)
