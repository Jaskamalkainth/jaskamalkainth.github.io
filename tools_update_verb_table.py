import re
from pathlib import Path

MD_PATH = Path("blog_posts/korean-learning-notes.md")
TSV_PATH = Path("blog_posts/verbs_tenses.tsv")
SITE_HTML_PATH = Path("_site/blog_posts/korean-learning-notes.html")

CHO = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"]
JUNG = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"]
JONG = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "l", "m", "p", "p", "t", "t", "t", "ng", "t", "t", "k", "t", "p", "t"]

# When a syllable ends with a final consonant (받침) and the next syllable starts with ㅇ (silent),
# Korean pronunciation typically "liaisons" the final consonant into the next syllable onset.
# This mapping lets us approximate that in romanization.
#
# Indices are Hangul jongseong (final consonant) indexes (0..27) mapped to choseong (initial) indexes (0..18).
JONG_TO_CHO = {
    1: 0,   # ㄱ -> ㄱ
    2: 1,   # ㄲ -> ㄲ
    3: 0,   # ㄳ -> ㄱ (approx)
    4: 2,   # ㄴ -> ㄴ
    5: 2,   # ㄵ -> ㄴ (approx)
    6: 2,   # ㄶ -> ㄴ (approx)
    7: 3,   # ㄷ -> ㄷ
    8: 5,   # ㄹ -> ㄹ
    9: 0,   # ㄺ -> ㄱ (approx)
    10: 6,  # ㄻ -> ㅁ (approx)
    11: 7,  # ㄼ -> ㅂ (approx)
    12: 9,  # ㄽ -> ㅅ (approx)
    13: 16, # ㄾ -> ㅌ (approx)
    14: 17, # ㄿ -> ㅍ (approx)
    15: 18, # ㅀ -> ㅎ (approx)
    16: 6,  # ㅁ -> ㅁ
    17: 7,  # ㅂ -> ㅂ
    18: 7,  # ㅄ -> ㅂ (approx)
    19: 9,  # ㅅ -> ㅅ
    20: 10, # ㅆ -> ㅆ
    21: 11, # ㅇ -> ㅇ
    22: 12, # ㅈ -> ㅈ
    23: 14, # ㅊ -> ㅊ
    24: 15, # ㅋ -> ㅋ
    25: 16, # ㅌ -> ㅌ
    26: 17, # ㅍ -> ㅍ
    27: 18, # ㅎ -> ㅎ
}


def is_hangul_syllable(ch: str) -> bool:
    o = ord(ch)
    return 0xAC00 <= o <= 0xD7A3


def decomp(ch: str):
    o = ord(ch) - 0xAC00
    cho = o // 588
    jung = (o % 588) // 28
    jong = o % 28
    return cho, jung, jong


def romanize(text: str) -> str:
    # Tokenize into syllable "runs" separated by non-hangul chars so we can apply liaison only within a run.
    out_parts = []
    buf = []

    def flush_buf():
        nonlocal buf
        if not buf:
            return
        # Decompose
        sylls = [list(decomp(ch)) for ch in buf]  # [cho, jung, jong]
        # Apply liaison: if current has jong and next starts with ㅇ, move jong to next cho.
        for i in range(len(sylls) - 1):
            cho, jung, jong = sylls[i]
            n_cho, n_jung, n_jong = sylls[i + 1]
            if jong != 0 and n_cho == 11:  # next starts with ㅇ
                moved = JONG_TO_CHO.get(jong)
                if moved is not None:
                    sylls[i][2] = 0
                    sylls[i + 1][0] = moved
        # Romanize
        for cho, jung, jong in sylls:
            out_parts.append(CHO[cho] + JUNG[jung] + JONG[jong])
        buf = []

    for ch in text:
        if is_hangul_syllable(ch):
            buf.append(ch)
        else:
            flush_buf()
            out_parts.append(ch)
    flush_buf()

    s = "".join(out_parts)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def html_escape(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def ko_cell(text: str) -> str:
    t = text.strip()
    return f'<td class="ko-cell"><div class="ko">{html_escape(t)}</div><div class="rom">{html_escape(romanize(t))}</div></td>'


def html_row(dict_phrase: str, eng: str, present: str, past: str, future: str) -> str:
    return (
        "                  <tr>\n"
        f"                    {ko_cell(dict_phrase)}\n"
        f"                    <td>{html_escape(eng.strip())}</td>\n"
        f"                    {ko_cell(present)}\n"
        f"                    {ko_cell(past)}\n"
        f"                    {ko_cell(future)}\n"
        "                  </tr>"
    )


def read_tsv_rows():
    raw = TSV_PATH.read_text(encoding="utf-8").splitlines()
    rows = []
    for i, line in enumerate(raw):
        if not line.strip():
            continue
        if i == 0:
            continue  # header
        cols = line.split("\t")
        while len(cols) < 5:
            cols.append("")
        dict_phrase, eng, present, past, future = cols[:5]
        rows.append((dict_phrase, eng, present, past, future))
    return rows


def is_simple_verb(dict_phrase: str) -> bool:
    """
    "Simple verbs" for this page:
    - dictionary form ending with '다'
    - single token (no spaces)
    - excludes formal endings like '...니다' / '...습니다'

    This intentionally excludes polite set phrases like '감사합니다' and formal styles like '먹습니다'.
    """
    s = dict_phrase.strip()
    return bool(s) and s.endswith("다") and not s.endswith(("니다", "습니다")) and (" " not in s)


def replace_verbs_tbody(doc: str, *, source_label: str) -> str:
    m = re.search(r'(<table class="verbs-table">[\s\S]*?<tbody>)([\s\S]*?)(</tbody>)', doc)
    if not m:
        raise SystemExit(f"Could not find verbs-table tbody in {source_label}")

    rows = [r for r in read_tsv_rows() if is_simple_verb(r[0])]
    insertion = (
        "\n"
        "                  <!-- Generated from blog_posts/verbs_tenses.tsv (simple -다 verbs only; edit TSV, then run: python tools_update_verb_table.py) -->\n"
        + "\n".join(html_row(*r) for r in rows)
        + "\n"
    )

    return doc[: m.start(2)] + insertion + doc[m.end(2) :]


def main():
    md = MD_PATH.read_text(encoding="utf-8")
    md2 = replace_verbs_tbody(md, source_label=str(MD_PATH))
    MD_PATH.write_text(md2, encoding="utf-8")
    print(f"Updated: {MD_PATH} (rows: {len(read_tsv_rows())})")

    if SITE_HTML_PATH.exists():
        html = SITE_HTML_PATH.read_text(encoding="utf-8")
        html2 = replace_verbs_tbody(html, source_label=str(SITE_HTML_PATH))
        SITE_HTML_PATH.write_text(html2, encoding="utf-8")
        print(f"Updated: {SITE_HTML_PATH} (rows: {len(read_tsv_rows())})")


if __name__ == '__main__':
    main()
