---
title: "Cpp Notes"
description: "Short notes on modern C++: templates and metaprogramming, lambdas, constexpr, variadic templates, tuples and unordered_map."
date: 2021-05-07 02:20
notes:
  - { n: 1, title: "Template explicit vs implicit specialization", date: 2023-03-24 }
  - { n: 2, title: "Ill-formed function call due to ambiguous function overloading", date: 2023-03-24 }
  - { n: 3, title: "Template metaprogramming: Fibonacci", date: 2023-04-06 }
  - { n: 4, title: "Template metaprogramming: Factorial", date: 2023-04-06 }
  - { n: 5, title: "Lambda expressions in C++", date: 2023-04-06 }
  - { n: 6, title: "constexpr in C++", date: 2023-04-06 }
  - { n: 7, title: "Struct vs class in C++", date: 2023-04-06 }
  - { n: 8, title: "Variadic templates in C++", date: 2023-04-06 }
  - { n: 9, title: "Tuples in C++", date: 2023-04-06 }
  - { n: 10, title: "Unordered map in C++", date: 2023-04-06 }
---

<div class="pl-hero">
  <div>
    <h1>C++ Notes</h1>
    <p class="pl-lede">Short, example-first notes on the corners of C++ I keep coming back to: templates, compile-time computation and the standard library.</p>
  </div>
  <img src="/img/cpplogo.png" alt="C++ logo" width="220" height="164" loading="lazy">
</div>

<ol class="note-list">
  {%- for note in page.notes %}
  <li><a href="{{ site.baseurl }}/blog_posts/CppNotesDb/{{ note.n }}.html"><span><span class="n">{{ note.n }}</span>{{ note.title }}</span><time datetime="{{ note.date | date_to_xmlschema }}">{{ note.date | date: "%b %-d, %Y" }}</time></a></li>
  {%- endfor %}
</ol>
