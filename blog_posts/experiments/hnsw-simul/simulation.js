// HNSW Algorithm Simulation for Approximate Nearest Neighbor Search
document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup for visualization
    const layersContainer = document.getElementById('layersContainer');
    const explanationText = document.getElementById('explanationText');
    
    // UI Controls
    const resetBtn = document.getElementById('reset');
    const addPointBtn = document.getElementById('addPoint');
    const runQueryBtn = document.getElementById('runQuery');
    const maxLayersInput = document.getElementById('maxLayers');
    const mInput = document.getElementById('m');
    const efConstructionInput = document.getElementById('efConstruction');
    const searchModeSelect = document.getElementById('searchMode');
    const distanceMetricSelect = document.getElementById('distanceMetric');
    
    // Floating Navigation Controls
    const floatingPrevStepBtn = document.getElementById('floatingPrevStep');
    const floatingNextStepBtn = document.getElementById('floatingNextStep');
    const floatingSkipToEndBtn = document.getElementById('floatingSkipToEnd');
    const floatingStepCounter = document.getElementById('floatingStepCounter');
    
    // HNSW parameters
    let maxLayers = parseInt(maxLayersInput.value);
    let M = parseInt(mInput.value);
    let efConstruction = parseInt(efConstructionInput.value);
    let visualizationMode = searchModeSelect.value;
    let distanceMetric = distanceMetricSelect.value;
    
    // Data structures
    let graph = []; // Array of layers, each layer is a graph
    let points = []; // Array of points (each point is {x, y, layer})
    let queryPoint = null;
    let currentStep = 0;
    let maxStep = 0;
    let stepHistory = [];
    let visitedNodes = [];
    let selectedNode = null;
    let simulationInProgress = false;
    
    // Initialize 2D space for points
    const spaceWidth = 600;
    const spaceHeight = 150;
    const nodeRadius = 8;
    
    // Canvas contexts for each layer
    let contexts = [];
    
    // Initialize the graph
    function initializeGraph() {
        points = [];
        graph = [];
        visitedNodes = [];
        queryPoint = null;
        stepHistory = [];
        currentStep = 0;
        maxStep = 0;
        selectedNode = null;
        simulationInProgress = false;
        
        // Create layers
        for (let i = 0; i < maxLayers; i++) {
            graph.push({
                nodes: [],
                edges: {}
            });
        }
        
        // Create canvas for each layer
        initializeCanvases();
        
        // Add the entry point at the center of the space
        const entryPoint = createPoint(spaceWidth / 2, spaceHeight / 2);
        addToLayer(entryPoint, maxLayers - 1); // Add to top layer
        
        // Clear skip list explanation
        const skipListExplanation = document.getElementById('skipListExplanation');
        const skipListContent = document.getElementById('skipListContent');
        if (skipListExplanation) {
            skipListExplanation.style.display = 'none';
        }
        if (skipListContent) {
            skipListContent.innerHTML = '';
        }
        
        updateVisualization();
        showExplanation("HNSW graph initialized with an entry point. You can add points and run queries.");
        updateNavigationButtons();
    }
    
    function initializeCanvases() {
        layersContainer.innerHTML = '';
        contexts = [];
        
        for (let i = 0; i < maxLayers; i++) {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'layer';
            layerDiv.style.order = maxLayers - i;
            
            const layerTitle = document.createElement('div');
            layerTitle.className = 'layer-title';
            layerTitle.textContent = `Layer ${i}`;
            
            const canvas = document.createElement('canvas');
            canvas.className = 'layer-canvas';
            canvas.width = layersContainer.clientWidth - 40;
            canvas.height = spaceHeight;
            canvas.id = `layer${i}`;
            
            // Add click event listener to canvas
            canvas.addEventListener('click', (e) => handleCanvasClick(e, i));
            
            layerDiv.appendChild(layerTitle);
            layerDiv.appendChild(canvas);
            layersContainer.appendChild(layerDiv);
            
            const context = canvas.getContext('2d');
            contexts.push(context);
        }
    }
    
    function handleCanvasClick(event, layerId) {
        // If a simulation is in progress, don't allow new points
        if (simulationInProgress) return;
        
        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        const x = Math.min(Math.max(event.clientX - rect.left, nodeRadius + 5), canvas.width - nodeRadius - 5);
        const y = Math.min(Math.max(event.clientY - rect.top, nodeRadius + 5), canvas.height - nodeRadius - 5);
        
        // Check if we're adding a new point or setting a query point
        if (visualizationMode === 'insertion') {
            const newPoint = createPoint(x, y);
            insertPoint(newPoint, false); // Simple insertion without step-by-step
        } else if (visualizationMode === 'search') {
            queryPoint = createPoint(x, y);
            // Add this query point to all layers but don't connect it to the graph
            // This ensures it's visible on all layers for consistency
            for (let i = 0; i < maxLayers; i++) {
                // We don't use addToLayer here because we don't want to add it to the graph nodes
                queryPoint.layer = Math.max(queryPoint.layer, maxLayers - 1);
            }
            
            // Add the query point to the points array but don't add it to the graph structure
            if (!points.includes(queryPoint)) {
                points.push(queryPoint);
            }
            
            searchNearest(queryPoint);
        }
    }
    
    function updateVisualization() {
        // Clear all canvases
        for (let i = 0; i < maxLayers; i++) {
            const ctx = contexts[i];
            ctx.clearRect(0, 0, spaceWidth, spaceHeight);
            
            // Draw edges
            const edges = graph[i].edges;
            for (const fromId in edges) {
                const neighbors = edges[fromId];
                const fromNode = points.find(p => p.id === parseInt(fromId));
                if (!fromNode) continue;
                
                for (const toId of neighbors) {
                    const toNode = points.find(p => p.id === toId);
                    if (!toNode) continue;
                    
                    ctx.beginPath();
                    ctx.moveTo(fromNode.x, fromNode.y);
                    ctx.lineTo(toNode.x, toNode.y);
                    
                    // Style for active paths during search based on current step
                    const isActive = simulationInProgress && stepHistory.slice(0, currentStep + 1).some(step => 
                        (step.from === parseInt(fromId) && step.to === toId) ||
                        (step.from === toId && step.to === parseInt(fromId)) &&
                        step.layer === i
                    );
                    
                    if (isActive) {
                        ctx.strokeStyle = '#2ecc71';
                        ctx.lineWidth = 2;
                    } else {
                        ctx.strokeStyle = '#95a5a6';
                        ctx.lineWidth = 1;
                    }
                    
                    ctx.stroke();
                }
            }
            
            // Draw nodes
            for (const point of points) {
                // Only draw points at or above the current layer
                // Special case for query point - always draw it on all layers
                if (point.layer >= i || (queryPoint && point.id === queryPoint.id)) {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, nodeRadius, 0, Math.PI * 2);
                    
                    // Node styling based on state and current step
                    const isVisited = simulationInProgress && visitedNodes.slice(0, currentStep + 1).includes(point.id);
                    
                    if (queryPoint && point.id === queryPoint.id) {
                        // Query point always highlighted as red
                        ctx.fillStyle = '#e74c3c';  // Query point is red
                        ctx.strokeStyle = '#c0392b';
                        // Make the query point slightly larger to stand out
                        ctx.lineWidth = 2;
                    } else if (simulationInProgress && selectedNode && point.id === selectedNode.id && 
                              (currentStep >= stepHistory.findIndex(step => step.selectedNode === point.id))) {
                        ctx.fillStyle = '#2ecc71';  // Selected/current node is green
                        ctx.strokeStyle = '#27ae60';
                        ctx.lineWidth = 1;
                    } else if (isVisited) {
                        ctx.fillStyle = '#f1c40f';  // Visited nodes are yellow
                        ctx.strokeStyle = '#f39c12';
                        ctx.lineWidth = 1;
                    } else {
                        ctx.fillStyle = '#3498db';  // Regular nodes are blue
                        ctx.strokeStyle = '#2980b9';
                        ctx.lineWidth = 1;
                    }
                    
                    ctx.fill();
                    ctx.stroke();
                    
                    // Draw node ID
                    ctx.fillStyle = '#000';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = '10px Arial';
                    ctx.fillText(point.id, point.x, point.y);
                    
                    // Add "QUERY" label below the query point
                    if (queryPoint && point.id === queryPoint.id) {
                        ctx.font = 'bold 9px Arial';
                        ctx.fillText('QUERY', point.x, point.y + nodeRadius + 10);
                    }
                }
            }
            
            // Draw a special marker if this is the active layer in the current step
            if (simulationInProgress && currentStep < stepHistory.length) {
                const currentStepData = stepHistory[currentStep];
                if (currentStepData.layer === i) {
                    // Highlight the active layer
                    ctx.fillStyle = 'rgba(46, 204, 113, 0.1)';
                    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    
                    // Add an "Active Layer" indicator
                    ctx.fillStyle = '#27ae60';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'right';
                    ctx.fillText('ACTIVE LAYER', ctx.canvas.width - 10, 15);
                }
            }
        }
    }
    
    // Create a new point
    function createPoint(x, y) {
        const id = points.length;
        return { id, x, y, layer: 0 };
    }
    
    // Add a point to a specific layer
    function addToLayer(point, layer) {
        point.layer = Math.max(point.layer, layer);
        graph[layer].nodes.push(point.id);
        
        if (!points.includes(point)) {
            points.push(point);
        }
    }
    
    // Generate a random point
    function generateRandomPoint() {
        const padding = nodeRadius + 5;
        const x = Math.random() * (spaceWidth - 2 * padding) + padding;
        const y = Math.random() * (spaceHeight - 2 * padding) + padding;
        return createPoint(x, y);
    }
    
    // Calculate distance between two points based on selected metric
    function distance(a, b) {
        switch (distanceMetric) {
            case 'manhattan':
                return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
            case 'chebyshev':
                return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
            case 'euclidean':
            default:
                return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        }
    }

    // Get the name of the current distance metric
    function getDistanceMetricName() {
        switch (distanceMetric) {
            case 'manhattan':
                return 'Manhattan';
            case 'chebyshev':
                return 'Chebyshev';
            case 'euclidean':
            default:
                return 'Euclidean';
        }
    }

    // Update the distance display format in step descriptions
    function formatDistance(dist) {
        return `${dist.toFixed(2)} (${getDistanceMetricName()} distance)`;
    }
    
    // Find nearest neighbors to a point in a layer
    function findNearestNeighbors(point, layer, k) {
        const neighbors = [];
        
        for (const nodeId of graph[layer].nodes) {
            const node = points.find(p => p.id === nodeId);
            if (node.id !== point.id) {
                const dist = distance(point, node);
                neighbors.push({ id: node.id, distance: dist });
            }
        }
        
        // Sort by distance and take top k
        neighbors.sort((a, b) => a.distance - b.distance);
        return neighbors.slice(0, k).map(n => n.id);
    }
    
    // Determine the maximum layer for a new point (probabilistic)
    function assignLayer() {
        let layer = 0;
        const layerProbability = 1 / M;
        
        // Assign higher layers with decreasing probability
        while (Math.random() < layerProbability && layer < maxLayers - 1) {
            layer++;
        }
        
        return layer;
    }
    
    // Search for nearest neighbor with step-by-step visualization
    function searchNearest(point) {
        resetSearch();
        visitedNodes = [];
        stepHistory = [];
        simulationInProgress = true;
        
        if (points.length <= 1) {
            showExplanation("Not enough points for search. Add more points first.");
            simulationInProgress = false;
            return;
        }
        
        // Start with entry point in the highest non-empty layer
        let entryPointId = null;
        let entryLayer = 0;
        
        for (let l = maxLayers - 1; l >= 0; l--) {
            if (graph[l].nodes.length > 0) {
                entryPointId = graph[l].nodes[0];
                entryLayer = l;
                break;
            }
        }
        
        if (entryPointId === null) {
            showExplanation("No entry point found. Add some points first.");
            simulationInProgress = false;
            return;
        }
        
        // Initialize variables for the search
        let currObj = points.find(p => p.id === entryPointId);
        let currDist = distance(point, currObj);
        
        visitedNodes.push(currObj.id);
        
        // For tracking path by layer
        let pathByLayer = {};
        for (let i = 0; i <= entryLayer; i++) {
            pathByLayer[i] = [];
        }
        
        // Add entry point to its layer
        pathByLayer[entryLayer].push(currObj.id);
        
        // Record the initial state
        stepHistory.push({
            type: 'start',
            layer: entryLayer,
            selectedNode: currObj.id,
            description: `Starting search at Layer ${entryLayer}, Node ${currObj.id}.\nSearching for nearest neighbor to Query Point ${point.id} using ${getDistanceMetricName()} distance.`
        });
        
        // For each layer from top to bottom
        for (let currLayer = entryLayer; currLayer >= 0; currLayer--) {
            selectedNode = currObj;
            
            // Record layer transition if we're moving down
            if (currLayer < entryLayer) {
                stepHistory.push({
                    type: 'layer_transition',
                    layer: currLayer,
                    selectedNode: currObj.id,
                    description: `Moving down to Layer ${currLayer}, starting with Node ${currObj.id}.\nSearching for nearest neighbor to Query Point ${point.id} using ${getDistanceMetricName()} distance.`
                });
            }
            
            let changed = true;
            while (changed) {
                changed = false;
                
                // Get neighbors at this layer
                const neighbors = graph[currLayer].edges[currObj.id] || [];
                
                for (const neighborId of neighbors) {
                    const neighbor = points.find(p => p.id === neighborId);
                    const dist = distance(point, neighbor);
                    
                    // Visit the neighbor
                    if (!visitedNodes.includes(neighborId)) {
                        visitedNodes.push(neighborId);
                        
                        // Record examining a neighbor
                        stepHistory.push({
                            type: 'examine',
                            from: currObj.id,
                            to: neighborId,
                            layer: currLayer,
                            selectedNode: currObj.id,
                            description: `Examining neighbor Node ${neighborId} (distance to query: ${formatDistance(dist)}).\nDistance from Query Point ${point.id} to current best: ${formatDistance(currDist)}.`
                        });
                        
                        // Add to path for this layer
                        pathByLayer[currLayer].push(neighborId);
                        
                        // Check if this neighbor is closer
                        if (dist < currDist) {
                            currObj = neighbor;
                            currDist = dist;
                            changed = true;
                            selectedNode = currObj;
                            
                            // Record moving to a closer neighbor
                            stepHistory.push({
                                type: 'move',
                                from: neighbor.id,
                                to: neighbor.id,
                                layer: currLayer,
                                selectedNode: neighbor.id,
                                description: `Found closer node: Moving to Node ${neighbor.id} (distance to query: ${formatDistance(dist)}).\nThis is now the closest node to Query Point ${point.id}.`
                            });
                        }
                    }
                }
            }
            
            // If we're moving to a lower layer, add the current node as the entry point
            if (currLayer > 0) {
                pathByLayer[currLayer - 1].push(currObj.id);
            }
        }
        
        // Final result step
        stepHistory.push({
            type: 'result',
            selectedNode: currObj.id,
            description: `Found nearest neighbor: Node ${currObj.id} (distance to query: ${formatDistance(currDist)}).\nSearch complete for Query Point ${point.id} using ${getDistanceMetricName()} distance.`
        });
        
        // Format and display the path for the final result
        let pathText = "Search path through layers:\n";
        for (let layer = entryLayer; layer >= 0; layer--) {
            const uniqueNodes = [...new Set(pathByLayer[layer])]; // Remove duplicates
            pathText += `Layer ${layer}: ${uniqueNodes.join(' → ')}\n`;
        }
        
        // Set current and max step
        currentStep = 0;
        maxStep = stepHistory.length - 1;
        
        // Prepare first step visualization
        selectedNode = points.find(p => p.id === stepHistory[0].selectedNode);
        showExplanation(stepHistory[0].description);
        
        // Initialize skip list explanation
        updateSkipListExplanation(stepHistory[0]);
        
        updateVisualization();
        updateNavigationButtons();
    }
    
    // Insert a point into the HNSW graph
    // If stepByStep is true, use step-by-step visualization, otherwise use simple insertion
    function insertPoint(point, stepByStep = false) {
        resetSearch();
        
        if (stepByStep) {
            // This branch handles the step-by-step insertion which is not used now
            visitedNodes = [];
            stepHistory = [];
            simulationInProgress = true;
            
            // Step-by-step insertion code would go here (keeping this for future reference)
            // Currently not used as we're using simple insertion for adding points
        } else {
            // Simple insertion without step-by-step visualization
            // Determine the maximum layer for this point
            const pointMaxLayer = assignLayer();
            
            // Find entry point in the highest non-empty layer
            let entryPointId = null;
            let entryLayer = 0;
            
            for (let l = maxLayers - 1; l >= 0; l--) {
                if (graph[l].nodes.length > 0 && graph[l].nodes[0] !== point.id) {
                    entryPointId = graph[l].nodes[0];
                    entryLayer = l;
                    break;
                }
            }
            
            if (entryPointId === null) {
                // First point or only point in the graph
                addToLayer(point, pointMaxLayer);
                showExplanation(`First point inserted as the entry point at layer ${pointMaxLayer}.`);
                updateVisualization();
                return;
            }
            
            // Start with the entry point
            let currObj = points.find(p => p.id === entryPointId);
            
            // For each layer from top down to the new point's layer
            for (let currLayer = maxLayers - 1; currLayer > pointMaxLayer; currLayer--) {
                if (graph[currLayer].nodes.length > 0) {
                    // Search for the closest point in the current layer
                    let changed = true;
                    while (changed) {
                        changed = false;
                        
                        // Find neighbors at this layer
                        const neighbors = [];
                        if (graph[currLayer].edges[currObj.id]) {
                            for (const neighborId of graph[currLayer].edges[currObj.id]) {
                                const neighbor = points.find(p => p.id === neighborId);
                                neighbors.push({
                                    id: neighborId,
                                    distance: distance(point, neighbor)
                                });
                            }
                        }
                        
                        if (neighbors.length > 0) {
                            // Sort by distance
                            neighbors.sort((a, b) => a.distance - b.distance);
                            
                            // Check if there's a closer neighbor
                            const closestNeighbor = points.find(p => p.id === neighbors[0].id);
                            if (distance(point, closestNeighbor) < distance(point, currObj)) {
                                currObj = closestNeighbor;
                                changed = true;
                            }
                        }
                    }
                }
            }
            
            // For the new point's layer and below, add connections
            for (let currLayer = Math.min(pointMaxLayer, maxLayers - 1); currLayer >= 0; currLayer--) {
                // Get nearest neighbors in this layer
                const candidates = new Set([currObj.id]);
                let ep = new Set([currObj.id]);
                
                // Explore neighbors of neighbors for ef candidates
                for (let i = 0; i < efConstruction && ep.size > 0; i++) {
                    const epArray = Array.from(ep);
                    ep = new Set();
                    
                    for (const nodeId of epArray) {
                        const node = points.find(p => p.id === nodeId);
                        
                        // Get neighbors at this layer
                        const neighbors = graph[currLayer].edges[node.id] || [];
                        
                        for (const neighborId of neighbors) {
                            if (!candidates.has(neighborId)) {
                                candidates.add(neighborId);
                                ep.add(neighborId);
                            }
                        }
                    }
                }
                
                // Get M closest neighbors from candidates
                const candidateDistances = [];
                for (const candidateId of candidates) {
                    const candidate = points.find(p => p.id === candidateId);
                    candidateDistances.push({
                        id: candidateId,
                        distance: distance(point, candidate)
                    });
                }
                
                candidateDistances.sort((a, b) => a.distance - b.distance);
                const closestNeighbors = candidateDistances.slice(0, M).map(n => n.id);
                
                // Add connections between point and its neighbors
                if (!graph[currLayer].edges[point.id]) {
                    graph[currLayer].edges[point.id] = [];
                }
                
                for (const neighborId of closestNeighbors) {
                    if (neighborId !== point.id) {
                        // Bidirectional connection
                        graph[currLayer].edges[point.id].push(neighborId);
                        
                        if (!graph[currLayer].edges[neighborId]) {
                            graph[currLayer].edges[neighborId] = [];
                        }
                        graph[currLayer].edges[neighborId].push(point.id);
                    }
                }
                
                // Add point to this layer
                addToLayer(point, currLayer);
                
                // Set entry point for next layer
                currObj = point;
            }
            
            showExplanation(`Point (ID: ${point.id}) inserted with maximum layer ${pointMaxLayer}`);
            updateVisualization();
        }
    }
    
    function resetSearch() {
        // Preserve the query point but reset the search state
        const oldQueryPoint = queryPoint;
        
        visitedNodes = [];
        stepHistory = [];
        selectedNode = null;
        currentStep = 0;
        maxStep = 0;
        simulationInProgress = false;
        
        // Remove the query point from the points array if this is a complete reset
        if (!oldQueryPoint) {
            queryPoint = null;
        }
        
        // Hide skip list explanation and clear its content
        const skipListExplanation = document.getElementById('skipListExplanation');
        const skipListContent = document.getElementById('skipListContent');
        if (skipListExplanation) {
            skipListExplanation.style.display = 'none';
        }
        if (skipListContent) {
            skipListContent.innerHTML = '';
        }
        
        updateVisualization();
        updateNavigationButtons();
    }
    
    function showExplanation(text) {
        // Add distance metric formula to the explanation
        let formulaText = '';
        switch (distanceMetric) {
            case 'manhattan':
                formulaText = '\n\nManhattan Distance Formula:\n|p₁ - q₁| + |p₂ - q₂|';
                break;
            case 'chebyshev':
                formulaText = '\n\nChebyshev Distance Formula:\nmax(|p₁ - q₁|, |p₂ - q₂|)';
                break;
            case 'euclidean':
            default:
                formulaText = '\n\nEuclidean Distance Formula:\n√((p₁ - q₁)² + (p₂ - q₂)²)';
        }
        
        // Add a note about the formula
        formulaText += '\n\nwhere p₁,p₂ and q₁,q₂ are the coordinates of the points';
        
        explanationText.innerHTML = (text + formulaText).replace(/\n/g, '<br>');
    }
    
    // Generate skip list representation of the graph
    function updateSkipListExplanation(step) {
        const skipListExplanation = document.getElementById('skipListExplanation');
        const skipListContent = document.getElementById('skipListContent');
        
        // Show the skip list explanation box during search
        if (simulationInProgress) {
            skipListExplanation.style.display = 'block';
            
            // Create a simplified skip list visualization
            const skipListHTML = generateSkipListHTML(step);
            skipListContent.innerHTML = skipListHTML;
        } else {
            skipListExplanation.style.display = 'none';
        }
    }
    
    // Generate HTML for skip list visualization
    function generateSkipListHTML(currentStepData) {
        if (!currentStepData || !queryPoint) return '';
        
        const currentLayer = currentStepData.layer !== undefined ? currentStepData.layer : -1;
        const currentNodeId = currentStepData.selectedNode;
        const fromNodeId = currentStepData.from;
        const toNodeId = currentStepData.to;
        
        let html = '<div class="skip-list-diagram">';
        
        // Generate skip list explanation based on step type
        switch (currentStepData.type) {
            case 'start':
                html += `<p>Starting search for Query Point ${queryPoint.id} from the top layer (Layer ${currentLayer}).</p>`;
                break;
            case 'layer_transition':
                html += `<p>Moving down from Layer ${currentLayer + 1} to Layer ${currentLayer}.</p>`;
                html += `<p>Using Node ${currentNodeId} as entry point to this layer.</p>`;
                break;
            case 'examine':
                html += `<p>From Node ${fromNodeId}, checking neighbor Node ${toNodeId} at Layer ${currentLayer}.</p>`;
                break;
            case 'move':
                html += `<p>Found better node: Moving to Node ${currentNodeId} at Layer ${currentLayer}.</p>`;
                break;
            case 'result':
                html += `<p>Search complete! Node ${currentNodeId} is the nearest neighbor.</p>`;
                break;
        }
        
        // Create a simple skip list visualization
        for (let i = maxLayers - 1; i >= 0; i--) {
            const isActiveLayer = i === currentLayer;
            html += `<div class="skip-layer ${isActiveLayer ? 'active' : ''}">`;
            html += `<span class="skip-layer-label">Layer ${i}:</span>`;
            
            // Show only nodes that exist in this layer
            const nodesInLayer = [];
            for (const point of points) {
                if (point.layer >= i && graph[i].nodes.includes(point.id)) {
                    nodesInLayer.push(point.id);
                }
            }
            
            // Add query point for reference
            if (queryPoint) {
                nodesInLayer.push(queryPoint.id);
            }
            
            // Sort nodes by ID for consistent display
            nodesInLayer.sort((a, b) => a - b);
            
            // Add a container for horizontally scrollable nodes
            html += '<div class="skip-nodes-container">';
            
            // Display nodes as a skip list
            for (let j = 0; j < nodesInLayer.length; j++) {
                const nodeId = nodesInLayer[j];
                
                // Determine node state
                let nodeClass = 'regular';
                if (nodeId === queryPoint.id) {
                    nodeClass = 'query';
                } else if (nodeId === currentNodeId) {
                    nodeClass = 'current';
                } else if (visitedNodes.slice(0, currentStep + 1).includes(nodeId)) {
                    nodeClass = 'visited';
                }
                
                html += `<span class="skip-node ${nodeClass}">${nodeId}</span>`;
                
                // Add arrows between nodes
                if (j < nodesInLayer.length - 1) {
                    html += `<span class="skip-arrow">→</span>`;
                }
            }
            
            html += '</div>'; // Close skip-nodes-container
            html += '</div>'; // Close skip-layer
        }
        
        // Add current explanation
        html += `<div class="skip-list-status">
                    <p><strong>Current Operation:</strong> ${currentStepData.description.split('\n')[0]}</p>
                 </div>`;
        
        html += '</div>';
        return html;
    }
    
    // Navigate to the next step in the algorithm visualization
    function goToNextStep() {
        if (currentStep < maxStep) {
            currentStep++;
            const step = stepHistory[currentStep];
            showExplanation(step.description);
            
            // Update selected node
            if (step.selectedNode !== undefined) {
                selectedNode = points.find(p => p.id === step.selectedNode);
            }
            
            updateSkipListExplanation(step);
            updateVisualization();
            updateNavigationButtons();
            
            // Remove automatic scroll to the skip list
        }
    }
    
    function goToPrevStep() {
        if (currentStep > 0) {
            currentStep--;
            const step = stepHistory[currentStep];
            showExplanation(step.description);
            
            // Update selected node
            if (step.selectedNode !== undefined) {
                selectedNode = points.find(p => p.id === step.selectedNode);
            }
            
            updateSkipListExplanation(step);
            updateVisualization();
            updateNavigationButtons();
        }
    }
    
    function skipToEnd() {
        currentStep = maxStep;
        if (maxStep > 0) {
            const step = stepHistory[currentStep];
            showExplanation(step.description);
            
            // Update selected node
            if (step.selectedNode !== undefined) {
                selectedNode = points.find(p => p.id === step.selectedNode);
            }
            
            updateSkipListExplanation(step);
        }
        
        updateVisualization();
        updateNavigationButtons();
    }
    
    function updateNavigationButtons() {
        // Update button states based on current step
        floatingPrevStepBtn.disabled = currentStep <= 0 || maxStep <= 0;
        floatingNextStepBtn.disabled = currentStep >= maxStep || maxStep <= 0;
        floatingSkipToEndBtn.disabled = currentStep >= maxStep || maxStep <= 0;
        
        // Update button visibility based on whether a simulation is in progress
        const floatingNavButtons = document.getElementById('floatingNavigationButtons');
        floatingNavButtons.style.display = (simulationInProgress && stepHistory.length > 0) ? 'flex' : 'none';
        
        // Update step counter
        if (floatingStepCounter) {
            floatingStepCounter.textContent = maxStep > 0 ? `Step ${currentStep + 1}/${maxStep + 1}` : '';
        }
    }
    
    // Event listeners for UI controls
    resetBtn.addEventListener('click', () => {
        maxLayers = parseInt(maxLayersInput.value);
        M = parseInt(mInput.value);
        efConstruction = parseInt(efConstructionInput.value);
        initializeGraph();
        showExplanation("Graph reset! Start by adding some points.");
    });
    
    addPointBtn.addEventListener('click', () => {
        if (!simulationInProgress) {
            const point = generateRandomPoint();
            insertPoint(point, false); // Simple insertion without step-by-step
        }
    });
    
    runQueryBtn.addEventListener('click', () => {
        if (!simulationInProgress) {
            // Generate a random query point
            queryPoint = generateRandomPoint();
            
            // Make query point visible on all layers
            for (let i = 0; i < maxLayers; i++) {
                queryPoint.layer = Math.max(queryPoint.layer, maxLayers - 1);
            }
            
            // Add the query point to the points array but don't add it to the graph structure
            if (!points.includes(queryPoint)) {
                points.push(queryPoint);
            }
            
            searchNearest(queryPoint);
        }
    });
    
    searchModeSelect.addEventListener('change', () => {
        visualizationMode = searchModeSelect.value;
        resetSearch();
        showExplanation(`Switched to ${visualizationMode === 'insertion' ? 'add points' : 'search'} mode.`);
    });
    
    // Event listeners for navigation buttons
    floatingNextStepBtn.addEventListener('click', goToNextStep);
    floatingPrevStepBtn.addEventListener('click', goToPrevStep);
    floatingSkipToEndBtn.addEventListener('click', skipToEnd);
    
    // Event listeners for parameter inputs
    maxLayersInput.addEventListener('change', () => {
        maxLayers = parseInt(maxLayersInput.value);
    });
    
    mInput.addEventListener('change', () => {
        M = parseInt(mInput.value);
    });
    
    efConstructionInput.addEventListener('change', () => {
        efConstruction = parseInt(efConstructionInput.value);
    });
    
    // Add event listener for distance metric changes
    distanceMetricSelect.addEventListener('change', () => {
        distanceMetric = distanceMetricSelect.value;
        if (simulationInProgress) {
            resetSearch();
        }
        showExplanation(`Switched to ${getDistanceMetricName()} distance metric.`);
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        initializeCanvases();
        updateVisualization();
    });
    
    // Initialize the graph
    initializeGraph();
}); 