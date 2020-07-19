---
title: "Segment tree problems"
date: 2016-06-08
---

<div style="text-align: center;" markdown="1">

<div style="display: inline-block; text-align: left;"  markdown="1">


# Segment tree Problems

  <img src="/img/segtree.png">  

  
**Different levels :** ``` Beginner ```, ``` Easy```, ```Medium```, ```Hard```, ```Expert```

***


**Problem 1.** 	Query minimum value in [l,r].
            
[1082 - Array Queries - LightOJ](http://www.lightoj.com/volume_showproblem.php?problem=1082)

[Solution - Github](https://github.com/Jaskamalkainth/LightOJ/blob/master/1082arrQueries.cpp)

**Level**: ``` Beginner ```


***

**Problem 2.** Two types of operations can be here.

1. *Invert the bit from [i,j]*

2. *Answer whether the ith bit is 0 or 1*

[1080 - Binary Simulation - LightOJ](http://www.lightoj.com/volume_showproblem.php?problem=1080)

[Solution - Github](https://github.com/Jaskamalkainth/LightOJ/blob/master/1080_bin_simulation.cpp)

**Level**: ``` Easy ```

***

**Problem 3.** Three types of operations can be here.

1. *Query index id and Update index id to zero.*

2. *Add index id with value v.*

3. *Query sum in [l,r].*

[1112 - Curious Robin Hood - LightOJ](http://www.lightoj.com/volume_showproblem.php?problem=1112)

[Solution - Github](https://github.com/Jaskamalkainth/LightOJ/blob/master/1112CRobinhood.cpp)

**Level**: ``` Easy ```

***

**Problem 4.**	Two types of operations can be here.

1. *Query p, b means that you need to perform the assignment a<sub>p</sub> = b.*

2. *Output the value 'v' ( calculated by alternate 'or' and 'xor').*	

[Xenia and Bit Operations - CODEFORCES (Div.2) D](http://codeforces.com/problemset/problem/339/D)

[Solution - Github](https://github.com/Jaskamalkainth/Codeforces/blob/master/xeniaBit.cpp)

**Level**: ``` Medium ```

***


**Problem 5.**	Two types of operations can be here.

1. *Each query giving two integer L and R, denoting the time 
hunter will be in forest.*

2. *Query the maximum number of segments that could be hit 
by any one of point from L to R*

[BGSHOOT - Shoot and kill - SPOJ](http://www.spoj.com/problems/BGSHOOT/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/BGSHOOT.cpp)

**Level**: ``` Medium ```

***

**Problem 6.**	Two types of operations can be here.


1. *Add v to all numbers in the range of [l,r]*

2. *Query sum in [l,r].*

[HORRIBLE - Horrible Queries - SPOJ](http://www.spoj.com/problems/HORRIBLE/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/horrible.cpp)

**Level**: ``` Easy ```

***

**Problem 7.**		Query(x,y) = Max { a[i]+a[i+1]+...+a[j] ; x ≤ i ≤ j ≤ y }.

[GSS1 - Can you answer these queries I - SPOJ](http://www.spoj.com/problems/GSS1/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/gss1.cpp)

**Level**: ``` Medium ```	

***

**Problem 8.**		Two types of operations can be here.

1. *Modify the i-th element with value v.*

2. *Query(x,y) = Max { a[i]+a[i+1]+...+a[j] ; x ≤ i ≤ j ≤ y }.*	

[GSS3 - Can you answer these queries III - SPOJ](http://www.spoj.com/problems/GSS3/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/gss3.cpp)

**Level**: ``` Medium ```

***

**Problem 9.**		Query(x1,y1,x2,y2) = Max {A[i]+A[i+1]+...+A[j] } where  x1 <= i <= y1 , x2 <= j <= y2 and x1 <= x2 , y1 <= y2 }

[GSS5 - Can you answer these queries V - SPOJ](http://www.spoj.com/problems/GSS5/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/gss5.cpp)

**Level**: ```Hard```

***

**Problem 10.**		Two types of operations can be here.

1. *Set the value of A[i] to x.*

2. *Find i and j such that x ≤ i, j ≤ y and i != j, such that the 
sum A[i]+A[j] is maximized.*

[KGSS - Maximum Sum - SPOJ](http://www.spoj.com/problems/KGSS/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/kgss.cpp)

**Level**: ``` Medium ```

***

**Problem 11.**		Two types of operations can be here.

1. *Apply the xor operation with a given number x to each array 
element on the segment [l, r].*

2. *Query sum in [l,r].*

[XOR on Segment - CODEFORCES Round #149 (Div. 2) E](http://codeforces.com/problemset/problem/242/E)

[Solution - Github](https://github.com/Jaskamalkainth/Codeforces/blob/master/xor_on_segment.cpp)

**Level**: ``` Hard```

***

**Problem 12.**	 *Given Ranges of the form li ri, denoting the numbers of the 
leftmost and rightmost sections covered by the i-th poster.*

*Output the number of posters with visible sections.*

[POSTERS - Election Posters - SPOJ](http://www.spoj.com/problems/POSTERS/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/posters.cpp)

**Level**: ``` Medium ```	

***


**Problem 13.**		Two types of operations can be here.

1. *Change the i-th bracket into the opposite one.*

2. *Check -- if the word is a correct bracket expression.*


[BRCKTS - Brackets - SPOJ](http://www.spoj.com/problems/BRCKTS/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/brackets.cpp)

**Level**: ``` Medium ```	

***

**Problem 14.**		Two types of operations can be here.

1. *Invert switched between [l,r]*

2. *Count how many lights are on in the range [l,r]*

[LITE - Light Switching - SPOJ](http://www.spoj.com/problems/LITE/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/lite.cpp)

**Level**: ``` Medium ```

***


**Problem 15.**		Two types of operations can be here.

1. *Online Queries*

2. *For each k-query (i, j, k), you have to return the number of elements greater than k in the subsequence a<sub>i</sub>, a<sub>i+1</sub>, ..., a<sub>j</sub>.*

[KQUERYO - K-Query Online - SPOJ](http://www.spoj.com/problems/KQUERYO/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/KqueryOnline.cpp)

**Level**: ``` Hard```


***


**Problem 16.**		Two types of operations can be here.

1. *change all numbers in the range of x to y (inclusive) to v.*

2. *Count the number of primes between index x and y.*

[CNTPRIME - Counting Primes - SPOJ](http://www.spoj.com/problems/CNTPRIME/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/cntprime.cpp)

**Level**: ``` Medium ```

***


**Problem 17.**		Given a string (bracket sequence)


1. *Count the length of the maximum correct bracket subsequence of sequence.*

[(Div. 1) C. Sereja and Brackets - CODEFORCES](http://codeforces.com/problemset/problem/380/C)

[Solution - Github](https://github.com/Jaskamalkainth/Codeforces/blob/master/serejabrackets.cpp)

**Level**: ``` Medium ```

***


**Problem 18.**		Given n ants with there strenths s<sub>i</sub>. 

When two ants i and j fight, ant i gets one battle point only if s<sub>i</sub> divides s<sub>j</sub> . An ant i, with v<sub>i</sub> battle points obtained, is going to be freed only if vi = r - l

1. *Count how many ants is he going to eat if those ants fight*

[(Div. 2) F. Ant colony - CODEFORCES- Round #271 ](http://codeforces.com/problemset/problem/474/F)

[Solution - Github](https://github.com/Jaskamalkainth/Codeforces/blob/master/271_ant_colony.cpp)

**Level**: ``` Hard ```


***


**Problem 19.**		Given a string (bracket sequence)


1. *Count the length of the maximum correct bracket subsequence of sequence.*

2. Answer how many numbers between indices A and B are divisible by 3.

[MULTQ3 - SPOJ](http://www.spoj.com/problems/MULTQ3/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/multq3.cpp)

**Level**: ``` Medium ```

***


**Problem 20.**		Given an arrangement consists of a cuboidal box of size N<sub>x</sub> × N<sub>y</sub>× N<sub>z</sub> made of unit cubes.


1. Range Update with val = 1 in X, Y ,Z axis.

2. Report the number of red plants (1) in the cuboidal region with (x1,y1,z1) and (x2,y2,z2)

[IOPC1207 - GM plants - SPOJ](http://www.spoj.com/problems/IOPC1207/)

[Solution - Github](https://github.com/Jaskamalkainth/Spoj/blob/master/IOPC1207.cpp)

**Level**: ``` Hard ```


</div>
</div>