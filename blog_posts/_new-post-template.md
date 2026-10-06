---
published: false ## keep this file itself out of the build; copy it to start a new post (delete this line in the copy)
# Full rules: AGENTS.md > "Writing a new blog post". Check your post with: ruby scripts/check_posts.rb blog_posts/<file>.md
title: "Primary Topic: What the Reader Gets"     ## ≤ 60-65 chars; main search phrase first; " | Jaskamal Kainth" is appended
description: "One or two plain sentences, 120-160 chars, that answer the search on their own. Becomes the meta description and AI snippet."
date: 2026-01-01                                 ## first publication; never change it later
last_modified_at: 2026-01-01                     ## = date at first; bump only for substantive edits (drives sitemap <lastmod> and "Updated")
keywords: [main phrase, synonym, sub-topic, related entity]   ## 4-8 phrases people actually search
categories: some-topic another-topic
image: "/img/pixelate.jpg"                       ## social-share image; prefer a post-specific 1200x630 image in /img/
related: ["/blog_posts/bloom_filters.html", "/blog_posts/segment_tree_problems.html"]   ## 2-3 existing posts, shown as "Keep reading"
faq:                                             ## 3-5 real questions; each answer 40-80 words and makes sense on its own
  - q: "What is ...?"
    a: "A direct, factual answer that would still be correct if quoted alone."
  - q: "How does ... compare to ...?"
    a: "..."
# math: true         ## only if the post has LaTeX ($$ ... $$ on its own lines); loads KaTeX
# post_theme: light  ## only for posts that ship their own light-only CSS; default follows the site's light/dark toggle
# wide: true         ## 1200px content width instead of 900px
# For a filterable problem list, add `levels:` and `problems:` (see segment_tree_problems.md)
# and put {% include problem_list.html %} in the body.
---

# Primary Topic: What the Reader Gets

> **In short:** a 40-60 word direct answer to the question this post exists for. Lead with the answer, include the key number or definition, and make it quotable on its own.

One or two paragraphs of context: why this matters, and what the reader will be able to do after reading.

## What is ...?

Use question-style or clearly descriptive H2s. Keep paragraphs short (2-4 sentences). Use lists and tables for comparisons.

## How ... works

```cpp
// Code blocks always name their language. Run the code before publishing.
```

## Sources

- [Primary source or official documentation](https://example.com)
