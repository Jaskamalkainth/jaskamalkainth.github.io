---
name: new-blog-post
description: Write and publish a new blog post on jaskamalkainth.github.io that meets the site's SEO, AEO (answer engines) and GEO (AI citation) rules end to end - front matter, direct-answer summary, FAQ, fact-checking, homepage wiring, build and lint checks. Use whenever the owner asks to add, create, write or publish a blog post, article, guide or note on the site.
---

# New blog post

The rules live in `AGENTS.md` ("Writing a new blog post"). Read that section first, then work
through this checklist in order, ticking off each item before moving to the next. Don't skip
steps because the post is short.

1. **Brief**: state the one question the post answers, the audience and the sources. Find primary
   sources for any factual or time-sensitive claim.
2. **File**: copy `blog_posts/_new-post-template.md` to `blog_posts/<lowercase-hyphen-slug>.md`;
   delete `published: false`.
3. **Front matter**: `title` (≤ 65 chars, main phrase first), `description` (120-160 chars, answers
   on its own), `date` and `last_modified_at` (today), `keywords` (4-8), `related` (2-3 posts), `faq` (3-5),
   `math: true` if there's LaTeX.
4. **Body**: one H1; `> **In short:**` 40-60 word answer under it; question-style `##` headings;
   short self-contained paragraphs; tables/lists for comparisons; code blocks with a language;
   2-3 internal links; links to sources; alt text and `loading="lazy"` on images; `title` on iframes.
5. **Accuracy**: run every code sample, recompute every number, verify every quote and
   attribution, add "as of <Month YYYY>" to prices/specs/versions. Add the Samsung disclosure line
   if the post recommends or compares Samsung or competing products. Never invent facts or sources.
6. **Wiring**: add the post to `_data/work_beyond.yml` (homepage + search) and to the `related:` list of
   1-3 existing posts. **Exception:** if the owner wants the post off the homepage, set
   `homepage: false` and skip `_data/work_beyond.yml`. The post keeps its URL, sitemap and
   `llms.txt` entry. C++ notes also go in the `notes:` list of `blog_posts/CppNotes.md`.
   If the post has an interactive demo, put it on the **same** card as a link with `demo: true`;
   never add a second card for it.
7. **Verify**:
   ```sh
   jekyll build -d /tmp/site
   ruby scripts/check_posts.rb --site /tmp/site blog_posts/<slug>.md
   ruby scripts/check_posts.rb
   ```
   0 errors. Fix or explain every warning. Screenshot the page if Chromium is available.
8. **Hand off**: commit (`Add post: <title>`), push to the working branch, and tell the owner the URL,
   what you couldn't verify, and the post-publish steps: Search Console *Request indexing*,
   Bing URL submission, and checking Search Console → Performance after 2-3 days.
