// HNSW Algorithm Simulation — Interactive Visualization
document.addEventListener('DOMContentLoaded', () => {

    // ── DOM references ────────────────────────────────────────────
    const layersContainer = document.getElementById('layersContainer');
    const explanationText = document.getElementById('explanationText');

    const resetBtn          = document.getElementById('reset');
    const addPointBtn       = document.getElementById('addPoint');
    const addBulkPointsBtn  = document.getElementById('addBulkPoints');
    const runQueryBtn       = document.getElementById('runQuery');
    const maxLayersInput    = document.getElementById('maxLayers');
    const mInput            = document.getElementById('m');
    const efConstructionInput = document.getElementById('efConstruction');
    const distanceMetricSelect = document.getElementById('distanceMetric');
    const modeInsertBtn     = document.getElementById('modeInsert');
    const modeSearchBtn     = document.getElementById('modeSearch');

    const floatingPrevStepBtn  = document.getElementById('floatingPrevStep');
    const floatingNextStepBtn  = document.getElementById('floatingNextStep');
    const floatingSkipToEndBtn = document.getElementById('floatingSkipToEnd');
    const floatingStepCounter  = document.getElementById('floatingStepCounter');
    const stepProgressFill     = document.getElementById('stepProgressFill');

    // ── Parameters ────────────────────────────────────────────────
    let maxLayers     = parseInt(maxLayersInput.value);
    let M             = parseInt(mInput.value);
    let efConstruction = parseInt(efConstructionInput.value);
    let visualizationMode = 'insertion';  // 'insertion' | 'search'
    let distanceMetric    = distanceMetricSelect.value;

    // ── State ──────────────────────────────────────────────────────
    let graph     = [];   // graph[layer] = { nodes: [id,...], edges: {id: [id,...]} }
    let points    = [];   // all points including query
    let queryPoint = null;
    let entryPointId = null;  // the global entry node for searches

    let currentStep = 0;
    let maxStep     = 0;
    let stepHistory = [];
    let visitedNodes = [];
    let selectedNode  = null;
    let simulationInProgress = false;

    // ── Coordinate space (logical, not CSS pixels) ────────────────
    const SPACE_W  = 600;
    const SPACE_H  = 150;
    const NODE_R   = 8;

    let contexts = [];  // canvas 2d contexts, indexed by layer

    // ─────────────────────────────────────────────────────────────
    // Initialization
    // ─────────────────────────────────────────────────────────────

    function initializeGraph() {
        points   = [];
        graph    = [];
        visitedNodes = [];
        queryPoint   = null;
        entryPointId = null;
        stepHistory  = [];
        currentStep  = 0;
        maxStep      = 0;
        selectedNode  = null;
        simulationInProgress = false;

        for (let i = 0; i < maxLayers; i++) {
            graph.push({ nodes: [], edges: {} });
        }

        initializeCanvases();

        // Seed the graph with one entry point at the center of the top layer
        const ep = createPoint(SPACE_W / 2, SPACE_H / 2);
        addToLayer(ep, maxLayers - 1);
        entryPointId = ep.id;

        hideSkipList();
        updateFormula();
        updateVisualization();
        showExplanation(
            'Graph initialized with one <strong>entry point</strong> (purple ⭐) at the center of the top layer.<br><br>' +
            'Click <em>+ Add 10 Points</em> to build the graph, then <em>🔍 Search Nearest</em> to run a search.',
            null
        );
        updateNavigationButtons();
    }

    function initializeCanvases() {
        layersContainer.innerHTML = '';
        contexts = [];

        for (let i = 0; i < maxLayers; i++) {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'layer';
            layerDiv.id = `layer-div-${i}`;
            // CSS flex order: top layer renders first (lowest order = top)
            layerDiv.style.order = maxLayers - i;

            const layerTitle = document.createElement('div');
            layerTitle.className = 'layer-title';
            layerTitle.id = `layer-title-${i}`;
            layerTitle.textContent = layerLabel(i, 0);

            // Canvas always uses SPACE_W × SPACE_H as the pixel buffer.
            // CSS width:100% scales it visually; click coords are scaled back.
            const canvas = document.createElement('canvas');
            canvas.className = 'layer-canvas';
            canvas.width  = SPACE_W;
            canvas.height = SPACE_H;
            canvas.id = `layer${i}`;
            canvas.addEventListener('click', (e) => handleCanvasClick(e, i));

            layerDiv.appendChild(layerTitle);
            layerDiv.appendChild(canvas);
            layersContainer.appendChild(layerDiv);

            contexts.push(canvas.getContext('2d'));
        }
    }

    function layerLabel(i, nodeCount) {
        let label = `Layer ${i}`;
        if (i === maxLayers - 1 && maxLayers > 1) label += '  (top — sparse, fast)';
        else if (i === 0)                          label += '  (bottom — all points, precise)';
        const countStr = nodeCount === 1 ? '1 node' : `${nodeCount} nodes`;
        return `${label}   ·   ${countStr}`;
    }

    function updateLayerTitles() {
        for (let i = 0; i < maxLayers; i++) {
            const el = document.getElementById(`layer-title-${i}`);
            if (el) el.textContent = layerLabel(i, graph[i].nodes.length);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Canvas interaction
    // ─────────────────────────────────────────────────────────────

    function handleCanvasClick(event, layerId) {
        if (simulationInProgress) return;

        const canvas = event.target;
        const rect   = canvas.getBoundingClientRect();

        // Map CSS click coordinates → logical [0, SPACE_W] × [0, SPACE_H] space
        const scaleX = SPACE_W / rect.width;
        const scaleY = SPACE_H / rect.height;
        const x = clamp((event.clientX - rect.left) * scaleX, NODE_R + 5, SPACE_W - NODE_R - 5);
        const y = clamp((event.clientY - rect.top)  * scaleY, NODE_R + 5, SPACE_H - NODE_R - 5);

        if (visualizationMode === 'insertion') {
            insertPoint(createPoint(x, y));
        } else {
            startSearch(createPoint(x, y));
        }
    }

    function clamp(val, lo, hi) {
        return Math.min(Math.max(val, lo), hi);
    }

    // ─────────────────────────────────────────────────────────────
    // Drawing
    // ─────────────────────────────────────────────────────────────

    function updateVisualization() {
        updateLayerTitles();

        for (let i = 0; i < maxLayers; i++) {
            const ctx = contexts[i];
            ctx.clearRect(0, 0, SPACE_W, SPACE_H);

            const stepData = (simulationInProgress && currentStep < stepHistory.length)
                ? stepHistory[currentStep] : null;

            const isActiveLayer = stepData && stepData.layer === i;

            // Highlight active layer
            if (isActiveLayer) {
                ctx.fillStyle = 'rgba(46, 204, 113, 0.08)';
                ctx.fillRect(0, 0, SPACE_W, SPACE_H);
                ctx.fillStyle = '#27ae60';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText('▶ ACTIVE', SPACE_W - 8, 6);
            }

            // Mark layer div as active
            const layerDiv = document.getElementById(`layer-div-${i}`);
            if (layerDiv) {
                layerDiv.classList.toggle('active-layer', !!isActiveLayer);
            }

            // Draw edges
            const edges = graph[i].edges;
            const traversedEdges = simulationInProgress
                ? new Set(stepHistory.slice(0, currentStep + 1)
                    .filter(s => s.layer === i && s.from !== undefined)
                    .flatMap(s => [`${s.from}-${s.to}`, `${s.to}-${s.from}`]))
                : new Set();

            for (const fromId in edges) {
                const fromNode = points.find(p => p.id === parseInt(fromId));
                if (!fromNode) continue;

                for (const toId of edges[fromId]) {
                    const toNode = points.find(p => p.id === toId);
                    if (!toNode) continue;

                    const active = traversedEdges.has(`${fromId}-${toId}`);

                    ctx.beginPath();
                    ctx.moveTo(fromNode.x, fromNode.y);
                    ctx.lineTo(toNode.x, toNode.y);
                    ctx.strokeStyle = active ? '#2ecc71' : '#c8d0da';
                    ctx.lineWidth   = active ? 2.5 : 1;
                    ctx.stroke();
                }
            }

            // Draw nodes
            for (const pt of points) {
                const visibleOnLayer = pt.layer >= i || (queryPoint && pt.id === queryPoint.id);
                if (!visibleOnLayer) continue;

                const isQuery   = queryPoint && pt.id === queryPoint.id;
                const isEntry   = pt.id === entryPointId && !isQuery;
                const isVisited = simulationInProgress &&
                                  visitedNodes.slice(0, currentStep + 1).includes(pt.id);
                const isCurrent = simulationInProgress && selectedNode && pt.id === selectedNode.id;

                // Entry point halo (shown when not in search)
                if (isEntry && !simulationInProgress) {
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, NODE_R + 6, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(155, 89, 182, 0.45)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 3]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Node fill
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, NODE_R, 0, Math.PI * 2);

                if (isQuery) {
                    ctx.fillStyle   = '#e74c3c';
                    ctx.strokeStyle = '#c0392b';
                    ctx.lineWidth   = 2.5;
                } else if (isCurrent) {
                    ctx.fillStyle   = '#2ecc71';
                    ctx.strokeStyle = '#27ae60';
                    ctx.lineWidth   = 2;
                } else if (isVisited) {
                    ctx.fillStyle   = '#f1c40f';
                    ctx.strokeStyle = '#e67e22';
                    ctx.lineWidth   = 1.5;
                } else if (isEntry) {
                    ctx.fillStyle   = '#9b59b6';
                    ctx.strokeStyle = '#8e44ad';
                    ctx.lineWidth   = 2;
                } else {
                    ctx.fillStyle   = '#3498db';
                    ctx.strokeStyle = '#2980b9';
                    ctx.lineWidth   = 1;
                }

                ctx.fill();
                ctx.stroke();

                // ID label (white, inside node)
                ctx.fillStyle    = '#fff';
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `bold 9px Arial`;
                ctx.fillText(pt.id, pt.x, pt.y);

                // Sub-label
                if (isQuery) {
                    ctx.fillStyle = '#c0392b';
                    ctx.font = '8px Arial';
                    ctx.fillText('QUERY', pt.x, pt.y + NODE_R + 9);
                } else if (isEntry && !simulationInProgress) {
                    ctx.fillStyle = '#8e44ad';
                    ctx.font = '8px Arial';
                    ctx.fillText('ENTRY', pt.x, pt.y + NODE_R + 9);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Point creation helpers
    // ─────────────────────────────────────────────────────────────

    function createPoint(x, y) {
        return { id: points.length, x, y, layer: 0 };
    }

    function addToLayer(point, layer) {
        point.layer = Math.max(point.layer, layer);
        graph[layer].nodes.push(point.id);
        if (!points.includes(point)) points.push(point);
    }

    function generateRandomPoint() {
        const pad = NODE_R + 10;
        return createPoint(
            Math.random() * (SPACE_W - 2 * pad) + pad,
            Math.random() * (SPACE_H - 2 * pad) + pad
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Distance metrics
    // ─────────────────────────────────────────────────────────────

    function distance(a, b) {
        switch (distanceMetric) {
            case 'manhattan': return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
            case 'chebyshev': return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
            default:          return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        }
    }

    function metricName() {
        return { manhattan: 'Manhattan', chebyshev: 'Chebyshev', euclidean: 'Euclidean' }[distanceMetric] || 'Euclidean';
    }

    function fmt(d) { return d.toFixed(1); }

    function updateFormula() {
        const box = document.getElementById('formulaBox');
        if (!box) return;
        const formulas = {
            euclidean: { name: 'Euclidean', expr: '√((x₁−x₂)² + (y₁−y₂)²)' },
            manhattan: { name: 'Manhattan', expr: '|x₁−x₂| + |y₁−y₂|' },
            chebyshev: { name: 'Chebyshev', expr: 'max(|x₁−x₂|, |y₁−y₂|)' },
        };
        const f = formulas[distanceMetric] || formulas.euclidean;
        box.querySelector('.formula-title').textContent   = `Distance: ${f.name}`;
        box.querySelector('.formula-content').textContent = f.expr;
    }

    // ─────────────────────────────────────────────────────────────
    // Explanation panel
    // ─────────────────────────────────────────────────────────────

    function showExplanation(html, stepType) {
        const badge = document.getElementById('stepBadge');
        if (badge) {
            if (stepType) {
                const cfg = {
                    start:            { label: 'START',      cls: 'badge-start'   },
                    examine:          { label: 'EXAMINE',    cls: 'badge-examine' },
                    move:             { label: 'MOVE →',     cls: 'badge-move'    },
                    layer_transition: { label: '↓ DESCEND',  cls: 'badge-descend' },
                    result:           { label: '✓ RESULT',   cls: 'badge-result'  },
                };
                const b = cfg[stepType] || { label: stepType.toUpperCase(), cls: 'badge-start' };
                badge.textContent = b.label;
                badge.className   = `step-badge ${b.cls}`;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
        explanationText.innerHTML = html;
    }

    // ─────────────────────────────────────────────────────────────
    // Graph layer assignment (probabilistic)
    // ─────────────────────────────────────────────────────────────

    function assignLayer() {
        let layer = 0;
        while (Math.random() < 1 / M && layer < maxLayers - 1) layer++;
        return layer;
    }

    // ─────────────────────────────────────────────────────────────
    // INSERTION
    // ─────────────────────────────────────────────────────────────

    function insertPoint(point) {
        resetSearch();

        const pointMaxLayer = assignLayer();

        // Find current entry into the graph
        let currEntryId  = null;
        let currEntryLayer = 0;
        for (let l = maxLayers - 1; l >= 0; l--) {
            if (graph[l].nodes.length > 0 && graph[l].nodes[0] !== point.id) {
                currEntryId   = graph[l].nodes[0];
                currEntryLayer = l;
                break;
            }
        }

        if (currEntryId === null) {
            // First actual point after the entry point
            addToLayer(point, pointMaxLayer);
            if (entryPointId === null) entryPointId = point.id;
            showExplanation(`Node ${point.id} inserted as the entry point at Layer ${pointMaxLayer}.`, null);
            updateVisualization();
            return;
        }

        let currObj = points.find(p => p.id === currEntryId);

        // Phase 1: greedy descent from top to pointMaxLayer (no connections yet)
        for (let l = maxLayers - 1; l > pointMaxLayer; l--) {
            if (graph[l].nodes.length === 0) continue;
            let changed = true;
            while (changed) {
                changed = false;
                const nbrs = (graph[l].edges[currObj.id] || []).map(nId => ({
                    id: nId,
                    d: distance(point, points.find(p => p.id === nId))
                }));
                if (nbrs.length) {
                    nbrs.sort((a, b) => a.d - b.d);
                    const closest = points.find(p => p.id === nbrs[0].id);
                    if (distance(point, closest) < distance(point, currObj)) {
                        currObj = closest;
                        changed = true;
                    }
                }
            }
        }

        // Phase 2: insert and connect at each layer up to pointMaxLayer
        for (let l = Math.min(pointMaxLayer, maxLayers - 1); l >= 0; l--) {
            const candidates = new Set([currObj.id]);
            let frontier = new Set([currObj.id]);

            for (let iter = 0; iter < efConstruction && frontier.size > 0; iter++) {
                const next = new Set();
                for (const nId of frontier) {
                    for (const nbr of (graph[l].edges[nId] || [])) {
                        if (!candidates.has(nbr)) { candidates.add(nbr); next.add(nbr); }
                    }
                }
                frontier = next;
            }

            const sorted = [...candidates]
                .map(cId => ({ id: cId, d: distance(point, points.find(p => p.id === cId)) }))
                .sort((a, b) => a.d - b.d)
                .slice(0, M)
                .map(n => n.id);

            if (!graph[l].edges[point.id]) graph[l].edges[point.id] = [];
            for (const nId of sorted) {
                if (nId === point.id) continue;
                graph[l].edges[point.id].push(nId);
                if (!graph[l].edges[nId]) graph[l].edges[nId] = [];
                graph[l].edges[nId].push(point.id);
            }

            addToLayer(point, l);
            currObj = point;
        }

        const range = pointMaxLayer === 0 ? 'Layer 0 only' : `Layers 0–${pointMaxLayer}`;
        const promoted = pointMaxLayer > 0
            ? `<br><span style="color:#9b59b6">⬆ Promoted to higher layers — will act as a navigation shortcut!</span>`
            : '';
        showExplanation(
            `Node <strong>${point.id}</strong> inserted (${range}).<br>` +
            `Connected to up to <strong>${M}</strong> nearest neighbors at each layer.${promoted}`,
            null
        );
        updateVisualization();
    }

    // ─────────────────────────────────────────────────────────────
    // SEARCH
    // ─────────────────────────────────────────────────────────────

    function startSearch(point) {
        // Clean up previous query point from the points array
        if (queryPoint && points.includes(queryPoint)) {
            points.splice(points.indexOf(queryPoint), 1);
        }
        queryPoint = point;
        queryPoint.layer = maxLayers - 1;  // visible on all layers
        if (!points.includes(queryPoint)) points.push(queryPoint);
        searchNearest(queryPoint);
    }

    function searchNearest(point) {
        resetSearch();
        visitedNodes = [];
        stepHistory  = [];
        simulationInProgress = true;

        const graphPoints = points.filter(p => !queryPoint || p.id !== queryPoint.id);
        if (graphPoints.length === 0) {
            showExplanation('Add some points first, then run a search.', null);
            simulationInProgress = false;
            return;
        }

        // Find entry node (highest non-empty layer, first node)
        let epId    = null;
        let epLayer = 0;
        for (let l = maxLayers - 1; l >= 0; l--) {
            if (graph[l].nodes.length > 0) { epId = graph[l].nodes[0]; epLayer = l; break; }
        }
        if (epId === null) {
            showExplanation('No graph nodes found. Reset and add points.', null);
            simulationInProgress = false;
            return;
        }

        let currObj  = points.find(p => p.id === epId);
        let currDist = distance(point, currObj);
        visitedNodes.push(currObj.id);

        stepHistory.push({
            type: 'start',
            layer: epLayer,
            selectedNode: currObj.id,
            description:
                `Search begins at <strong>Layer ${epLayer}</strong> (the highest active layer).<br>` +
                `Entry node: <strong>#${currObj.id}</strong> — distance to query: <strong>${fmt(currDist)}</strong><br><br>` +
                `Strategy: greedily move closer at each layer, then descend for finer resolution.`
        });

        for (let layer = epLayer; layer >= 0; layer--) {
            selectedNode = currObj;

            if (layer < epLayer) {
                stepHistory.push({
                    type: 'layer_transition',
                    layer,
                    selectedNode: currObj.id,
                    description:
                        `Descending to <strong>Layer ${layer}</strong>.<br>` +
                        `Entry point for this layer: <strong>Node ${currObj.id}</strong> (dist: ${fmt(currDist)})<br><br>` +
                        `Layer ${layer} has <strong>${graph[layer].nodes.length} nodes</strong> — ` +
                        (layer === 0 ? 'this is the densest layer; our final answer comes from here.' : 'more points than above, so more precision.')
                });
            }

            let changed = true;
            while (changed) {
                changed = false;
                const nbrs = graph[layer].edges[currObj.id] || [];

                for (const nbrId of nbrs) {
                    if (visitedNodes.includes(nbrId)) continue;

                    const nbr  = points.find(p => p.id === nbrId);
                    const d    = distance(point, nbr);
                    const closer = d < currDist;
                    visitedNodes.push(nbrId);

                    stepHistory.push({
                        type: 'examine',
                        from: currObj.id,
                        to: nbrId,
                        layer,
                        selectedNode: currObj.id,
                        description:
                            `At Layer ${layer}: checking edge <strong>#${currObj.id} → #${nbrId}</strong><br>` +
                            `Node ${nbrId} distance to query: <strong>${fmt(d)}</strong><br>` +
                            `Current best: <strong>${fmt(currDist)}</strong><br><br>` +
                            (closer
                                ? `<span style="color:#27ae60">✓ Closer! Moving to Node ${nbrId} next.</span>`
                                : `<span style="color:#95a5a6">✗ Not closer. Staying at Node ${currObj.id}.</span>`)
                    });

                    if (closer) {
                        currObj  = nbr;
                        currDist = d;
                        changed  = true;
                        selectedNode = currObj;

                        stepHistory.push({
                            type: 'move',
                            from: nbrId, to: nbrId,
                            layer,
                            selectedNode: nbrId,
                            description:
                                `Moved to <strong>Node ${nbrId}</strong> at Layer ${layer}.<br>` +
                                `New best distance: <strong>${fmt(d)}</strong><br><br>` +
                                `Now checking neighbors of Node ${nbrId}.`
                        });
                    }
                }
            }
        }

        const totalGraphNodes = graphPoints.length;
        const stepsUsed = stepHistory.length;
        stepHistory.push({
            type: 'result',
            layer: 0,
            selectedNode: currObj.id,
            description:
                `<strong>Search complete!</strong><br>` +
                `Nearest neighbor: <strong>Node ${currObj.id}</strong><br>` +
                `Distance to query: <strong>${fmt(currDist)}</strong><br><br>` +
                `HNSW found this in <strong>${stepsUsed} steps</strong> across ${totalGraphNodes} nodes ` +
                `— far fewer than a brute-force scan of all nodes.`
        });

        currentStep = 0;
        maxStep     = stepHistory.length - 1;
        selectedNode = points.find(p => p.id === stepHistory[0].selectedNode);

        const first = stepHistory[0];
        showExplanation(first.description, first.type);
        updateSkipList(first);
        updateVisualization();
        updateNavigationButtons();
    }

    // ─────────────────────────────────────────────────────────────
    // Reset search state
    // ─────────────────────────────────────────────────────────────

    function resetSearch() {
        visitedNodes = [];
        stepHistory  = [];
        selectedNode  = null;
        currentStep  = 0;
        maxStep      = 0;
        simulationInProgress = false;
        hideSkipList();
        updateVisualization();
        updateNavigationButtons();
    }

    function hideSkipList() {
        const el = document.getElementById('skipListExplanation');
        if (el) el.style.display = 'none';
        const content = document.getElementById('skipListContent');
        if (content) content.innerHTML = '';
    }

    // ─────────────────────────────────────────────────────────────
    // Skip-list navigation view
    // ─────────────────────────────────────────────────────────────

    function updateSkipList(step) {
        const container = document.getElementById('skipListExplanation');
        const content   = document.getElementById('skipListContent');
        if (!container || !content || !simulationInProgress) { hideSkipList(); return; }

        container.style.display = 'block';

        const currentLayer  = step.layer !== undefined ? step.layer : -1;
        const currentNodeId = step.selectedNode;

        const stepSummaries = {
            start:            `Starting search at entry node #${currentNodeId} (Layer ${currentLayer})`,
            layer_transition: `Descended to Layer ${currentLayer} — entry node #${currentNodeId}`,
            examine:          `Layer ${currentLayer}: examining edge #${step.from} → #${step.to}`,
            move:             `Layer ${currentLayer}: moved to node #${currentNodeId}`,
            result:           `Search done — nearest neighbor is node #${currentNodeId}`,
        };

        let html = `<p class="skip-step-summary">${stepSummaries[step.type] || ''}</p>`;

        for (let i = maxLayers - 1; i >= 0; i--) {
            const active = i === currentLayer;
            html += `<div class="skip-layer${active ? ' active' : ''}">`;
            html += `<span class="skip-layer-label">L${i}</span>`;
            html += `<div class="skip-nodes-container">`;

            const nodeIds = points
                .filter(p => p.layer >= i && graph[i].nodes.includes(p.id))
                .map(p => p.id)
                .sort((a, b) => a - b);

            if (queryPoint && !nodeIds.includes(queryPoint.id)) nodeIds.push(queryPoint.id);
            nodeIds.sort((a, b) => a - b);

            for (let j = 0; j < nodeIds.length; j++) {
                const nId = nodeIds[j];
                let cls = 'regular';
                if (queryPoint && nId === queryPoint.id) cls = 'query';
                else if (nId === currentNodeId) cls = 'current';
                else if (visitedNodes.slice(0, currentStep + 1).includes(nId)) cls = 'visited';

                html += `<span class="skip-node ${cls}" title="Node ${nId}">${nId}</span>`;
                if (j < nodeIds.length - 1) html += `<span class="skip-arrow">→</span>`;
            }

            html += `</div></div>`;
        }

        content.innerHTML = html;
    }

    // ─────────────────────────────────────────────────────────────
    // Step navigation
    // ─────────────────────────────────────────────────────────────

    function applyStep(step) {
        if (step.selectedNode !== undefined) {
            selectedNode = points.find(p => p.id === step.selectedNode) || null;
        }
        showExplanation(step.description, step.type);
        updateSkipList(step);
        updateVisualization();
        updateNavigationButtons();
    }

    function goToNextStep() {
        if (currentStep < maxStep) { currentStep++; applyStep(stepHistory[currentStep]); }
    }

    function goToPrevStep() {
        if (currentStep > 0) { currentStep--; applyStep(stepHistory[currentStep]); }
    }

    function skipToEnd() {
        currentStep = maxStep;
        if (maxStep >= 0) applyStep(stepHistory[currentStep]);
    }

    function updateNavigationButtons() {
        const noSteps = maxStep <= 0;
        floatingPrevStepBtn.disabled  = currentStep <= 0 || noSteps;
        floatingNextStepBtn.disabled  = currentStep >= maxStep || noSteps;
        floatingSkipToEndBtn.disabled = currentStep >= maxStep || noSteps;

        const nav = document.getElementById('floatingNavigationButtons');
        nav.style.display = (simulationInProgress && stepHistory.length > 0) ? 'flex' : 'none';

        if (floatingStepCounter) {
            floatingStepCounter.textContent = noSteps ? '' : `Step ${currentStep + 1} / ${maxStep + 1}`;
        }

        if (stepProgressFill && !noSteps) {
            const pct = maxStep > 0 ? (currentStep / maxStep) * 100 : 0;
            stepProgressFill.style.width = `${pct}%`;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Bulk add
    // ─────────────────────────────────────────────────────────────

    function addBulkPoints(count) {
        if (simulationInProgress) return;
        for (let i = 0; i < count; i++) {
            insertPoint(generateRandomPoint());
        }
        const promoted = graph.slice(1).some(l => l.nodes.length > 0);
        showExplanation(
            `Added <strong>${count} points</strong> to the graph.<br><br>` +
            (promoted
                ? 'Notice the <strong>higher layers are sparse</strong> — only a few nodes get randomly promoted there. ' +
                  'These are the "highway" nodes that make search fast.'
                : 'The graph is still small — higher layers may be empty. Try adding more points!'),
            null
        );
    }

    // ─────────────────────────────────────────────────────────────
    // Event listeners
    // ─────────────────────────────────────────────────────────────

    resetBtn.addEventListener('click', () => {
        maxLayers      = parseInt(maxLayersInput.value);
        M              = parseInt(mInput.value);
        efConstruction = parseInt(efConstructionInput.value);
        queryPoint     = null;
        initializeGraph();
    });

    addPointBtn.addEventListener('click', () => {
        if (!simulationInProgress) insertPoint(generateRandomPoint());
    });

    addBulkPointsBtn.addEventListener('click', () => addBulkPoints(10));

    runQueryBtn.addEventListener('click', () => {
        if (simulationInProgress) return;
        startSearch(generateRandomPoint());
    });

    // Mode toggle
    if (modeInsertBtn) {
        modeInsertBtn.addEventListener('click', () => {
            visualizationMode = 'insertion';
            modeInsertBtn.classList.add('active');
            modeSearchBtn.classList.remove('active');
            if (!simulationInProgress) {
                resetSearch();
                showExplanation('Click on any layer canvas to add a new point there.', null);
            }
        });
    }

    if (modeSearchBtn) {
        modeSearchBtn.addEventListener('click', () => {
            visualizationMode = 'search';
            modeSearchBtn.classList.add('active');
            modeInsertBtn.classList.remove('active');
            if (!simulationInProgress) {
                resetSearch();
                showExplanation('Click on any layer canvas to place a query point and search for its nearest neighbor.', null);
            }
        });
    }

    // Step navigation
    floatingNextStepBtn.addEventListener('click', goToNextStep);
    floatingPrevStepBtn.addEventListener('click', goToPrevStep);
    floatingSkipToEndBtn.addEventListener('click', skipToEnd);

    // Keyboard: arrow keys for step navigation
    document.addEventListener('keydown', (e) => {
        if (!simulationInProgress) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goToNextStep(); }
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goToPrevStep(); }
        if (e.key === 'End') { e.preventDefault(); skipToEnd(); }
    });

    // Parameter changes
    maxLayersInput.addEventListener('change', () => { maxLayers = parseInt(maxLayersInput.value); });
    mInput.addEventListener('change', () => { M = parseInt(mInput.value); });
    efConstructionInput.addEventListener('change', () => { efConstruction = parseInt(efConstructionInput.value); });

    distanceMetricSelect.addEventListener('change', () => {
        distanceMetric = distanceMetricSelect.value;
        updateFormula();
        if (simulationInProgress) resetSearch();
        showExplanation(`Distance metric changed to <strong>${metricName()}</strong>.`, null);
    });

    window.addEventListener('resize', () => {
        initializeCanvases();
        updateVisualization();
    });

    // ── Boot ──────────────────────────────────────────────────────
    initializeGraph();
});
