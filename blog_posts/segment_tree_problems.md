---
title: "Segment Tree Problems"
description: "20 hand-picked segment tree problems from LightOJ, SPOJ and Codeforces, sorted by difficulty and tagged by technique, with solutions."
date: 2016-06-08
levels: [Beginner, Easy, Medium, Hard]
problems:
  - name: "Array Queries"
    level: Beginner
    judge: LightOJ
    code: "1082"
    url: "https://lightoj.com/problem/array-queries"
    solution: "https://github.com/Jaskamalkainth/LightOJ/blob/master/1082arrQueries.cpp"
    tags: [Range min]
    desc: "Find the minimum value in a range [l, r]."
  - name: "Binary Simulation"
    level: Easy
    judge: LightOJ
    code: "1080"
    url: "https://lightoj.com/problem/binary-simulation"
    solution: "https://github.com/Jaskamalkainth/LightOJ/blob/master/1080_bin_simulation.cpp"
    tags: [Lazy propagation]
    ops:
      - "Invert every bit in [i, j]"
      - "Report whether the i-th bit is 0 or 1"
  - name: "Curious Robin Hood"
    level: Easy
    judge: LightOJ
    code: "1112"
    url: "https://lightoj.com/problem/curious-robin-hood"
    solution: "https://github.com/Jaskamalkainth/LightOJ/blob/master/1112CRobinhood.cpp"
    tags: [Point update, Range sum]
    ops:
      - "Report a[id], then set it to zero"
      - "Add v to a[id]"
      - "Sum of [l, r]"
  - name: "Horrible Queries"
    level: Easy
    judge: SPOJ
    code: "HORRIBLE"
    url: "https://www.spoj.com/problems/HORRIBLE/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/horrible.cpp"
    tags: [Lazy propagation, Range sum]
    ops:
      - "Add v to every number in [l, r]"
      - "Sum of [l, r]"
  - name: "Xenia and Bit Operations"
    level: Medium
    judge: Codeforces
    code: "339D"
    url: "https://codeforces.com/problemset/problem/339/D"
    solution: "https://github.com/Jaskamalkainth/Codeforces/blob/master/xeniaBit.cpp"
    tags: [Point update, Custom merge]
    ops:
      - "Assign a<sub>p</sub> = b"
      - "Print v, obtained by alternately OR-ing and XOR-ing adjacent pairs up the tree"
  - name: "Shoot and Kill"
    level: Medium
    judge: SPOJ
    code: "BGSHOOT"
    url: "https://www.spoj.com/problems/BGSHOOT/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/BGSHOOT.cpp"
    tags: [Coordinate compression, Lazy propagation, Range max]
    desc: "Animals are present during time intervals. For each query [L, R] (the hunter's time in the forest), find the most animals a single shot at any moment in [L, R] can hit."
  - name: "Can you answer these queries I"
    level: Medium
    judge: SPOJ
    code: "GSS1"
    url: "https://www.spoj.com/problems/GSS1/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/gss1.cpp"
    tags: [Custom merge, Max subarray]
    desc: "Query(x, y) = max { a[i] + … + a[j] : x ≤ i ≤ j ≤ y }."
  - name: "Can you answer these queries III"
    level: Medium
    judge: SPOJ
    code: "GSS3"
    url: "https://www.spoj.com/problems/GSS3/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/gss3.cpp"
    tags: [Custom merge, Max subarray, Point update]
    ops:
      - "Set the i-th element to v"
      - "Query(x, y) = max { a[i] + … + a[j] : x ≤ i ≤ j ≤ y }"
  - name: "Maximum Sum"
    level: Medium
    judge: SPOJ
    code: "KGSS"
    url: "https://www.spoj.com/problems/KGSS/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/kgss.cpp"
    tags: [Custom merge, Point update]
    ops:
      - "Set A[i] = x"
      - "Find i ≠ j in [x, y] maximising A[i] + A[j]"
  - name: "Election Posters"
    level: Medium
    judge: SPOJ
    code: "POSTERS"
    url: "https://www.spoj.com/problems/POSTERS/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/posters.cpp"
    tags: [Coordinate compression, Lazy propagation]
    desc: "Posters are glued in order, the i-th covering sections [l<sub>i</sub>, r<sub>i</sub>]. Count the posters that are still at least partly visible."
  - name: "Brackets"
    level: Medium
    judge: SPOJ
    code: "BRCKTS"
    url: "https://www.spoj.com/problems/BRCKTS/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/brackets.cpp"
    tags: [Custom merge, Brackets, Point update]
    ops:
      - "Flip the i-th bracket"
      - "Check whether the whole word is a correct bracket sequence"
  - name: "Light Switching"
    level: Medium
    judge: SPOJ
    code: "LITE"
    url: "https://www.spoj.com/problems/LITE/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/lite.cpp"
    tags: [Lazy propagation, Range sum]
    ops:
      - "Toggle every switch in [l, r]"
      - "Count lights that are on in [l, r]"
  - name: "Counting Primes"
    level: Medium
    judge: SPOJ
    code: "CNTPRIME"
    url: "https://www.spoj.com/problems/CNTPRIME/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/cntprime.cpp"
    tags: [Lazy propagation, Range sum]
    ops:
      - "Set every number in [x, y] to v"
      - "Count primes in [x, y]"
  - name: "Sereja and Brackets"
    level: Medium
    judge: Codeforces
    code: "380C"
    url: "https://codeforces.com/problemset/problem/380/C"
    solution: "https://github.com/Jaskamalkainth/Codeforces/blob/master/serejabrackets.cpp"
    tags: [Custom merge, Brackets]
    desc: "For each query [l, r], find the length of the longest correct bracket subsequence of s[l..r]."
  - name: "Multiples of 3"
    level: Medium
    judge: SPOJ
    code: "MULTQ3"
    url: "https://www.spoj.com/problems/MULTQ3/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/multq3.cpp"
    tags: [Lazy propagation]
    ops:
      - "Add 1 to every number in [A, B]"
      - "Count numbers in [A, B] divisible by 3"
  - name: "Can you answer these queries V"
    level: Hard
    judge: SPOJ
    code: "GSS5"
    url: "https://www.spoj.com/problems/GSS5/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/gss5.cpp"
    tags: [Custom merge, Max subarray]
    desc: "Query(x1, y1, x2, y2) = max { A[i] + … + A[j] : x1 ≤ i ≤ y1, x2 ≤ j ≤ y2 }, with x1 ≤ x2 and y1 ≤ y2. The two ranges may overlap."
  - name: "XOR on Segment"
    level: Hard
    judge: Codeforces
    code: "242E"
    url: "https://codeforces.com/problemset/problem/242/E"
    solution: "https://github.com/Jaskamalkainth/Codeforces/blob/master/xor_on_segment.cpp"
    tags: [Lazy propagation, Range sum, Bitwise]
    ops:
      - "XOR every element in [l, r] with x"
      - "Sum of [l, r]"
  - name: "K-Query Online"
    level: Hard
    judge: SPOJ
    code: "KQUERYO"
    url: "https://www.spoj.com/problems/KQUERYO/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/KqueryOnline.cpp"
    tags: [Merge sort tree]
    desc: "For each query (i, j, k), count the elements of a<sub>i</sub>, …, a<sub>j</sub> greater than k. Queries are encoded, so they must be answered online."
  - name: "Ant Colony"
    level: Hard
    judge: Codeforces
    code: "474F"
    url: "https://codeforces.com/problemset/problem/474/F"
    solution: "https://github.com/Jaskamalkainth/Codeforces/blob/master/271_ant_colony.cpp"
    tags: [Custom merge, GCD]
    desc: "In [l, r] every pair of ants fights; ant i scores a point when s<sub>i</sub> divides s<sub>j</sub>. Ants with exactly r − l points are freed. Count how many ants get eaten."
  - name: "GM Plants"
    level: Hard
    judge: SPOJ
    code: "IOPC1207"
    url: "https://www.spoj.com/problems/IOPC1207/"
    solution: "https://github.com/Jaskamalkainth/Spoj/blob/master/IOPC1207.cpp"
    tags: [Lazy propagation, Inclusion–exclusion]
    desc: "An N<sub>x</sub> × N<sub>y</sub> × N<sub>z</sub> box of unit cubes. Toggle whole slabs along the X, Y or Z axis, then count red cubes inside a cuboid (x1, y1, z1)–(x2, y2, z2)."
---

{%- assign all_tags = "" | split: "" -%}
{%- for p in page.problems -%}{%- assign all_tags = all_tags | concat: p.tags -%}{%- endfor -%}
{%- assign all_tags = all_tags | uniq | sort -%}

<style>
  .st { --bg:#0a0f1e; --card:#111830; --card-2:#17203d; --border:#24305a; --text:#e6ebf5; --muted:#8f9cbb;
        --accent:#5eead4; --accent-ink:#04201c; --beginner:#60a5fa; --easy:#4ade80; --medium:#fbbf24; --hard:#f87171;
        color-scheme: dark; }
  .st.light { --bg:#f6f7fb; --card:#ffffff; --card-2:#eef1f8; --border:#d6dbe8; --text:#1b2236; --muted:#5b6582;
        --accent:#0f766e; --accent-ink:#ffffff; --beginner:#2563eb; --easy:#15803d; --medium:#b45309; --hard:#b91c1c;
        color-scheme: light; }
  html, body { background: var(--page-bg, #0a0f1e); }
  body { margin: 0; }
  body > div { max-width: 900px !important; }
  body > div > a { color: var(--page-accent, #5eead4); font: 500 14px/1.4 system-ui, sans-serif; text-decoration: none; }
  body > div > a:hover { text-decoration: underline; }
  .st { color: var(--text); font: 16px/1.6 Inter, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .st *, .st *::before, .st *::after { box-sizing: border-box; }
  .st a { color: var(--accent); }
  .st h1 { font-size: clamp(28px, 6vw, 40px); line-height: 1.15; margin: 20px 0 8px; letter-spacing: -0.02em; }
  .st .lede { color: var(--muted); margin: 0 0 20px; max-width: 62ch; }
  .st .hero { display: grid; grid-template-columns: 1fr 220px; gap: 24px; align-items: center; }
  .st .hero img { width: 100%; height: auto; border-radius: 12px; background: #fff; padding: 8px; border: 1px solid var(--border); }
  @media (max-width: 640px) { .st .hero { grid-template-columns: 1fr; } .st .hero img { display: none; } }

  .st .progress { display: flex; align-items: center; gap: 12px; margin: 8px 0 20px; font-size: 14px; color: var(--muted); }
  .st .bar { flex: 1; height: 8px; border-radius: 99px; background: var(--card-2); overflow: hidden; }
  .st .bar > i { display: block; height: 100%; width: 0; background: var(--accent); border-radius: inherit; transition: width .3s ease; }
  .st .progress button { background: none; border: 0; color: var(--muted); font: inherit; cursor: pointer; text-decoration: underline; padding: 0; }

  .st .toolbar { position: sticky; top: 0; z-index: 5; background: var(--bg); padding: 12px 0; border-bottom: 1px solid var(--border);
                 display: flex; flex-direction: column; gap: 10px; }
  .st .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .st input[type=search], .st select { font: inherit; font-size: 15px; color: var(--text); background: var(--card); border: 1px solid var(--border);
                 border-radius: 10px; padding: 8px 12px; min-height: 40px; }
  .st input[type=search] { flex: 1 1 220px; min-width: 0; }
  .st select { flex: 0 1 auto; max-width: 100%; }
  .st input:focus-visible, .st select:focus-visible, .st button:focus-visible, .st a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .st .chip { font: 500 13px/1 system-ui, sans-serif; color: var(--muted); background: var(--card); border: 1px solid var(--border);
              border-radius: 99px; padding: 8px 12px; cursor: pointer; display: inline-flex; gap: 6px; align-items: center; }
  .st .chip[aria-pressed=true] { color: var(--text); border-color: currentColor; background: var(--card-2); }
  .st .chip .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c, var(--muted)); }
  .st .chip .n { opacity: .7; }
  .st .count { font-size: 13px; color: var(--muted); margin-left: auto; }

  .st ol.list { list-style: none; padding: 0; margin: 16px 0; display: grid; gap: 12px; }
  .st .card { background: var(--card); border: 1px solid var(--border); border-left: 4px solid var(--c); border-radius: 12px; padding: 16px 18px;
              display: grid; grid-template-columns: auto 1fr; gap: 4px 14px; }
  .st .card.done { opacity: .6; }
  .st .card.done h2 a { text-decoration: line-through; }
  .st .num { font: 600 13px/1 ui-monospace, Menlo, monospace; color: var(--muted); padding-top: 6px; min-width: 2ch; text-align: right; }
  .st .card h2 { font-size: 18px; margin: 0; line-height: 1.35; }
  .st .card h2 a { color: var(--text); text-decoration: none; }
  .st .card h2 a:hover { color: var(--accent); }
  .st .meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 6px 0 4px; font-size: 12px; }
  .st .lvl { font-weight: 600; color: var(--c); border: 1px solid var(--c); border-radius: 99px; padding: 2px 8px; }
  .st .judge { color: var(--muted); font-family: ui-monospace, Menlo, monospace; }
  .st .tag { background: var(--card-2); color: var(--muted); border-radius: 6px; padding: 2px 7px; border: 0; font: inherit; cursor: pointer; }
  .st .tag:hover { color: var(--text); }
  .st .body { grid-column: 2; color: var(--text); font-size: 15px; }
  .st .body p { margin: 4px 0; }
  .st .body ol { margin: 4px 0; padding-left: 20px; }
  .st .actions { grid-column: 2; display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; align-items: center; }
  .st .btn { display: inline-flex; align-items: center; gap: 6px; font: 500 14px/1 system-ui, sans-serif; padding: 9px 12px; border-radius: 8px;
             text-decoration: none; border: 1px solid var(--border); color: var(--text); background: var(--card-2); min-height: 36px; }
  .st .btn.primary { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
  .st .btn:hover { filter: brightness(1.08); }
  .st label.solved { margin-left: auto; display: inline-flex; gap: 6px; align-items: center; font-size: 14px; color: var(--muted); cursor: pointer; min-height: 36px; }
  .st label.solved input { width: 18px; height: 18px; accent-color: var(--accent); }
  .st .empty { text-align: center; color: var(--muted); padding: 32px 0; }
  .st [hidden] { display: none !important; }
  .st .lvl-Beginner { --c: var(--beginner); } .st .lvl-Easy { --c: var(--easy); }
  .st .lvl-Medium { --c: var(--medium); } .st .lvl-Hard { --c: var(--hard); }
  @media (max-width: 480px) {
    .st .card { grid-template-columns: 1fr; padding: 14px; }
    .st .num { display: none; }
    .st .body, .st .actions { grid-column: 1; }
    .st label.solved { margin-left: 0; }
  }
  @media (prefers-reduced-motion: reduce) { .st .bar > i { transition: none; } }
</style>

<div class="st" id="st">
  <div class="hero">
    <div>
      <h1>Segment Tree Problems</h1>
      <p class="lede">{{ page.problems.size }} problems from LightOJ, SPOJ and Codeforces, ordered from first segment tree to hard. Each one is tagged with the technique it teaches and links to my solution. Tick off the ones you solve; your progress is saved in this browser.</p>
    </div>
    <img src="/img/segtree.png" alt="A segment tree built over an array, each node holding the answer for its range" width="220" height="220" loading="lazy">
  </div>

  <div class="progress" aria-live="polite">
    <div class="bar" role="progressbar" aria-label="Problems solved" aria-valuemin="0" aria-valuemax="{{ page.problems.size }}" aria-valuenow="0"><i></i></div>
    <span><b id="st-solved">0</b> / {{ page.problems.size }} solved</span>
    <button type="button" id="st-reset" hidden>Reset</button>
  </div>

  <div class="toolbar" role="search">
    <div class="row">
      <input type="search" id="st-q" placeholder="Search problems, e.g. GSS, lazy, brackets" aria-label="Search problems">
      <select id="st-tag" aria-label="Filter by technique">
        <option value="">All techniques</option>
        {%- for t in all_tags %}
        <option value="{{ t }}">{{ t }}</option>
        {%- endfor %}
      </select>
    </div>
    <div class="row" role="group" aria-label="Filter by difficulty">
      {%- for l in page.levels -%}
      {%- assign n = page.problems | where: "level", l | size %}
      <button type="button" class="chip lvl-{{ l }}" data-level="{{ l }}" aria-pressed="false"><span class="dot"></span>{{ l }} <span class="n">{{ n }}</span></button>
      {%- endfor %}
      <button type="button" class="chip" id="st-hide" aria-pressed="false">Hide solved</button>
      <span class="count" id="st-count" aria-live="polite"></span>
    </div>
  </div>

  <ol class="list" id="st-list">
    {%- for p in page.problems %}
    {%- assign id = p.judge | append: "-" | append: p.code | slugify %}
    <li class="card lvl-{{ p.level }}" id="{{ id }}" data-id="{{ id }}" data-level="{{ p.level }}" data-tags="{{ p.tags | join: '|' }}">
      <span class="num">{{ forloop.index }}</span>
      <div>
        <h2><a href="{{ p.url }}" target="_blank" rel="noopener">{{ p.name }}</a></h2>
        <div class="meta">
          <span class="lvl">{{ p.level }}</span>
          <span class="judge">{{ p.judge }} {{ p.code }}</span>
          {%- for t in p.tags %}
          <button type="button" class="tag" data-tag="{{ t }}" title="Show only {{ t }} problems">{{ t }}</button>
          {%- endfor %}
        </div>
      </div>
      <div class="body">
        {%- if p.desc %}<p>{{ p.desc }}</p>{% endif %}
        {%- if p.ops %}
        <p>Support {{ p.ops.size }} operations:</p>
        <ol>{% for o in p.ops %}<li>{{ o }}</li>{% endfor %}</ol>
        {%- endif %}
      </div>
      <div class="actions">
        <a class="btn primary" href="{{ p.url }}" target="_blank" rel="noopener">Solve on {{ p.judge }} <span aria-hidden="true">↗</span></a>
        <a class="btn" href="{{ p.solution }}" target="_blank" rel="noopener">My solution <span aria-hidden="true">↗</span></a>
        <label class="solved"><input type="checkbox" data-solved> Solved</label>
      </div>
    </li>
    {%- endfor %}
  </ol>
  <p class="empty" id="st-empty" hidden>No problems match. <a href="#" id="st-clear">Clear filters</a></p>
</div>

<script>
(function () {
  var root = document.getElementById('st');
  var KEY = 'jk-segtree-solved';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  // Follow the theme picked on the homepage: "paper" is the only light one.
  var theme = null;
  try { theme = localStorage.getItem('jk-theme'); } catch (e) {}
  if (theme === 'paper') root.classList.add('light');
  var page = getComputedStyle(root);
  document.documentElement.style.setProperty('--page-bg', page.getPropertyValue('--bg'));
  document.documentElement.style.setProperty('--page-accent', page.getPropertyValue('--accent'));

  var cards = Array.prototype.slice.call(root.querySelectorAll('.card'));
  var chips = Array.prototype.slice.call(root.querySelectorAll('.chip[data-level]'));
  var q = document.getElementById('st-q'), tagSel = document.getElementById('st-tag');
  var hide = document.getElementById('st-hide'), count = document.getElementById('st-count');
  var empty = document.getElementById('st-empty'), reset = document.getElementById('st-reset');
  var bar = root.querySelector('.bar'), solvedEl = document.getElementById('st-solved');
  var solved = load();

  function norm(s) { return s.toLowerCase().replace(/\s+/g, ' '); }
  cards.forEach(function (c) { c._text = norm(c.textContent); });

  function apply() {
    var levels = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })
                      .map(function (c) { return c.dataset.level; });
    var terms = norm(q.value).trim().split(' ').filter(Boolean);
    var tag = tagSel.value, hideSolved = hide.getAttribute('aria-pressed') === 'true', shown = 0;
    cards.forEach(function (c) {
      var ok = (!levels.length || levels.indexOf(c.dataset.level) >= 0) &&
               (!tag || c.dataset.tags.split('|').indexOf(tag) >= 0) &&
               !(hideSolved && solved[c.dataset.id]) &&
               terms.every(function (t) { return c._text.indexOf(t) >= 0; });
      c.hidden = !ok; if (ok) shown++;
    });
    count.textContent = shown === cards.length ? cards.length + ' problems' : shown + ' of ' + cards.length + ' shown';
    empty.hidden = shown > 0;
  }

  function progress() {
    var n = cards.filter(function (c) { return solved[c.dataset.id]; }).length;
    solvedEl.textContent = n;
    bar.setAttribute('aria-valuenow', n);
    bar.firstElementChild.style.width = (100 * n / cards.length) + '%';
    reset.hidden = n === 0;
  }

  cards.forEach(function (c) {
    var box = c.querySelector('[data-solved]');
    box.checked = !!solved[c.dataset.id];
    c.classList.toggle('done', box.checked);
    box.addEventListener('change', function () {
      if (box.checked) solved[c.dataset.id] = 1; else delete solved[c.dataset.id];
      c.classList.toggle('done', box.checked);
      save(solved); progress(); apply();
    });
  });

  function toggle(btn) { btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); apply(); }
  chips.forEach(function (c) { c.addEventListener('click', function () { toggle(c); }); });
  hide.addEventListener('click', function () { toggle(hide); });
  q.addEventListener('input', apply);
  tagSel.addEventListener('change', apply);
  root.addEventListener('click', function (e) {
    var t = e.target.closest('.tag');
    if (t) { tagSel.value = t.dataset.tag; apply(); root.querySelector('.toolbar').scrollIntoView({ block: 'start' }); }
  });
  document.getElementById('st-clear').addEventListener('click', function (e) {
    e.preventDefault(); q.value = ''; tagSel.value = '';
    chips.concat(hide).forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    apply();
  });
  reset.addEventListener('click', function () {
    if (!confirm('Clear your solved progress?')) return;
    solved = {}; save(solved);
    cards.forEach(function (c) { c.querySelector('[data-solved]').checked = false; c.classList.remove('done'); });
    progress(); apply();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== q && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
  });

  progress(); apply();
})();
</script>
