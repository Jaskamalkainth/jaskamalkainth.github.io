# Agent guide: jaskamalkainth.github.io

Instructions for any AI agent (Claude Code, Codex, Cursor, Gemini, ...) working in this repository.
The most common task is **"write / add a new blog post"**. Follow the workflow below end to end;
a post isn't done until every step, including the checks in step 8, has passed.

The goal of every post is the same: rank in search engines (**SEO**), be picked as *the* answer in
snippets and AI overviews (**AEO**, answer engine optimization), and be cited accurately by ChatGPT,
Perplexity, Claude, Gemini and similar tools (**GEO**, generative engine optimization).
Most of the plumbing is already built into the layout; your job is the content, the front matter,
and wiring the post into the site.

---

## 1. How the site works

- **Jekyll on GitHub Pages**, no Gemfile. Plugins (whitelisted by GitHub Pages): `jekyll-sitemap`, `jekyll-seo-tag`.
- Pushing to `master` deploys the live site. Work on a branch; changes reach `master` through a PR the owner merges.
- **Build locally** to verify (install once with `gem install github-pages` if `jekyll` is missing):
  ```sh
  jekyll build -d /tmp/site          # must finish with no errors
  ruby scripts/check_posts.rb --site /tmp/site   # SEO/AEO/GEO rules; must report 0 errors
  ```

| Path | What it is |
|---|---|
| `blog_posts/*.md` | Blog posts. URL is `/blog_posts/<filename>.html`. |
| `blog_posts/_new-post-template.md` | Starting point for every new post. Copy it. |
| `blog_posts/CppNotesDb/N.md` | Short C++ notes; indexed from `blog_posts/CppNotes.md` (`notes:` list). |
| `blog_posts/experiments/*/` | Standalone interactive demos (own HTML, `layout: null` or no front matter). |
| `_layouts/post.html` | Post layout. **Already emits** all meta/OG tags, JSON-LD, byline, FAQ, author card, related links. |
| `_includes/post_schema.html` | Person, BreadcrumbList and FAQPage JSON-LD. |
| `_data/authors.yml` | Author bio, job, `sameAs` profiles (E-E-A-T). Update here, never per post. |
| `_data/work_beyond.yml` | **Homepage cards and homepage search.** Every post goes here unless it has `homepage: false`. |
| `_config.yml` | `defaults:` give every post `layout: post`, `author`, default `image`. |
| `llms.txt`, `sitemap.xml`, `robots.txt` | Generated or static; new posts appear in the first two **automatically**. |
| `scripts/check_posts.rb` | Linter for the rules in this file. |
| `css/blog_post.css` | Shared post styles (light/dark tokens). Posts may add their own `<style>`. |

### What the layout already does (don't duplicate it in a post)
`<title>`, meta description, canonical URL, Open Graph/Twitter tags, `article:published_time` /
`modified_time`, BlogPosting + Person + BreadcrumbList (+ FAQPage) JSON-LD, the visible byline with
published/updated dates, the FAQ section, the author card, "Keep reading" links, Google Tag Manager
(analytics), KaTeX when `math: true`. **Never** hand-write `<meta>`, `<link rel="canonical">`,
JSON-LD, an author box or an FAQ block inside a post body; set front matter instead.

---

## 2. Writing a new blog post: workflow

### Step 1: Pin down the brief
Before writing, know: the topic, the **one question the post answers**, the audience, and the
sources. If the owner didn't give sources for factual or time-sensitive claims (prices, specs,
versions, statistics), find primary sources yourself and cite them. Ask only if the topic itself is unclear.

### Step 2: Create the file
- Copy `blog_posts/_new-post-template.md` to `blog_posts/<slug>.md` and **delete the `published: false` line**.
- `<slug>`: lowercase, hyphen-separated, descriptive, no dates or stop-word padding
  (`bloom-filter-false-positives.md`, not `Post1.md` or `my_new_post_2026.md`).
- **The slug is permanent.** Never rename or move a published post; that breaks links and loses ranking.

### Step 3: Front matter (all required unless marked optional)

| Field | Rule |
|---|---|
| `title` | ≤ 60-65 characters, main search phrase first, specific ("Bloom Filters Explained: How They Work, False Positives and C++ Code"). Unique across the site. |
| `description` | 120-160 characters, unique, a complete answer in itself; no "In this post I will...". Becomes the meta description and the snippet AI tools show. |
| `date` | First publication date (`YYYY-MM-DD`). Never change after publishing. |
| `last_modified_at` | Same as `date` for a new post. See section 4 for updates. |
| `keywords` | YAML list of 4-8 phrases people actually type: main phrase, synonyms, sub-topics, named entities. No stuffing. |
| `related` | 2-3 URLs of existing posts on nearby topics (`/blog_posts/x.html`). Also add the new post to **their** `related:`. |
| `homepage: false` | Optional. Makes the post **unlisted**: see "Unlisted posts" below. Only when the owner asks for it. |
| `faq` | 3-5 items of `q:`/`a:`. See step 5. Optional for very short notes, expected for guides and explainers. |
| `image` | Optional (defaults to `/img/pixelate.jpg`). Prefer a post-specific 1200×630 image in `/img/`. |
| `math: true` | Optional; required if the post has LaTeX. |
| `categories`, `post_theme`, `wide`, `parent_url`/`parent_title` | Optional; see the template. |

### Step 4: Content structure (what search and answer engines reward)
1. **Exactly one H1** (`# ...`) at the top, matching the title's topic. Then `##` and `###`; never skip levels.
2. **A direct answer right under the H1**, as a blockquote starting with `**In short:**`
   (or `**Quick answer:**` for buying guides): 40-60 words, answer first, with the key number,
   definition or recommendation. This is the passage most likely to be quoted.
3. **Question-style or clearly descriptive H2s** that match how people search
   ("How many hash functions should a Bloom filter use?").
4. **Self-contained paragraphs** of 2-4 sentences: each should still make sense if quoted alone.
   Define terms on first use. Prefer concrete numbers, units and examples over vague claims.
5. **Lists and tables** for steps and comparisons; they get lifted into snippets.
6. **Code blocks** always declare a language (` ```cpp `, ` ```python `, ` ```sh `).
7. **Internal links**: 2-3 contextual links in the body to related posts or demos, with descriptive anchor text (not "click here").
8. **External links** to primary sources (official docs, papers, vendor pages) for every non-obvious fact.
   A short `## Sources` or `## Further reading` section at the end is welcome.
9. **Images**: under `/img/`, descriptive `alt` text describing what the image actually shows
   (look at it; include any text in the image), plus `width`, `height` and `loading="lazy"`.
10. **Embeds** (`<iframe>`): `title="..."` and `loading="lazy"`.
11. **Math**: `$$ ... $$` on its own lines plus `math: true`. Never `\[ ... \]` in Markdown.
12. Length follows the question: complete, not padded. No filler intros, no keyword stuffing,
    no generic AI-sounding paragraphs. The owner's voice is first person and direct.

### Step 5: FAQ (front matter `faq:`)
- 3-5 questions real people search, phrased as they'd type them and ending with `?`.
- Each answer: 40-80 words, factual, standalone (no "as mentioned above"), consistent with the body.
- Don't repeat the H2s word for word; use the FAQ for the adjacent questions (comparisons, "can I...", "how much...").
- The layout renders them visibly **and** as FAQPage JSON-LD; don't add FAQ HTML to the body.

### Step 6: Accuracy (the GEO rule that matters most)
AI engines repeat mistakes, so a wrong fact does more harm than a missing one.
- **Run every code sample** and state its real output. (A past post claimed a C++ snippet printed `2`; it printed `1`.)
- **Recompute every number** (formulas, examples, complexities). (A past worked example was off by 13 orders of magnitude.)
- **Verify quotes and attributions** against the original work; many famous quotes are misattributed.
  If unsure, paraphrase and attribute the idea instead of quoting.
- **Version- and time-sensitive facts** (software versions, prices, specs, offers) need the version or
  "as of <Month YYYY>" in the text and a link to the source.
- **Never invent** statistics, benchmarks, quotes, sources, reviews or experiences. If something can't
  be verified, leave it out or say it's unverified.
- **Conflicts of interest**: the owner works at Samsung R&D Institute India. Any post that reviews,
  compares or recommends Samsung (or competing) products must carry this line under the summary:
  *Disclosure: I work at Samsung R&D Institute India. This is a personal post, not an official Samsung publication; it is based only on Samsung's public product pages, linked throughout.*
- Content assisted by AI is fine; content not checked by the steps above is not.

### Step 7: Wire it into the site
1. **Homepage**: add an entry to `_data/work_beyond.yml`, **unless the post has `homepage: false`**
   (see "Unlisted posts" below). Without an entry, a listed post is an orphan page that only the
   sitemap points to. Technical posts go under `work:` with
   `kind:` one of `search | algorithms | math | experiments | notes`; personal essays go under `beyond:`.
   ```yaml
   - title: "Bloom Filters"
     kind: "algorithms"
     date: "2025-03"              # YYYY-MM, used for sorting
     desc: "One line, under ~100 chars."
     meta: "Mar 2025"
     links:
       - label: "Article"
         url: "/blog_posts/bloom_filters.html"
       - label: "Demo"            # only if the topic has an interactive demo (section 5)
         url: "/blog_posts/experiments/bloom-filter/index.html"
         demo: true
     href: "/blog_posts/bloom_filters.html"
   ```
   **One topic, one card.** A post and its interactive demo share a single entry; never add a
   second card for the demo. Mark the demo link with `demo: true`: the card then shows an
   "▶ interactive demo" badge and a highlighted demo button, appears under the *experiments*
   filter as well as its own `kind`, and homepage search mentions the demo.
2. **Related posts**: add the new URL to the `related:` list of 1-3 existing posts it relates to.
3. **C++ notes only**: add `{ n: N, title: "...", date: YYYY-MM-DD }` to `notes:` in `blog_posts/CppNotes.md`.
4. Sitemap, `llms.txt` and analytics need **no** changes; they pick the post up automatically.

### Step 8: Verify (all must pass before committing)
```sh
jekyll build -d /tmp/site                                          # no Liquid/YAML errors
ruby scripts/check_posts.rb --site /tmp/site blog_posts/<slug>.md  # 0 errors; read every WARN and fix or justify it
ruby scripts/check_posts.rb                                        # whole site: catches duplicate titles/descriptions
```
With `--site`, the checker also confirms the built page has its own meta description (not the site
tagline), every JSON-LD block parses, and the post is in `sitemap.xml` (with `<lastmod>`) and `llms.txt`.

Then look at the page: open `/tmp/site/blog_posts/<slug>.html`, or if Chromium is available,
screenshot it at desktop and phone width in light and dark mode
(`chromium --headless --screenshot=out.png --window-size=1200,2000 file:///tmp/site/blog_posts/<slug>.html`).
Check that the summary, headings, code, tables, images, FAQ and author card render correctly.

### Step 9: Commit and hand off
- One commit per post, message like `Add post: <title>` with a short body listing sources checked.
- Push to the working branch. Open the PR if the owner asked for one; never push straight to `master` unless told to.
- Tell the owner, briefly: the URL, the summary, anything you couldn't verify, and the
  **post-publish steps only they can do**:
  1. Google Search Console → URL Inspection → paste the post URL → *Request indexing*.
  2. Bing Webmaster Tools → URL Submission (Bing's index also feeds ChatGPT search).
  3. After 2-3 days, check Search Console → Performance → filter by page for queries and clicks.

---

### Unlisted posts (`homepage: false`)
Some posts should have a public URL and be fully readable by search engines and AI agents, but
**not** appear on the homepage (cards or homepage search). The Samsung buying guides are like this.
- Set `homepage: false` in the front matter and **don't** add the post to `_data/work_beyond.yml`.
  The checker treats a post that has the flag *and* a homepage entry as an error.
- Everything else still applies: full front matter, summary, FAQ, accuracy, verification.
- The post is still indexed: it stays in `sitemap.xml` and `llms.txt`, keeps its JSON-LD, and is
  not `noindex`. This flag only hides it from the homepage, nothing else.
- `related:` links from other posts are optional; add them only between posts on the same topic,
  and only if the owner is happy for the post to be reachable from those pages.
- Only use it when the owner asks for a post to stay off the homepage. If it's unclear, ask.

## 3. Don'ts
- Don't rename, move or delete a published post, or change its `date`.
- Don't hand-write meta tags, canonical links, JSON-LD, bylines or FAQ HTML in a post.
- Don't create a page outside `blog_posts/` for a blog post (it won't get the post layout or defaults).
- Don't add tracking scripts per post; Google Tag Manager is already in the layout.
- Don't stuff keywords, pad length, or add generic filler written to "sound SEO".
- Don't publish facts, code output, numbers or quotes you haven't verified.
- Don't block crawlers or add `noindex`, and don't remove AI crawlers from `robots.txt`.

## 4. Updating an existing post
- Bump `last_modified_at` **only** for substantive changes (new or corrected content), and only
  after re-checking time-sensitive facts; it shows readers and search engines an "Updated" date.
  Typos and styling don't count.
- Keep the URL and `date`. Fix wrong facts in place, and add a version/date caveat where content has aged.
- Run step 8 again.

## 5. Interactive demos (`blog_posts/experiments/<name>/index.html`)
Standalone HTML pages don't get the post layout, so each one needs by hand, in `<head>`:
`<title>Name: what it does | Jaskamal Kainth</title>`, `<meta name="description">`,
`<link rel="canonical" href="https://jaskamalkainth.github.io/blog_posts/experiments/<name>/">`,
`og:title` / `og:description` / `og:url` / `og:image`, `lang="en"` on `<html>`, and the Google Tag
Manager snippet (copy from `_includes/gtm-head.html` and `_includes/gtm-body.html`, or
`{% include gtm-head.html %}` if the file has `layout: null` front matter). Link the demo from
its article near the top (e.g. a "**Try it first:**" line), and link back to the article from the demo.
On the homepage, a demo that has an article goes on **the article's card** as a link with `demo: true`
(see step 7), not as a separate card. Only a demo with no article gets its own entry, with
`kind: "experiments"`.
