# HNSW Algorithm Simulation

This is an interactive visualization tool for understanding the Hierarchical Navigable Small World (HNSW) algorithm used for Approximate Nearest Neighbor (ANN) search.

## Overview

HNSW is a graph-based algorithm for efficient approximate nearest neighbor search in high-dimensional spaces. This simple simulation demonstrates the key concepts of HNSW:

1. **Multi-layer structure**: Points are organized into a hierarchical structure with decreasing density in higher layers
2. **Insertion process**: How new points are added to the graph and connected to neighbors
3. **Search process**: How queries navigate the graph to efficiently find nearest neighbors

## How to Use the Simulation

1. Open `index.html` in a web browser (the page starts with 30 random points).
2. Parameters:
   - **Layers**: display cap on the number of levels
   - **M**: links per node on insert (layer 0 allows 2M); level probability is 1/M
   - **efConstruction**: beam width used while inserting
   - **efSearch**: beam width on layer 0 at query time
   - **Distance**: Euclidean, Manhattan or Chebyshev

   Changing Layers, M, efConstruction or the metric rebuilds the index from the same points.
3. Interact:
   - **+ Add Point / + Add 10 Points**, or click a layer in "Add Point" mode
   - **Search Nearest** drops a random query; in "Search" mode, click to place it
   - Step with **Prev / Next**, **Play**, **Result**, or the keyboard (← → Home End, Space, Esc)

## What the Simulation Implements

Following Malkov & Yashunin (2016):

- **Level assignment**: `level = floor(-ln(U) * mL)` with `mL = 1/ln(M)`
- **SEARCH-LAYER** with candidate and result lists of size `ef`, stopping when the closest
  candidate is farther than the worst result
- **Insertion**: greedy descent to the new node's level, then beam search with `efConstruction`
  and the neighbour-selection heuristic on each lower layer; neighbours over `Mmax` / `Mmax0`
  are pruned
- **Query**: greedy (`ef = 1`) on upper layers, beam search with `efSearch` on layer 0
- The final answer is compared with an exact brute-force search, and the page reports how many
  nodes were compared

## Reading the Visualization

- Every node, edge and examined neighbour is drawn on the layer where it happened
- Yellow nodes had their distance computed; the green node is the one being expanded
- Teal rings mark the current result list; solid green edges were taken, dashed orange edges
  were checked and rejected
- The Layer Membership view lists each layer's nodes left to right by x, showing that every
  layer is a subset of the one below

## Key Advantages of HNSW

- **Logarithmic complexity**: Insertion and search operations scale logarithmically with the number of points
- **High recall**: Achieves high accuracy in finding true nearest neighbors
- **Efficiency**: Significantly faster than exact methods for large datasets

This simulation helps visualize how HNSW achieves these advantages through its hierarchical structure and navigation strategy. 