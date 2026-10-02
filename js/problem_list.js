/* Filtering, search and saved progress for _includes/problem_list.html. */
(function () {
  function all(sel, el) { return Array.prototype.slice.call(el.querySelectorAll(sel)); }
  function norm(s) { return s.toLowerCase().replace(/\s+/g, ' '); }

  all('.pl', document).forEach(function (root) {
    var KEY = root.dataset.store;
    function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
    function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

    var cards = all('.pl-card', root);
    var chips = all('.pl-chip[data-level]', root);
    var q = root.querySelector('.pl-q'), tagSel = root.querySelector('.pl-tagsel');
    var hide = root.querySelector('.pl-hide'), count = root.querySelector('.pl-count');
    var empty = root.querySelector('.pl-empty'), reset = root.querySelector('.pl-reset');
    var bar = root.querySelector('.pl-bar'), solvedEl = root.querySelector('.pl-solved-n');
    var toolbar = root.querySelector('.pl-toolbar');
    var solved = load();

    cards.forEach(function (c) { c._text = norm(c.textContent); });

    function apply() {
      var levels = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })
                        .map(function (c) { return c.dataset.level; });
      var terms = norm(q.value).trim().split(' ').filter(Boolean);
      var tag = tagSel ? tagSel.value : '';
      var hideSolved = hide.getAttribute('aria-pressed') === 'true', shown = 0;
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
    if (tagSel) tagSel.addEventListener('change', apply);
    root.addEventListener('click', function (e) {
      var t = e.target.closest('.pl-tag');
      if (t && tagSel) { tagSel.value = t.dataset.tag; apply(); toolbar.scrollIntoView({ block: 'start' }); }
    });
    root.querySelector('.pl-clear').addEventListener('click', function (e) {
      e.preventDefault(); q.value = ''; if (tagSel) tagSel.value = '';
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
      var a = document.activeElement;
      if (e.key === '/' && a !== q && !/INPUT|SELECT|TEXTAREA/.test(a.tagName) && !a.isContentEditable) { e.preventDefault(); q.focus(); }
    });

    progress(); apply();
  });
})();
