"""Gradient baseline: LoRA fine-tune of the same model, for comparison with the weight-space edit.

Training data is synthetic and uses only the *dev* product nouns (test nouns are never seen),
generated with a different seed and with exact dev queries removed. LoRA rank 8 on q_proj and
v_proj in all 24 layers: 540,672 trainable weights. CPU only.

    python lora.py
"""
import json, os, random, time, torch
from peft import LoraConfig, get_peft_model
import common as c, data

tok, model = c.load()
dev_q = {r["query"] for r in c.rows("dev")}
train = [r for r in data.build(data.DEV_PRODUCTS, 400, seed=3) if r["query"] not in dev_q]
random.Random(0).shuffle(train)
print("train examples", len(train))

model = get_peft_model(model, LoraConfig(r=8, lora_alpha=16, lora_dropout=0.0,
                                         target_modules=["q_proj", "v_proj"], task_type="CAUSAL_LM"))
n_train = sum(p.numel() for p in model.parameters() if p.requires_grad)
print("trainable weights", n_train)

def batch(rows):
    tok.padding_side = "right"
    ids, labels = [], []
    for r in rows:
        p = tok(c.prompt(tok, r["query"])).input_ids
        a = tok(r["target"] + "<|im_end|>").input_ids
        ids.append(p + a); labels.append([-100] * len(p) + a)   # loss on the reply only
    L = max(map(len, ids))
    pad = tok.pad_token_id
    x = torch.tensor([i + [pad] * (L - len(i)) for i in ids])
    y = torch.tensor([l + [-100] * (L - len(l)) for l in labels])
    m = torch.tensor([[1] * len(i) + [0] * (L - len(i)) for i in ids])
    tok.padding_side = "left"
    return x, y, m

opt = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=1e-3)
bs, epochs = 16, 1
steps = epochs * len(train) // bs
sched = torch.optim.lr_scheduler.LambdaLR(opt, lambda s: min(1, (s + 1) / 10) * max(0.0, 1 - s / steps))
model.train(); t = time.time(); step = 0
for ep in range(epochs):
    for i in range(0, len(train) - bs + 1, bs):
        x, y, m = batch(train[i:i + bs])
        loss = model(input_ids=x, attention_mask=m, labels=y).loss
        loss.backward(); opt.step(); sched.step(); opt.zero_grad(); step += 1
        if step % 20 == 0:
            print(f"step {step}/{steps} loss {loss.item():.3f} ({time.time() - t:.0f}s)", flush=True)
train_s = time.time() - t
model.eval()
s_dev, _ = c.run("dev", tok, model, "lora", count=False)
s_test, _ = c.run("test", tok, model, "lora", count=False)
json.dump({"train_examples": len(train), "trainable_weights": n_train, "steps": step,
           "train_seconds": round(train_s), "threads": os.cpu_count(), "dev": s_dev, "test": s_test},
          open(os.path.join(c.HERE, "results", "lora_log.json"), "w"), indent=1)
