# HNSW Algorithm Simulation

This is an interactive visualization tool for understanding the Hierarchical Navigable Small World (HNSW) algorithm used for Approximate Nearest Neighbor (ANN) search.

## Overview

HNSW is a graph-based algorithm for efficient approximate nearest neighbor search in high-dimensional spaces. This simple simulation demonstrates the key concepts of HNSW:

1. **Multi-layer structure**: Points are organized into a hierarchical structure with decreasing density in higher layers
2. **Insertion process**: How new points are added to the graph and connected to neighbors
3. **Search process**: How queries navigate the graph to efficiently find nearest neighbors

## How to Use the Simulation

1. Open `index.html` in a web browser
2. Adjust the parameters:
   - **Max Layers**: Number of hierarchical layers in the graph
   - **M**: Maximum number of connections per node
   - **ef Construction**: Size of the dynamic candidate list during construction
3. Interact with the simulation:
   - Click "Reset Simulation" to start fresh
   - Click "Add Random Point" to add points randomly
   - Click directly on the visualization to add points at specific locations
   - Switch to "Search Process" mode and click to perform nearest neighbor queries
4. Follow the step-by-step search visualization:
   - Floating navigation controls appear automatically during search operations
   - Use the "Previous" and "Next" buttons to navigate through each step of the search algorithm
   - The "Skip to End" button lets you jump to the final search result
   - The navigation controls stay visible as you scroll, making it easy to navigate both the graph and skip list visualizations
   - Each search step is explained in the explanation panel with highlighted nodes and connections
   - The query point remains highlighted in red throughout the search process, making it easy to track
   - A dedicated skip list explanation box shows the current layer navigation in simplified form

## Learn HNSW Through This Simulation

The simulation shows the two key operations of HNSW:

### Insertion Process
When a new point is added:
1. It's assigned a maximum layer randomly (with decreasing probability for higher layers)
2. The algorithm starts at the entry point in the top layer
3. It performs a greedy search to find the closest neighbor in each layer
4. The new point is connected to its nearest neighbors in each layer up to its maximum layer

### Search Process with Step-by-Step Visualization
When searching for the nearest neighbor, you can follow the process step-by-step:
1. The search begins at the entry point in the top layer
2. A greedy search is performed at each layer, finding the closest point to the query
3. This closest point becomes the entry point for the next layer down
4. The process repeats until the bottom layer is reached
5. The current closest point is returned as the approximate nearest neighbor

With the step-by-step controls, you can observe each of these phases in detail, seeing exactly how the algorithm navigates through the layers to find the nearest neighbor. The query point (shown in red with a "QUERY" label) remains visible on all layers, allowing you to easily track the goal of the search.

## Skip List Explanation

The simulation provides two complementary visualizations of the HNSW algorithm:

### Main Graph Visualization
- Each layer shows only the points that exist at that layer or above
- Connections between points are shown as edges within each layer
- The active layer is highlighted with a green background and labeled "ACTIVE LAYER"
- Visited nodes are highlighted in yellow, and the current node is highlighted in green

### Skip List Visualization
During search operations, a dedicated skip list visualization appears below the main graph layers and shows:
- A simplified view of nodes at each layer in a horizontal layout
- The current layer being explored (highlighted in green)
- Color-coded nodes to indicate their status:
  - Red: Query point
  - Green: Current node being examined
  - Yellow: Previously visited nodes
  - Blue: Regular nodes
- A textual explanation of what's happening at each step
- How the algorithm moves between layers during the search process

This dual visualization approach helps users understand both the spatial relationships between points and the logical navigation pattern of the algorithm. The skip list view is positioned below the main graph visualization for better visibility of all nodes and a clearer understanding of the layer-based navigation.

## Key Advantages of HNSW

- **Logarithmic complexity**: Insertion and search operations scale logarithmically with the number of points
- **High recall**: Achieves high accuracy in finding true nearest neighbors
- **Efficiency**: Significantly faster than exact methods for large datasets

This simulation helps visualize how HNSW achieves these advantages through its hierarchical structure and navigation strategy. 