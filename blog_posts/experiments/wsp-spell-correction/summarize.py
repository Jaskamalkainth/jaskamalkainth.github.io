"""Print the results tables (accuracy by query length, and error types) from results/*.jsonl."""
import json, os
from collections import Counter
import common as c

METHODS = [("base", "Base model, plain prompt"), ("fewshot", "Base model, 5-shot prompt"),
           ("wsp", "Weight-space edit (no gradients)"), ("lora", "LoRA fine-tune (gradients)"),
           ("editdist", "Edit distance + catalogue vocabulary")]


def kind(r):
    if r["ok"]:
        return "correct"
    p, t = c.norm(r["pred"]).split(), r["target"].split()
    if c.norm(r["pred"]) == r["query"]:
        return "left typo unchanged"
    if len(p) > len(t):
        return "added words"
    if len(p) < len(t):
        return "dropped words"
    return "wrong word"


for split in ("dev", "test"):
    print(f"\n### {split}\n")
    print("| Method | All | 1 word | 2 | 3 | 4 | 5 | Typo queries | Clean queries |")
    print("|---|---:|---:|---:|---:|---:|---:|---:|---:|")
    for tag, name in METHODS:
        f = os.path.join(c.HERE, "results", f"{tag}_{split}.jsonl")
        if not os.path.exists(f):
            continue
        rs = [json.loads(l) for l in open(f)]
        s = c.score(rs, [r["pred"] for r in rs])
        print(f"| {name} | **{s['all']}%** | " + " | ".join(f"{s[k]}%" for k in "12345")
              + f" | {s['typo']}% | {s['clean']}% |")
    print("\n| Method | " + " | ".join(k for k in ["correct", "wrong word", "dropped words", "added words", "left typo unchanged"]) + " |")
    print("|---|---:|---:|---:|---:|---:|")
    for tag, name in METHODS:
        f = os.path.join(c.HERE, "results", f"{tag}_{split}.jsonl")
        if not os.path.exists(f):
            continue
        k = Counter(kind(json.loads(l)) for l in open(f))
        print(f"| {name} | " + " | ".join(str(k[x]) for x in ["correct", "wrong word", "dropped words", "added words", "left typo unchanged"]) + " |")
