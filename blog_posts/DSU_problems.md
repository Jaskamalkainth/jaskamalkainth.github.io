---
title: "Disjoint Set Union Problems"
description: "Practice problems for Disjoint Set Union (union–find) from UVa, HackerEarth and Codeforces, ordered by difficulty."
date: 2016-05-07 02:20
search_hint: "Search problems, e.g. components, leader"
levels: [Beginner, Easy, Medium, Hard]
problems:
  - name: "Ubiquitous Religions"
    level: Beginner
    judge: UVa
    code: "10583"
    url: "https://onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&page=show_problem&problem=1524"
    tags: [Connected components]
    desc: "n students and m pairs who share a religion. Find the largest possible number of distinct religions, i.e. the number of components."
  - name: "City and Soldiers"
    level: Easy
    judge: HackerEarth
    code: "Code Monk"
    url: "https://www.hackerearth.com/problem/algorithm/city-and-soldiers/"
    tags: [Group leader]
    ops:
      - "Merge the group of soldier a into the group of soldier b"
      - "Make soldier a the leader of their group"
      - "Print the leader of soldier a's group"
  - name: "Two Sets"
    level: Medium
    judge: Codeforces
    code: "469D"
    url: "https://codeforces.com/problemset/problem/469/D"
    tags: [Constraints as unions]
    desc: "Split n distinct numbers into sets A and B so that x ∈ A implies a − x ∈ A, and x ∈ B implies b − x ∈ B."
  - name: "Restructuring Company"
    level: Medium
    judge: Codeforces
    code: "566D"
    url: "https://codeforces.com/problemset/problem/566/D"
    tags: [Range union]
    ops:
      - "Merge the departments of employees x and y"
      - "Merge the departments of every employee from x to y"
      - "Check whether x and y are in the same department"
  - name: "Group contest 203881, problem D"
    judge: Codeforces
    code: "203881 D"
    url: "https://codeforces.com/group/qcIqFPYhVr/contest/203881/problem/D"
    desc: "From a Codeforces group contest; you need to join the group to open it."
  - name: "Group contest 203881, problem I"
    judge: Codeforces
    code: "203881 I"
    url: "https://codeforces.com/group/qcIqFPYhVr/contest/203881/problem/I"
    desc: "From a Codeforces group contest; you need to join the group to open it."
---

<div class="pl-hero">
  <div>
    <h1>Disjoint Set Union Problems</h1>
    <p class="pl-lede">Union–find answers "are these two in the same group?" in near-constant time. These problems start with counting components and build up to tracking leaders and merging whole ranges. Tick off the ones you solve; your progress is saved in this browser.</p>
  </div>
  <img src="/img/dsu.jpg" alt="Two disjoint-set trees being merged by attaching one root under the other" width="220" height="150" loading="lazy">
</div>

{% include problem_list.html %}
