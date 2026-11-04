"""Build the e-commerce spell-correction dev and test sets.

Clean queries are 1-5 words, built from a small catalogue vocabulary. Dev and test
use *different* product nouns, so nothing tuned on dev has seen a test product.
Typos are the four Damerau edits (keyboard-neighbour substitution, deletion,
insertion, transposition); ~15% of queries are left clean to measure over-correction.

    python data.py            # writes dev.jsonl and test.jsonl next to this file
"""
import json, os, random

HERE = os.path.dirname(os.path.abspath(__file__))

BRANDS = ["nike", "adidas", "samsung", "apple", "sony", "philips", "lenovo", "puma",
          "boat", "prestige", "milton", "dell", "canon", "bosch", "titan", "fossil"]
COLORS = ["black", "white", "blue", "red", "green", "pink", "grey", "brown", "yellow", "silver"]
MATERIALS = ["leather", "cotton", "steel", "wooden", "plastic", "glass", "silk", "denim", "rubber", "ceramic"]
ATTRS = ["wireless", "waterproof", "portable", "cordless", "stainless", "organic", "foldable",
         "rechargeable", "bluetooth", "electric", "running", "formal", "casual", "gaming", "kids"]
AUDIENCE = ["men", "women", "kids", "girls", "boys", "babies"]

# Product nouns are split between dev and test so the test set is genuinely held out.
DEV_PRODUCTS = ["shoes", "headphones", "jacket", "laptop", "backpack", "watch", "bottle", "kettle",
                "sneakers", "keyboard", "wallet", "mattress", "blender", "charger", "sandals",
                "trousers", "sweater", "speaker", "pillow", "umbrella", "printer", "earrings",
                "toaster", "curtains"]
TEST_PRODUCTS = ["earphones", "handbag", "television", "refrigerator", "tshirt", "camera", "jeans",
                 "monitor", "sunglasses", "cookware", "bedsheet", "smartwatch", "microwave",
                 "notebook", "perfume", "trimmer", "hoodie", "slippers", "tablet", "necklace",
                 "suitcase", "vacuum", "blanket", "lipstick"]

KEYBOARD = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]


def neighbours(c):
    for r, row in enumerate(KEYBOARD):
        if c in row:
            i = row.index(c)
            out = [row[j] for j in (i - 1, i + 1) if 0 <= j < len(row)]
            for rr in (r - 1, r + 1):
                if 0 <= rr < len(KEYBOARD):
                    out += [KEYBOARD[rr][j] for j in (i - 1, i, i + 1) if 0 <= j < len(KEYBOARD[rr])]
            return out
    return list("abcdefghijklmnopqrstuvwxyz")


def typo(word, rng):
    """One Damerau edit, never returning the same word."""
    while True:
        op = rng.choice(["sub", "del", "ins", "swap"])
        i = rng.randrange(len(word))
        if op == "sub":
            w = word[:i] + rng.choice(neighbours(word[i])) + word[i + 1:]
        elif op == "del":
            w = word[:i] + word[i + 1:]
        elif op == "ins":
            w = word[:i] + rng.choice(neighbours(word[i]) + [word[i]]) + word[i:]
        else:
            if i == len(word) - 1:
                continue
            w = word[:i] + word[i + 1] + word[i] + word[i + 2:]
        if w != word:
            return op, w


def clean_query(n, products, rng):
    p = rng.choice(products)
    if n == 1:
        return [p]
    if n == 2:
        return [rng.choice(BRANDS + COLORS + ATTRS + MATERIALS), p]
    if n == 3:
        return rng.choice([[rng.choice(BRANDS), rng.choice(ATTRS), p],
                           [rng.choice(COLORS), rng.choice(MATERIALS), p],
                           [p, "for", rng.choice(AUDIENCE)]])
    if n == 4:
        return rng.choice([[rng.choice(BRANDS), rng.choice(COLORS), rng.choice(ATTRS), p],
                           [rng.choice(ATTRS), p, "for", rng.choice(AUDIENCE)]])
    return rng.choice([[rng.choice(BRANDS), rng.choice(ATTRS), p, "for", rng.choice(AUDIENCE)],
                       [rng.choice(COLORS), rng.choice(MATERIALS), p, "for", rng.choice(AUDIENCE)]])


def build(products, per_len, seed):
    rng = random.Random(seed)
    rows, seen = [], set()
    for n in range(1, 6):
        k = 0
        while k < per_len:
            words = clean_query(n, products, rng)
            target = " ".join(words)
            if rng.random() < 0.15:          # leave clean: the model must not "fix" it
                src, edits = target, []
            else:
                idx = [i for i, w in enumerate(words) if len(w) >= 3]
                m = 1 if n <= 2 else rng.choice([1, 1, 2])
                edits, out = [], list(words)
                for i in rng.sample(idx, min(m, len(idx))):
                    op, out[i] = typo(words[i], rng)
                    edits.append(op)
                src = " ".join(out)
            if src in seen:
                continue
            seen.add(src)
            rows.append({"query": src, "target": target, "n_words": n, "edits": edits})
            k += 1
    return rows


if __name__ == "__main__":
    for name, prods, per_len, seed in [("dev", DEV_PRODUCTS, 40, 1), ("test", TEST_PRODUCTS, 60, 2)]:
        rows = build(prods, per_len, seed)
        with open(os.path.join(HERE, f"{name}.jsonl"), "w") as f:
            for r in rows:
                f.write(json.dumps(r) + "\n")
        print(name, len(rows), "queries,", sum(not r["edits"] for r in rows), "clean")
