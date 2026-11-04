"""Prompt-only baselines on dev and test: the plain prompt, and a 5-shot prompt."""
import common as c, wsp
tok, m = c.load()
for split in ("dev", "test"):
    c.run(split, tok, m, "base", count=False)
c.prompt = wsp.fewshot_prompt
for split in ("dev", "test"):
    c.run(split, tok, m, "fewshot", count=False)
