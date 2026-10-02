// HNSW Algorithm Simulation — Interactive Visualization
//
// Implements the algorithms from Malkov & Yashunin, "Efficient and robust
// approximate nearest neighbor search using Hierarchical Navigable Small World
// graphs" (2016): random level assignment, SEARCH-LAYER with a dynamic
// candidate list (ef), the neighbour-selection heuristic, and connection
// pruning to Mmax / Mmax0.
document.addEventListener('DOMContentLoaded', () => {

    // ── DOM references ────────────────────────────────────────────
    const $ = (id) => document.getElementById(id);
    const layersContainer = $('layersContainer');
    const explanationText = $('explanationText');

    const resetBtn            = $('reset');
    const addPointBtn         = $('addPoint');
    const addBulkPointsBtn    = $('addBulkPoints');
    const runQueryBtn         = $('runQuery');
    const maxLayersInput      = $('maxLayers');
    const mInput              = $('m');
    const efConstructionInput = $('efConstruction');
    const efSearchInput       = $('efSearch');
    const distanceMetricSelect = $('distanceMetric');
    const modeInsertBtn       = $('modeInsert');
    const modeSearchBtn       = $('modeSearch');

    const navBar          = $('floatingNavigationButtons');
    const prevBtn         = $('floatingPrevStep');
    const nextBtn         = $('floatingNextStep');
    const playBtn         = $('floatingPlay');
    const skipToEndBtn    = $('floatingSkipToEnd');
    const clearSearchBtn  = $('floatingClearSearch');
    const stepCounter     = $('floatingStepCounter');
    const stepProgressFill = $('stepProgressFill');
    const statsBar        = $('statsBar');

    // ── Logical coordinate space (canvas is scaled uniformly to fit) ──
    const SPACE_W = 600;
    const SPACE_H = 200;
    const NODE_R  = 8;
    const PAD     = NODE_R + 6;

    const COLORS = {
        edge:      '#c8d0da',
        accepted:  '#27ae60',
        rejected:  '#e6a35c',
        regular:   ['#3498db', '#2980b9'],
        entry:     ['#9b59b6', '#7d3c98'],
        visited:   ['#f1c40f', '#d68910'],
        current:   ['#2ecc71', '#1e8449'],
        candidate: '#16a085',
        query:     ['#e74c3c', '#a93226'],
        newNode:   '#e67e22',
    };

    // ── Parameters ────────────────────────────────────────────────
    const readInt = (input, lo, hi) => {
        const v = clamp(parseInt(input.value, 10) || lo, lo, hi);
        input.value = v;
        return v;
    };

    let maxLayers, M, efConstruction, efSearch;
    let distanceMetric = distanceMetricSelect.value;
    let clickMode = 'insert';   // 'insert' | 'search'

    function readParams() {
        maxLayers      = readInt(maxLayersInput, 1, 6);
        M              = readInt(mInput, 2, 16);
        efConstruction = readInt(efConstructionInput, 1, 200);
        efSearch       = readInt(efSearchInput, 1, 100);
    }

    const Mmax  = () => M;        // max degree on layers ≥ 1
    const Mmax0 = () => 2 * M;    // max degree on layer 0 (paper's recommendation)
    const mL    = () => 1 / Math.log(M);

    // ── Index state ───────────────────────────────────────────────
    // points[id] = { id, x, y, level }
    // graph[layer] = Map<id, id[]>   (adjacency lists; a node is on layer l iff level ≥ l)
    let points = [];
    let graph  = [];
    let entryPointId = null;
    let lastInserted = null;      // { id, level } – highlighted until the next action

    // ── Search state ──────────────────────────────────────────────
    let queryPoint = null;        // { x, y } – kept separate from the indexed points
    let steps = [];
    let currentStep = 0;
    let searchResult = null;      // { found, exact, foundDist, exactDist, distCount }
    let playTimer = null;

    let contexts = [];

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
    function fmt(d) { return d.toFixed(1); }
    const searching = () => steps.length > 0;

    function distance(a, b) {
        const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
        switch (distanceMetric) {
            case 'manhattan': return dx + dy;
            case 'chebyshev': return Math.max(dx, dy);
            default:          return Math.hypot(dx, dy);
        }
    }

    const METRICS = {
        euclidean: { name: 'Euclidean', expr: '√((x₁−x₂)² + (y₁−y₂)²)' },
        manhattan: { name: 'Manhattan', expr: '|x₁−x₂| + |y₁−y₂|' },
        chebyshev: { name: 'Chebyshev', expr: 'max(|x₁−x₂|, |y₁−y₂|)' },
    };

    function updateFormula() {
        const f = METRICS[distanceMetric] || METRICS.euclidean;
        document.querySelector('#formulaBox .formula-title').textContent = `Distance: ${f.name}`;
        document.querySelector('#formulaBox .formula-content').textContent = f.expr;
    }

    function topLevel() {
        return entryPointId === null ? -1 : points[entryPointId].level;
    }

    function neighbours(id, layer) {
        return graph[layer].get(id) || [];
    }

    function layerSize(layer) {
        return graph[layer] ? graph[layer].size : 0;
    }

    // ─────────────────────────────────────────────────────────────
    // HNSW core
    // ─────────────────────────────────────────────────────────────

    // Level ~ floor(-ln(U) · mL), capped so it fits on screen.
    function randomLevel() {
        const lvl = Math.floor(-Math.log(1 - Math.random()) * mL());
        return Math.min(lvl, maxLayers - 1);
    }

    // SEARCH-LAYER (Algorithm 2). Returns up to `ef` nearest ids, sorted by
    // distance. `trace`, if given, receives events for the step-by-step view.
    function searchLayer(q, entryIds, ef, layer, trace) {
        const d = (id) => distance(q, points[id]);

        const visited = new Set(entryIds);
        let C = entryIds.map(id => ({ id, d: d(id) }));   // candidates
        let W = C.slice();                                 // dynamic result list
        const byDist = (a, b) => a.d - b.d;
        C.sort(byDist); W.sort(byDist);

        while (C.length) {
            const c = C.shift();                 // closest candidate
            const f = W[W.length - 1];           // furthest result
            if (c.d > f.d) {
                trace && trace.emit('stop', { layer, cur: c.id, W, c, f });
                break;
            }
            trace && trace.emit('expand', { layer, cur: c.id, W, c });

            for (const e of neighbours(c.id, layer)) {
                if (visited.has(e)) continue;
                visited.add(e);
                const de = d(e);
                const worst = W[W.length - 1];
                const full = W.length >= ef;
                const accept = !full || de < worst.d;
                if (accept) {
                    const item = { id: e, d: de };
                    C.push(item); C.sort(byDist);
                    W.push(item); W.sort(byDist);
                    if (W.length > ef) W.pop();
                }
                trace && trace.emit('examine', { layer, cur: c.id, from: c.id, to: e, d: de, accept, full, worst, W });
            }
        }
        return W.map(w => w.id);
    }

    // SELECT-NEIGHBORS-HEURISTIC (Algorithm 4) with keepPrunedConnections.
    // A candidate is kept only if it is closer to the base than to every
    // neighbour already chosen, which favours links in diverse directions.
    function selectNeighbours(base, candidateIds, m) {
        const sorted = candidateIds
            .filter(id => id !== base.id)
            .map(id => ({ id, d: distance(base, points[id]) }))
            .sort((a, b) => a.d - b.d);
        const chosen = [], pruned = [];
        for (const c of sorted) {
            if (chosen.length >= m) break;
            const good = chosen.every(r => c.d < distance(points[c.id], points[r.id]));
            (good ? chosen : pruned).push(c);
        }
        for (const p of pruned) {
            if (chosen.length >= m) break;
            chosen.push(p);
        }
        return chosen.map(c => c.id);
    }

    // INSERT (Algorithm 1).
    function insert(x, y) {
        const q = { id: points.length, x, y, level: randomLevel() };
        points.push(q);
        for (let l = 0; l <= q.level; l++) graph[l].set(q.id, []);

        if (entryPointId === null) {
            entryPointId = q.id;
            return q;
        }

        let ep = [entryPointId];
        const L = topLevel();

        // Phase 1: greedy descent (ef = 1) through layers above the new node.
        for (let l = L; l > q.level; l--) ep = searchLayer(q, ep, 1, l).slice(0, 1);

        // Phase 2: on each of the node's layers find efConstruction candidates
        // and link to the best M (chosen by the heuristic).
        for (let l = Math.min(L, q.level); l >= 0; l--) {
            const W = searchLayer(q, ep, efConstruction, l);
            const nbrs = selectNeighbours(q, W, M);
            graph[l].set(q.id, nbrs.slice());

            const cap = l === 0 ? Mmax0() : Mmax();
            for (const n of nbrs) {
                const list = graph[l].get(n);
                list.push(q.id);
                if (list.length > cap) {
                    // Shrink connections of n; drop the reverse link too so the
                    // drawn graph stays undirected and easy to read.
                    const kept = selectNeighbours(points[n], list, cap);
                    for (const dropped of list.filter(id => !kept.includes(id))) {
                        const back = graph[l].get(dropped);
                        if (back) graph[l].set(dropped, back.filter(id => id !== n));
                    }
                    graph[l].set(n, kept);
                }
            }
            ep = W;
        }

        if (q.level > L) entryPointId = q.id;
        return q;
    }

    function exactNearest(q) {
        let best = null, bestD = Infinity;
        for (const p of points) {
            const d = distance(q, p);
            if (d < bestD) { bestD = d; best = p.id; }
        }
        return { id: best, d: bestD };
    }

    // ─────────────────────────────────────────────────────────────
    // Graph lifecycle
    // ─────────────────────────────────────────────────────────────

    function emptyIndex() {
        points = [];
        graph = Array.from({ length: maxLayers }, () => new Map());
        entryPointId = null;
        lastInserted = null;
    }

    function resetAll() {
        readParams();
        clearSearch(false);
        emptyIndex();
        buildCanvases();
        render();
        showExplanation(
            'The index is empty.<br><br>' +
            'Click <em>+ Add 10 Points</em> (or click on a layer) to insert points, then <em>🔍 Search Nearest</em> to run a query.',
            null
        );
    }

    // Re-insert the same coordinates with the current parameters so that the
    // effect of M / ef / layers / metric can be compared on the same data.
    function rebuild(reason) {
        const coords = points.map(p => ({ x: p.x, y: p.y }));
        const q = queryPoint;
        readParams();
        clearSearch(false);
        emptyIndex();
        buildCanvases();
        coords.forEach(c => insert(c.x, c.y));
        render();
        showExplanation(
            `${reason}<br><br>Rebuilt the index from the same <strong>${coords.length}</strong> points. ` +
            'Levels are re-drawn at random, so the upper layers will look different.',
            null
        );
        if (q && points.length) startSearch(q.x, q.y);
    }

    function addPoint(x, y) {
        clearSearch(false);
        const p = insert(x, y);
        lastInserted = p;
        render();

        const nbrs0 = neighbours(p.id, 0);
        const range = p.level === 0 ? 'layer 0 only' : `layers 0–${p.level}`;
        let html =
            `Inserted <strong>node ${p.id}</strong> on ${range} ` +
            `(P(level ≥ 1) = 1/M = ${(100 / M).toFixed(0)}%).<br>`;
        if (points.length === 1) {
            html += 'It is the first node, so it becomes the <strong>entry point</strong>.';
        } else {
            html += `Layer-0 links: ${nbrs0.length ? nbrs0.map(n => '#' + n).join(', ') : 'none'}.<br><br>` +
                'To find them, HNSW searched the existing graph from the entry point with ' +
                `ef = ${efConstruction} and kept up to M = ${M} diverse neighbours.`;
            if (p.id === entryPointId) {
                html += `<br><span class="hl-entry">⬆ Highest level so far — node ${p.id} is the new entry point.</span>`;
            } else if (p.level > 0) {
                html += `<br><span class="hl-entry">⬆ Promoted — acts as a long-range shortcut on upper layers.</span>`;
            }
        }
        showExplanation(html, null);
    }

    function addRandomPoints(count) {
        for (let i = 0; i < count; i++) addPoint(...randomCoords());
        lastInserted = null;
        render();

        const counts = graph.map((_, l) => `L${l}: ${layerSize(l)}`).reverse().join(' · ');
        showExplanation(
            `Added <strong>${count} points</strong> (${points.length} total).<br>${counts}<br><br>` +
            (layerSize(1) > 0
                ? 'Each layer holds roughly 1/M of the layer below. These sparse upper layers are the ' +
                  '"highways" a search uses to cover distance quickly.'
                : 'No point has been promoted yet. Add more points to see the upper layers fill in.'),
            null
        );
    }

    function randomCoords() {
        return [
            PAD + Math.random() * (SPACE_W - 2 * PAD),
            PAD + Math.random() * (SPACE_H - 2 * PAD),
        ];
    }

    // ─────────────────────────────────────────────────────────────
    // Traced search (K-NN-SEARCH, Algorithm 5, with K = 1)
    // ─────────────────────────────────────────────────────────────

    function startSearch(x, y) {
        stopPlaying();
        if (!points.length) {
            showExplanation('The index is empty. Add some points first, then run a search.', null);
            return;
        }

        const q = { x, y };
        queryPoint = q;
        steps = [];
        lastInserted = null;

        const seen = new Set();   // every node whose distance was computed
        const trace = {
            emit(type, data) {
                if (type === 'examine') seen.add(data.to);
                steps.push(makeStep(type, data, seen));
            },
        };

        const L = topLevel();
        seen.add(entryPointId);
        steps.push(makeStep('start', { layer: L, cur: entryPointId, W: [{ id: entryPointId, d: distance(q, points[entryPointId]) }] }, seen));

        let ep = [entryPointId];
        for (let l = L; l >= 0; l--) {
            if (l < L) {
                steps.push(makeStep('descend', { layer: l, cur: ep[0], W: [{ id: ep[0], d: distance(q, points[ep[0]]) }], ef: l === 0 ? efSearch : 1 }, seen));
            }
            const ef = l === 0 ? Math.max(efSearch, 1) : 1;
            const W = searchLayer(q, ep, ef, l, trace);
            ep = l === 0 ? W : W.slice(0, 1);
        }

        const exact = exactNearest(q);
        searchResult = {
            found: ep[0],
            foundDist: distance(q, points[ep[0]]),
            exact: exact.id,
            exactDist: exact.d,
            distCount: seen.size,
            resultList: ep,
        };
        steps.push(makeStep('result', { layer: 0, cur: ep[0], W: ep.map(id => ({ id, d: distance(q, points[id]) })) }, seen));

        currentStep = 0;
        applyStep();
    }

    function makeStep(type, data, seen) {
        return {
            type,
            layer: data.layer,
            cur: data.cur,
            from: data.from,
            to: data.to,
            accept: data.accept,
            W: (data.W || []).map(w => w.id),
            seen: Array.from(seen),
            description: describe(type, data),
        };
    }

    function describe(type, s) {
        const ef = s.layer === 0 ? efSearch : 1;
        switch (type) {
            case 'start':
                return `Start at the <strong>entry point, node ${s.cur}</strong>, on the top layer (L${s.layer}).<br>` +
                    `Distance to query: <strong>${fmt(s.W[0].d)}</strong>.<br><br>` +
                    'Upper layers are searched greedily (ef = 1): keep hopping to whichever neighbour is closer to the query.';
            case 'descend':
                return `Drop down to <strong>layer ${s.layer}</strong>, starting from <strong>node ${s.cur}</strong> ` +
                    `(dist ${fmt(s.W[0].d)}), the best node found above.<br><br>` +
                    (s.layer === 0
                        ? `Layer 0 contains every point. Here the search widens to a beam of <strong>ef = ${efSearch}</strong> ` +
                          'candidates so it can route around local dead ends.'
                        : `Layer ${s.layer} has ${layerSize(s.layer)} nodes, so the jumps are shorter and more precise.`);
            case 'expand':
                return `L${s.layer}: expand <strong>node ${s.cur}</strong> (dist ${fmt(s.c.d)}), the closest unexpanded candidate.<br>` +
                    `Its ${neighbours(s.cur, s.layer).length} neighbours will be checked next.` +
                    (ef > 1 ? `<br><br>Result list (${s.W.length}/${ef}): ${listIds(s.W)}` : '');
            case 'examine': {
                const verdict = s.accept
                    ? (ef === 1
                        ? `<span class="hl-yes">✓ Closer than ${fmt(s.worst.d)}. Node ${s.to} becomes the best so far.</span>`
                        : `<span class="hl-yes">✓ ${s.full ? `Beats the worst result (${fmt(s.worst.d)})` : `Result list not full yet (&lt; ${ef})`}. Added to the result and candidate lists.</span>`)
                    : `<span class="hl-no">✗ Not closer than ${fmt(s.worst.d)}. Discarded.</span>`;
                return `L${s.layer}: check edge <strong>${s.from} → ${s.to}</strong>.<br>` +
                    `Distance from node ${s.to} to query: <strong>${fmt(s.d)}</strong>.<br><br>${verdict}`;
            }
            case 'stop':
                return `L${s.layer}: the closest remaining candidate (node ${s.c.id}, ${fmt(s.c.d)}) is farther than the ` +
                    `worst result (node ${s.f.id}, ${fmt(s.f.d)}).<br><br>` +
                    '<strong>Nothing left can improve the result, so this layer is done.</strong>';
            case 'result':
                return ''; // filled in by resultDescription() once totals are known
        }
        return '';
    }

    function listIds(W) {
        return W.map(w => `#${w.id}`).join(', ');
    }

    function resultDescription() {
        const r = searchResult;
        const n = points.length;
        const pct = Math.round((r.distCount / n) * 100);
        const hit = r.found === r.exact || Math.abs(r.foundDist - r.exactDist) < 1e-9;
        return `<strong>Search complete.</strong> Nearest neighbour: <strong>node ${r.found}</strong> (dist ${fmt(r.foundDist)}).<br>` +
            `Final result list (ef = ${efSearch}): ${r.resultList.map(id => '#' + id).join(', ')}<br><br>` +
            `Nodes compared: <strong>${r.distCount}</strong> (${pct}% of a brute-force scan of ${n}).<br>` +
            (hit
                ? '<span class="hl-yes">✓ Matches the exact nearest neighbour.</span>'
                : `<span class="hl-no">✗ Approximate miss: the exact nearest is node ${r.exact} (dist ${fmt(r.exactDist)}). ` +
                  'Try a larger ef or M.</span>') +
            (pct >= 100 && n < 40
                ? '<br><br><em>With so few points HNSW touches most of them; the savings appear as the index grows.</em>'
                : '');
    }

    function clearSearch(redraw = true) {
        stopPlaying();
        steps = [];
        currentStep = 0;
        queryPoint = null;
        searchResult = null;
        hideSkipList();
        updateNav();
        if (redraw) {
            render();
            showExplanation('Search cleared. Add more points or run another search.', null);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Step navigation
    // ─────────────────────────────────────────────────────────────

    function applyStep() {
        const step = steps[currentStep];
        showExplanation(step.type === 'result' ? resultDescription() : step.description, step.type);
        updateSkipList(step);
        render();
        updateNav();
    }

    function goTo(i) {
        if (!searching()) return;
        const next = clamp(i, 0, steps.length - 1);
        if (next === currentStep) return;
        currentStep = next;
        applyStep();
    }

    function togglePlay() {
        if (playTimer) { stopPlaying(); return; }
        if (currentStep >= steps.length - 1) goTo(0);
        playTimer = setInterval(() => {
            if (currentStep >= steps.length - 1) { stopPlaying(); return; }
            goTo(currentStep + 1);
        }, 650);
        updateNav();
    }

    function stopPlaying() {
        if (playTimer) clearInterval(playTimer);
        playTimer = null;
        updateNav();
    }

    function updateNav() {
        const active = searching();
        navBar.style.display = active ? 'flex' : 'none';
        if (!active) return;
        const last = steps.length - 1;
        prevBtn.disabled = currentStep <= 0;
        nextBtn.disabled = currentStep >= last;
        skipToEndBtn.disabled = currentStep >= last;
        playBtn.textContent = playTimer ? '⏸ Pause' : '▶ Play';
        stepCounter.textContent = `Step ${currentStep + 1} / ${steps.length}`;
        stepProgressFill.style.width = `${last > 0 ? (currentStep / last) * 100 : 100}%`;
    }

    // ─────────────────────────────────────────────────────────────
    // Explanation panel
    // ─────────────────────────────────────────────────────────────

    const BADGES = {
        start:   { label: 'START',      cls: 'badge-start'   },
        expand:  { label: 'EXPAND',     cls: 'badge-move'    },
        examine: { label: 'EXAMINE',    cls: 'badge-examine' },
        stop:    { label: 'LAYER DONE', cls: 'badge-stop'    },
        descend: { label: '↓ DESCEND',  cls: 'badge-descend' },
        result:  { label: '✓ RESULT',   cls: 'badge-result'  },
    };

    function showExplanation(html, stepType) {
        const badge = $('stepBadge');
        const b = stepType && BADGES[stepType];
        if (b) {
            badge.textContent = b.label;
            badge.className = `step-badge ${b.cls}`;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
        explanationText.innerHTML = html;
    }

    function updateStats() {
        if (!statsBar) return;
        const edges = graph.reduce((sum, g) => {
            let s = 0;
            g.forEach(list => { s += list.length; });
            return sum + s / 2;
        }, 0);
        statsBar.innerHTML =
            `<span><strong>${points.length}</strong> points</span>` +
            `<span><strong>${Math.round(edges)}</strong> edges</span>` +
            `<span>entry point <strong>${entryPointId === null ? '—' : '#' + entryPointId}</strong></span>` +
            `<span>Mmax = ${Mmax()}, Mmax₀ = ${Mmax0()}</span>`;
    }

    // ─────────────────────────────────────────────────────────────
    // Canvases
    // ─────────────────────────────────────────────────────────────

    function buildCanvases() {
        layersContainer.innerHTML = '';
        contexts = [];

        for (let i = maxLayers - 1; i >= 0; i--) {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'layer';
            layerDiv.id = `layer-div-${i}`;

            const title = document.createElement('div');
            title.className = 'layer-title';
            title.id = `layer-title-${i}`;

            const canvas = document.createElement('canvas');
            canvas.className = 'layer-canvas';
            canvas.setAttribute('aria-label', `Layer ${i} of the HNSW graph`);
            canvas.addEventListener('click', (e) => handleCanvasClick(e));

            layerDiv.append(title, canvas);
            layersContainer.appendChild(layerDiv);
            contexts[i] = canvas.getContext('2d');
        }
        sizeCanvases();
    }

    // Size the backing store to the displayed size × devicePixelRatio and map
    // the logical SPACE_W × SPACE_H space onto it with a uniform scale.
    function sizeCanvases() {
        const dpr = window.devicePixelRatio || 1;
        contexts.forEach(ctx => {
            const c = ctx.canvas;
            const w = c.clientWidth || SPACE_W;
            c.width  = Math.round(w * dpr);
            c.height = Math.round(w * (SPACE_H / SPACE_W) * dpr);
            const s = c.width / SPACE_W;
            ctx.setTransform(s, 0, 0, s, 0, 0);
        });
    }

    function handleCanvasClick(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const s = SPACE_W / rect.width;
        const x = clamp((event.clientX - rect.left) * s, PAD, SPACE_W - PAD);
        const y = clamp((event.clientY - rect.top) * s, PAD, SPACE_H - PAD);
        if (clickMode === 'insert') addPoint(x, y);
        else startSearch(x, y);
    }

    function layerLabel(i) {
        let label = `Layer ${i}`;
        if (i === 0) label += ' · all points';
        else if (i === maxLayers - 1) label += ' · top (sparsest)';
        const n = layerSize(i);
        return `${label} · ${n} node${n === 1 ? '' : 's'}`;
    }

    function render() {
        updateStats();
        const step = searching() ? steps[currentStep] : null;
        const seen = step ? new Set(step.seen) : new Set();

        // Edges examined so far, per layer: key "a-b" → accepted?
        const edgeState = Array.from({ length: maxLayers }, () => new Map());
        if (step) {
            for (let k = 0; k <= currentStep; k++) {
                const s = steps[k];
                if (s.type !== 'examine') continue;
                edgeState[s.layer].set(edgeKey(s.from, s.to), s.accept);
            }
        }

        for (let i = 0; i < maxLayers; i++) {
            const ctx = contexts[i];
            const layerDiv = $(`layer-div-${i}`);
            $(`layer-title-${i}`).textContent = layerLabel(i);

            const isActive = step && step.layer === i;
            layerDiv.classList.toggle('active-layer', !!isActive);

            ctx.clearRect(0, 0, SPACE_W, SPACE_H);
            const W = isActive ? new Set(step.W) : new Set();

            // Edges
            const g = graph[i];
            g.forEach((list, a) => {
                for (const b of list) {
                    if (b < a && g.get(b) && g.get(b).includes(a)) continue;   // draw each undirected edge once
                    const state = edgeState[i].get(edgeKey(a, b));
                    let color = COLORS.edge, width = 1, dash = [];
                    if (state === true)  { color = COLORS.accepted; width = 2.5; }
                    if (state === false) { color = COLORS.rejected; width = 1.5; dash = [4, 3]; }
                    if (isActive && step.type === 'examine' && edgeKey(step.from, step.to) === edgeKey(a, b)) width += 2;
                    line(ctx, points[a], points[b], color, width, dash);
                }
            });

            // Line from the current node to the query
            if (queryPoint && isActive && step.cur !== undefined) {
                line(ctx, points[step.cur], queryPoint, 'rgba(231,76,60,0.45)', 1.5, [2, 4]);
            }

            // Nodes
            g.forEach((_, id) => {
                const p = points[id];
                let fill = COLORS.regular, label = null;

                if (step) {
                    if (seen.has(id)) fill = COLORS.visited;
                    if (id === step.cur && isActive) fill = COLORS.current;
                    if (step.type === 'result' && i === 0 && id === searchResult.found) { fill = COLORS.current; label = 'FOUND'; }
                } else if (id === entryPointId) {
                    fill = COLORS.entry;
                    label = 'ENTRY';
                }

                // Rings: current result list, newly inserted, exact NN
                if (W.has(id) && step.type !== 'start') ring(ctx, p, NODE_R + 4, COLORS.candidate, 2);
                if (isActive && step.type === 'examine' && id === step.to) ring(ctx, p, NODE_R + 4, step.accept ? COLORS.accepted : COLORS.rejected, 2.5);
                if (lastInserted && id === lastInserted.id) { ring(ctx, p, NODE_R + 5, COLORS.newNode, 2.5); label = 'NEW'; }
                if (!step && id === entryPointId && i === points[id].level) ring(ctx, p, NODE_R + 5, COLORS.entry[0], 1.5, [3, 3]);
                if (step && step.type === 'result' && i === 0 && id === searchResult.exact && searchResult.exact !== searchResult.found) {
                    ring(ctx, p, NODE_R + 5, COLORS.query[0], 2, [3, 2]);
                    label = 'EXACT';
                }

                circle(ctx, p, NODE_R, fill);
                text(ctx, String(id), p.x, p.y, fill === COLORS.visited ? '#333' : '#fff', 'bold 9px system-ui, sans-serif');
                if (label) text(ctx, label, p.x, p.y + NODE_R + 10, '#2c3e50', 'bold 8px system-ui, sans-serif');
            });

            if (queryPoint) drawQuery(ctx, queryPoint);

            if (!g.size) {
                text(ctx, i === 0 ? 'Click to add a point' : 'No node promoted to this layer yet',
                    SPACE_W / 2, SPACE_H / 2, '#aab4c0', '13px system-ui, sans-serif');
            }
        }
    }

    function edgeKey(a, b) { return a < b ? `${a}-${b}` : `${b}-${a}`; }

    function line(ctx, a, b, color, width, dash = []) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.setLineDash(dash);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function circle(ctx, p, r, [fill, stroke]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function ring(ctx, p, r, color, width, dash = []) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.setLineDash(dash);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    function text(ctx, str, x, y, color, font) {
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(str, x, y);
    }

    function drawQuery(ctx, q) {
        const r = NODE_R + 1;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y - r);
        ctx.lineTo(q.x + r, q.y);
        ctx.lineTo(q.x, q.y + r);
        ctx.lineTo(q.x - r, q.y);
        ctx.closePath();
        ctx.fillStyle = COLORS.query[0];
        ctx.fill();
        ctx.strokeStyle = COLORS.query[1];
        ctx.lineWidth = 1.5;
        ctx.stroke();
        text(ctx, 'QUERY', q.x, q.y + r + 9, COLORS.query[1], 'bold 8px system-ui, sans-serif');
    }

    // ─────────────────────────────────────────────────────────────
    // Layer-membership (skip-list) view
    // ─────────────────────────────────────────────────────────────

    function hideSkipList() {
        $('skipListExplanation').style.display = 'none';
        $('skipListContent').innerHTML = '';
    }

    function updateSkipList(step) {
        $('skipListExplanation').style.display = 'block';
        const seen = new Set(step.seen);
        const W = new Set(step.W);

        const summary = {
            start:   `Entry point #${step.cur} on L${step.layer}`,
            descend: `Descended to L${step.layer} at #${step.cur}`,
            expand:  `L${step.layer}: expanding #${step.cur}`,
            examine: `L${step.layer}: examining #${step.from} → #${step.to}`,
            stop:    `L${step.layer}: no candidate can improve the result`,
            result:  `Nearest neighbour: #${step.cur}`,
        }[step.type];

        let html = `<p class="skip-step-summary">${summary}</p>`;
        for (let i = maxLayers - 1; i >= 0; i--) {
            const active = i === step.layer;
            const ids = Array.from(graph[i].keys()).sort((a, b) => points[a].x - points[b].x);
            html += `<div class="skip-layer${active ? ' active' : ''}"><span class="skip-layer-label">L${i}</span><div class="skip-nodes-container">`;
            for (const id of ids) {
                let cls = 'regular';
                if (seen.has(id)) cls = 'visited';
                if (active && id === step.cur) cls = 'current';
                const inW = active && W.has(id) ? ' in-result' : '';
                html += `<span class="skip-node ${cls}${inW}" title="Node ${id}">${id}</span>`;
            }
            if (!ids.length) html += '<span class="skip-empty">empty</span>';
            html += '</div></div>';
        }
        $('skipListContent').innerHTML = html;
    }

    // ─────────────────────────────────────────────────────────────
    // Event listeners
    // ─────────────────────────────────────────────────────────────

    resetBtn.addEventListener('click', resetAll);
    addPointBtn.addEventListener('click', () => addPoint(...randomCoords()));
    addBulkPointsBtn.addEventListener('click', () => addRandomPoints(10));
    runQueryBtn.addEventListener('click', () => startSearch(...randomCoords()));

    function setMode(mode) {
        clickMode = mode;
        modeInsertBtn.classList.toggle('active', mode === 'insert');
        modeSearchBtn.classList.toggle('active', mode === 'search');
        modeInsertBtn.setAttribute('aria-pressed', mode === 'insert');
        modeSearchBtn.setAttribute('aria-pressed', mode === 'search');
        if (!searching()) {
            showExplanation(mode === 'insert'
                ? 'Click anywhere on a layer to insert a point there.'
                : 'Click anywhere on a layer to place a query and search for its nearest neighbour.', null);
        }
    }
    modeInsertBtn.addEventListener('click', () => setMode('insert'));
    modeSearchBtn.addEventListener('click', () => setMode('search'));

    prevBtn.addEventListener('click', () => { stopPlaying(); goTo(currentStep - 1); });
    nextBtn.addEventListener('click', () => { stopPlaying(); goTo(currentStep + 1); });
    skipToEndBtn.addEventListener('click', () => { stopPlaying(); goTo(steps.length - 1); });
    playBtn.addEventListener('click', togglePlay);
    clearSearchBtn.addEventListener('click', () => clearSearch());

    document.addEventListener('keydown', (e) => {
        if (!searching()) return;
        if (e.target.closest('input, select, textarea, button')) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); stopPlaying(); goTo(currentStep + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); stopPlaying(); goTo(currentStep - 1); }
        else if (e.key === 'End') { e.preventDefault(); stopPlaying(); goTo(steps.length - 1); }
        else if (e.key === 'Home') { e.preventDefault(); stopPlaying(); goTo(0); }
        else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
        else if (e.key === 'Escape') { clearSearch(); }
    });

    maxLayersInput.addEventListener('change', () => rebuild(`Layers set to <strong>${maxLayersInput.value}</strong>.`));
    mInput.addEventListener('change', () => rebuild(`M set to <strong>${mInput.value}</strong>.`));
    efConstructionInput.addEventListener('change', () => rebuild(`efConstruction set to <strong>${efConstructionInput.value}</strong>.`));
    efSearchInput.addEventListener('change', () => {
        efSearch = readInt(efSearchInput, 1, 100);
        if (queryPoint) startSearch(queryPoint.x, queryPoint.y);
        else showExplanation(`efSearch set to <strong>${efSearch}</strong>. It only affects queries, so the index is unchanged.`, null);
    });

    distanceMetricSelect.addEventListener('change', () => {
        distanceMetric = distanceMetricSelect.value;
        updateFormula();
        rebuild(`Distance metric changed to <strong>${METRICS[distanceMetric].name}</strong>. The graph's links depend on the metric.`);
    });

    let resizeRaf = 0;
    window.addEventListener('resize', () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => { sizeCanvases(); render(); });
    });

    // ── Boot ──────────────────────────────────────────────────────
    updateFormula();
    resetAll();
    addRandomPoints(30);
});
