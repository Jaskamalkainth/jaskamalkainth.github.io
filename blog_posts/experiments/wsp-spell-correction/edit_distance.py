"""Classical baseline: per-word Damerau-Levenshtein correction against the shop's catalogue vocabulary.

Unlike the model, this baseline is *given* the full vocabulary (including test product nouns),
as a real shop would have from its product catalogue. It is the reference point, not a fair fight.

    python edit_distance.py
"""
import json, os
import common as c, data

VOCAB = sorted(set(data.BRANDS + data.COLORS + data.MATERIALS + data.ATTRS + data.AUDIENCE +
                   data.DEV_PRODUCTS + data.TEST_PRODUCTS + ["for"]))


def dl(a, b):
    """Optimal-string-alignment Damerau-Levenshtein distance."""
    d = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
    for i in range(len(a) + 1): d[i][0] = i
    for j in range(len(b) + 1): d[0][j] = j
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] != b[j - 1]))
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1)
    return d[-1][-1]


def fix(word):
    if word in VOCAB:
        return word
    best = min(VOCAB, key=lambda v: (dl(word, v), v))   # ties broken alphabetically
    return best if dl(word, best) <= 2 else word


if __name__ == "__main__":
    out = {}
    for split in ("dev", "test"):
        rows = c.rows(split)
        preds = [" ".join(fix(w) for w in r["query"].split()) for r in rows]
        out[split] = c.score(rows, preds)
        print(split, out[split])
        with open(os.path.join(c.HERE, "results", f"editdist_{split}.jsonl"), "w") as f:
            for r, p in zip(rows, preds):
                f.write(json.dumps({**r, "pred": p, "ok": p == r["target"]}) + "\n")
    print("vocabulary size", len(VOCAB))
