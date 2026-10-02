---
title: "Segment Tree Problems"
description: "20 hand-picked segment tree problems from LightOJ, SPOJ and Codeforces, sorted by difficulty and tagged by technique, with solutions."
date: 2016-06-08
search_hint: "Search problems, e.g. GSS, lazy, brackets"
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

<div class="pl-hero">
  <div>
    <h1>Segment Tree Problems</h1>
    <p class="pl-lede">{{ page.problems.size }} problems from LightOJ, SPOJ and Codeforces, ordered from first segment tree to hard. Each one is tagged with the technique it teaches and links to my solution. Tick off the ones you solve; your progress is saved in this browser.</p>
  </div>
  <img src="/img/segtree.png" alt="A segment tree built over an array, each node holding the answer for its range" width="220" height="220" loading="lazy">
</div>

{% include problem_list.html %}
