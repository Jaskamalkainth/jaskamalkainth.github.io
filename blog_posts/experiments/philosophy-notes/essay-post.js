/* Figures for /blog_posts/whatwedowhywedo.html (styles in philosophy-post.css).
   The "lens" figure reads its content from the <dl> lists in its own fallback, so the text agents
   read and the interactive version are the same words. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  // thinkers with a portrait in /img/philosophers/ (others get a monogram)
  var PORTRAIT = { plato: 1, aristotle: 1, 'david-hume': 1, 'immanuel-kant': 1, 'friedrich-nietzsche': 1, 'karl-marx': 1, 'jean-paul-sartre': 1, 'soren-kierkegaard': 1 };
  var MONO = { 'william-james': 'WJ', 'harry-frankfurt': 'HF', stoics: 'S', science: '🧪' };
  function avatar(who, size) {
    if (PORTRAIT[who]) return el('img', { src: '/img/philosophers/' + who + '.webp', alt: '', width: size, height: size, decoding: 'async' });
    return el('i', { class: 'mono', 'aria-hidden': 'true' }, MONO[who] || '?');
  }

  /* ---------- journey: seven steps, each jumps to its section ---------- */
  var STEPS = [
    { id: 'ancient-philosophy', era: 'ancient', when: 'Ancient', answer: 'We seek the good; reason must rule desire', face: 'aristotle' },
    { id: 'medieval-insights', era: 'medieval', when: 'Medieval', answer: 'Love is the weight that moves us', face: 'thomas-aquinas' },
    { id: 'enlightenment-reason', era: 'early-modern', when: 'Enlightenment', answer: 'Passion drives; duty should', face: 'david-hume' },
    { id: '19th-century', era: '19th-century', when: '19th century', answer: 'Power, class and inner meaning', face: 'friedrich-nietzsche' },
    { id: '20th-century', era: '20th-century', when: '20th century', answer: 'Condemned to be free', face: 'jean-paul-sartre' },
    { id: 'contemporary-views', era: 'contemporary', when: 'Today', answer: 'Much of it runs below awareness', face: null },
    { id: 'personal-reflection', era: null, when: 'Me', answer: 'All of the above, before coffee', face: null }
  ];
  function drawJourney(fig) {
    var c = fig.querySelector('.hv-canvas');
    c.innerHTML = '';
    var ol = el('ol', { class: 'ess-journey' });
    STEPS.forEach(function (s, i) {
      var li = el('li', s.era ? { 'data-era': s.era } : null);
      var a = el('a', { href: '#' + s.id });
      var dot = el('span', { class: 'dot' });
      if (s.face) dot.appendChild(el('img', { src: '/img/philosophers/' + s.face + '.webp', alt: '', width: 48, height: 48, decoding: 'async' }));
      else dot.appendChild(el('i', { class: 'mono', 'aria-hidden': 'true' }, s.era ? '🧠' : '☕'));
      a.appendChild(dot);
      a.appendChild(el('span', { class: 'txt' }, '<small>' + (i + 1) + ' · ' + s.when + '</small><b>' + s.answer + '</b>'));
      a.addEventListener('click', function (e) {
        var t = document.getElementById(s.id);
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', '#' + s.id);
      });
      li.appendChild(a);
      ol.appendChild(li);
    });
    c.appendChild(ol);
  }

  /* ---------- lens: pick an action, see each thinker's "why" ---------- */
  function drawLens(fig) {
    var c = fig.querySelector('.hv-canvas');
    var actions = Array.prototype.map.call(c.querySelectorAll('dl[data-action]'), function (dl) {
      var items = [];
      dl.querySelectorAll('dt').forEach(function (dt) {
        var dd = dt.nextElementSibling;
        items.push({ who: dt.getAttribute('data-who'), name: dt.textContent, why: dd ? dd.textContent : '' });
      });
      return { label: dl.getAttribute('data-action'), items: items };
    });
    if (!actions.length) return;
    c.innerHTML = '';
    var tabs = el('div', { class: 'ph-chips ess-actions', role: 'group', 'aria-label': 'Pick an everyday action' });
    var stage = el('div', { class: 'ess-lens', 'aria-live': 'polite' });
    function show(i) {
      tabs.querySelectorAll('button').forEach(function (b, j) { b.setAttribute('aria-pressed', i === j ? 'true' : 'false'); });
      stage.innerHTML = '';
      stage.appendChild(el('p', { class: 'ess-act' }, 'Why am I <b>' + actions[i].label.charAt(0).toLowerCase() + actions[i].label.slice(1) + '</b>?'));
      var grid = el('div', { class: 'ess-lens-grid' });
      actions[i].items.forEach(function (it, k) {
        var card = el('div', { class: 'ess-lens-card' });
        if (!reduce) card.style.animationDelay = (k * 70) + 'ms';
        var head = el('div', { class: 'h' });
        head.appendChild(avatar(it.who, 40));
        head.appendChild(el('b', null, it.name));
        card.appendChild(head);
        card.appendChild(el('p', null, it.why));
        grid.appendChild(card);
      });
      stage.appendChild(grid);
    }
    actions.forEach(function (a, i) {
      var b = el('button', { type: 'button', class: 'ph-chip', 'aria-pressed': 'false' }, a.label);
      b.addEventListener('click', function () { show(i); });
      tabs.appendChild(b);
    });
    c.appendChild(tabs);
    c.appendChild(stage);
    show(0);
  }

  var DRAW = { journey: drawJourney, lens: drawLens };
  document.querySelectorAll('figure.hv[data-hv]').forEach(function (fig) {
    var f = DRAW[fig.getAttribute('data-hv')];
    if (!f) return;
    try { f(fig); } catch (err) { if (window.console) console.error('figure ' + fig.getAttribute('data-hv'), err); }
  });
})();
