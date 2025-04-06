---
title: "Segment Tree Problems"
date: 2016-06-08
---

# Segment Tree Problems

<div align="center">
  <img src="/img/segtree.png" alt="Segment Tree Illustration">
</div>

## Problem Difficulty Levels

- **Beginner** - For those just starting with segment trees
- **Easy** - Simple applications of segment trees
- **Medium** - Requires deeper understanding of segment tree concepts
- **Hard** - Complex applications with multiple operations
- **Expert** - Advanced segment tree techniques

---

## Problems Collection

### Problem 1: Query Minimum Value
**Difficulty**: `Beginner`

Find the minimum value in a range [l,r].

- **Problem Link**: [1082 - Array Queries - LightOJ](http://www.lightoj.com/volume_showproblem.php?problem=1082)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/LightOJ/blob/master/1082arrQueries.cpp)

---

### Problem 2: Binary Simulation
**Difficulty**: `Easy`

Two operations:
1. Invert bits from range [i,j]
2. Query whether the ith bit is 0 or 1

- **Problem Link**: [1080 - Binary Simulation - LightOJ](http://www.lightoj.com/volume_showproblem.php?problem=1080)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/LightOJ/blob/master/1080_bin_simulation.cpp)

---

### Problem 3: Curious Robin Hood
**Difficulty**: `Easy`

Three operations:
1. Query index id and update index id to zero
2. Add value v to index id
3. Query sum in range [l,r]

- **Problem Link**: [1112 - Curious Robin Hood - LightOJ](http://www.lightoj.com/volume_showproblem.php?problem=1112)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/LightOJ/blob/master/1112CRobinhood.cpp)

---

### Problem 4: Xenia and Bit Operations
**Difficulty**: `Medium`

Two operations:
1. Assignment: a<sub>p</sub> = b
2. Output value 'v' (calculated by alternate 'or' and 'xor')

- **Problem Link**: [Xenia and Bit Operations - CODEFORCES (Div.2) D](http://codeforces.com/problemset/problem/339/D)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Codeforces/blob/master/xeniaBit.cpp)

---

### Problem 5: Shoot and Kill
**Difficulty**: `Medium`

Two operations:
1. Query with two integers L and R, denoting time hunter will be in forest
2. Find maximum number of segments that could be hit by any point from L to R

- **Problem Link**: [BGSHOOT - Shoot and kill - SPOJ](http://www.spoj.com/problems/BGSHOOT/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/BGSHOOT.cpp)

---

### Problem 6: Horrible Queries
**Difficulty**: `Easy`

Two operations:
1. Add v to all numbers in range [l,r]
2. Query sum in range [l,r]

- **Problem Link**: [HORRIBLE - Horrible Queries - SPOJ](http://www.spoj.com/problems/HORRIBLE/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/horrible.cpp)

---

### Problem 7: GSS1 - Max Subarray Sum
**Difficulty**: `Medium`

Query(x,y) = Max { a[i]+a[i+1]+...+a[j] ; x ≤ i ≤ j ≤ y }

- **Problem Link**: [GSS1 - Can you answer these queries I - SPOJ](http://www.spoj.com/problems/GSS1/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/gss1.cpp)

---

### Problem 8: GSS3 - Max Subarray Sum with Updates
**Difficulty**: `Medium`

Two operations:
1. Modify the i-th element with value v
2. Query(x,y) = Max { a[i]+a[i+1]+...+a[j] ; x ≤ i ≤ j ≤ y }

- **Problem Link**: [GSS3 - Can you answer these queries III - SPOJ](http://www.spoj.com/problems/GSS3/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/gss3.cpp)

---

### Problem 9: GSS5 - Complex Max Subarray Sum
**Difficulty**: `Hard`

Query(x1,y1,x2,y2) = Max {A[i]+A[i+1]+...+A[j]} where x1 ≤ i ≤ y1, x2 ≤ j ≤ y2 and x1 ≤ x2, y1 ≤ y2

- **Problem Link**: [GSS5 - Can you answer these queries V - SPOJ](http://www.spoj.com/problems/GSS5/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/gss5.cpp)

---

### Problem 10: Maximum Sum
**Difficulty**: `Medium`

Two operations:
1. Set the value of A[i] to x
2. Find i and j such that x ≤ i, j ≤ y and i != j, to maximize sum A[i]+A[j]

- **Problem Link**: [KGSS - Maximum Sum - SPOJ](http://www.spoj.com/problems/KGSS/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/kgss.cpp)

---

### Problem 11: XOR on Segment
**Difficulty**: `Hard`

Two operations:
1. Apply XOR with value x to each element in segment [l, r]
2. Query sum in range [l,r]

- **Problem Link**: [XOR on Segment - CODEFORCES Round #149 (Div. 2) E](http://codeforces.com/problemset/problem/242/E)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Codeforces/blob/master/xor_on_segment.cpp)

---

### Problem 12: Election Posters
**Difficulty**: `Medium`

Given ranges of form [li, ri], denoting leftmost and rightmost sections covered by the i-th poster,
output the number of posters with visible sections.

- **Problem Link**: [POSTERS - Election Posters - SPOJ](http://www.spoj.com/problems/POSTERS/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/posters.cpp)

---

### Problem 13: Brackets
**Difficulty**: `Medium`

Two operations:
1. Change the i-th bracket to the opposite one
2. Check if the word is a correct bracket expression

- **Problem Link**: [BRCKTS - Brackets - SPOJ](http://www.spoj.com/problems/BRCKTS/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/brackets.cpp)

---

### Problem 14: Light Switching
**Difficulty**: `Medium`

Two operations:
1. Invert switches between [l,r]
2. Count how many lights are on in range [l,r]

- **Problem Link**: [LITE - Light Switching - SPOJ](http://www.spoj.com/problems/LITE/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/lite.cpp)

---

### Problem 15: K-Query Online
**Difficulty**: `Hard`

For each k-query (i, j, k), return the number of elements greater than k in the subsequence a<sub>i</sub>, a<sub>i+1</sub>, ..., a<sub>j</sub>.

- **Problem Link**: [KQUERYO - K-Query Online - SPOJ](http://www.spoj.com/problems/KQUERYO/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/KqueryOnline.cpp)

---

### Problem 16: Counting Primes
**Difficulty**: `Medium`

Two operations:
1. Change all numbers in range [x,y] to value v
2. Count the number of primes between index x and y

- **Problem Link**: [CNTPRIME - Counting Primes - SPOJ](http://www.spoj.com/problems/CNTPRIME/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/cntprime.cpp)

---

### Problem 17: Sereja and Brackets
**Difficulty**: `Medium`

Given a bracket sequence, count the length of the maximum correct bracket subsequence.

- **Problem Link**: [(Div. 1) C. Sereja and Brackets - CODEFORCES](http://codeforces.com/problemset/problem/380/C)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Codeforces/blob/master/serejabrackets.cpp)

---

### Problem 18: Ant Colony
**Difficulty**: `Hard`

Given n ants with strengths s<sub>i</sub>, where ant i gets one battle point only if s<sub>i</sub> divides s<sub>j</sub>.
An ant with v<sub>i</sub> battle points is freed only if v<sub>i</sub> = r - l.

Count how many ants will be eaten if those ants fight.

- **Problem Link**: [(Div. 2) F. Ant colony - CODEFORCES- Round #271](http://codeforces.com/problemset/problem/474/F)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Codeforces/blob/master/271_ant_colony.cpp)

---

### Problem 19: Multiple of 3
**Difficulty**: `Medium`

Answer how many numbers between indices A and B are divisible by 3.

- **Problem Link**: [MULTQ3 - SPOJ](http://www.spoj.com/problems/MULTQ3/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/multq3.cpp)

---

### Problem 20: GM Plants
**Difficulty**: `Hard`

Given a cuboidal box of size N<sub>x</sub> × N<sub>y</sub>× N<sub>z</sub> made of unit cubes:
1. Range update with val = 1 in X, Y, Z axis
2. Report the number of red plants (1) in the cuboidal region with coordinates (x1,y1,z1) and (x2,y2,z2)

- **Problem Link**: [IOPC1207 - GM plants - SPOJ](http://www.spoj.com/problems/IOPC1207/)
- **Solution**: [GitHub](https://github.com/Jaskamalkainth/Spoj/blob/master/IOPC1207.cpp)