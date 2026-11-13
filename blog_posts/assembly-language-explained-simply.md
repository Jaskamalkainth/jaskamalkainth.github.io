---
title: "Assembly Language Explained Simply: Registers, Step by Step"
description: "Assembly language is the list of tiny steps a CPU really runs: move a number, add two, jump back. A kid-friendly guide with a tiny CPU you can step through."
date: 2026-11-13
last_modified_at: 2026-11-13
keywords: [assembly language explained, what is assembly language, assembly language for beginners, CPU registers explained, fetch decode execute cycle, machine code vs assembly, x86-64 assembly, ARM64 assembly]
categories: computers hardware assembly
related: ["/blog_posts/taalas-hc1-chatjimmy-explained.html", "/blog_posts/CppNotes.html", "/blog_posts/weight-space-programming-explained.html"]
faq:
  - q: "Is assembly language the same as machine code?"
    a: "Almost, but not quite. Machine code is the raw numbers the CPU reads, such as the two bytes 01 D8. Assembly is the same instruction written as a short word a person can read, such as add eax, ebx. A program called an assembler turns one into the other, usually one assembly line into one machine instruction. So assembly is machine code with names instead of numbers."
  - q: "Is assembly language hard to learn?"
    a: "Each instruction is simple: move a number, add two numbers, compare, jump. What makes assembly hard is that you need many of those small steps to do anything useful, and you must track every register yourself. Most people learn the basics in a few evenings by stepping through tiny programs, like the add and multiply examples on this page, in a simulator or debugger."
  - q: "Do programmers still write assembly today?"
    a: "Rarely by hand, but many read it. Compilers for C, C++, Rust and Go produce better assembly than most people write. Programmers still look at assembly to find out why code is slow, to debug crashes without source code, and to write the few routines where speed is critical, such as parts of video codecs, cryptography libraries, bootloaders and operating system kernels."
  - q: "Does my phone use the same assembly language as my laptop?"
    a: "Probably not. Each CPU family has its own instruction set, and therefore its own assembly language. Most phones and Apple M-series Macs use ARM64; most Windows laptops and desktops use x86-64 chips from Intel or AMD. The ideas are the same, registers, memory, add and jump, but the instruction names, register names and byte encodings differ, so a program must be built separately for each."
  - q: "How many registers does a CPU have?"
    a: "It depends on the instruction set. An x86-64 CPU gives programs 16 general-purpose 64-bit registers (rax, rbx and so on, through r15). An ARM64 CPU gives 31 (x0 to x30). There are also special registers, such as the program counter, the flags, and wide vector registers for doing many numbers at once. Inside, modern chips have hundreds of hidden physical registers that they rename on the fly."
---

# Assembly Language Explained Simply: Registers, Step by Step

> **In short:** assembly language is the list of tiny steps a CPU actually runs, written as short words: put a number in a register, add two registers, copy a register to memory, jump back to an earlier line. Registers are the CPU's few "hands", memory is a big shelf of numbered boxes, and a counter remembers which step is next.

<link rel="stylesheet" href="/blog_posts/experiments/assembly-language/asm-post.css">

I've written this the way I'd explain it to a curious five-year-old: a cook, two hands, a shelf of boxes. Every section starts with a picture or a small simulation; the full explanation for grown-ups sits under **Read more**. **Try it first:** jump to the [tiny CPU simulator](#watch-a-tiny-cpu-run-assembly-step-by-step) and press *Step*.

## What is assembly language?

<figure class="hv" data-hv="ladder">
<div class="hv-canvas"><p class="hv-fallback">Figure: one line of code at four levels. C: a = a + b; becomes the x86-64 assembly instruction add eax, ebx, which the assembler turns into the two machine-code bytes 01 D8, which the chip sees as the bits 00000001 11011000.</p></div>
<figcaption><strong>Assembly is the last level that still uses words.</strong> Below it there are only numbers. The bytes are real: GNU as encodes <code>add eax, ebx</code> as <code>01 D8</code>.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: assembly, machine code and the languages above them</summary>

A CPU (central processing unit, the chip that does the computing) understands only one thing: numbers that stand for instructions. That list of numbers is **machine code**. Writing those numbers by hand is miserable, so each instruction also gets a short name, called a **mnemonic**, such as `add`, `mov` or `jmp`. A program written with those names is **assembly language**, and the tool that translates it into machine code is an **assembler**.

The key idea for a five-year-old: a CPU is a very fast cook who can only follow very small steps. "Make a cake" is far too big. "Pick up the egg", "crack it into the bowl", "stir 10 times" is the right size. Assembly is the recipe written in those tiny steps.

Languages like C, Python or Rust let you write one big step, such as `a = a + b;`. A **compiler** breaks it into the small steps for you. If the variable `a` lives in register `eax` and `b` in `ebx`, that whole line becomes the single x86-64 instruction `add eax, ebx`, which is the two bytes `01 D8`, which in turn is the 16 bits `00000001 11011000`: tiny switches that are on or off.

| Level | Example | Who reads it |
|---|---|---|
| High-level language (C) | `a = a + b;` | People |
| Assembly (x86-64) | `add eax, ebx` | People who want to see what the CPU does |
| Machine code (hex) | `01 D8` | The CPU (shown as hex for people) |
| Bits | `00000001 11011000` | The circuits |

</details>

## What is a register? The CPU's hands

<figure class="hv" data-hv="kitchen">
<div class="hv-canvas"><p class="hv-fallback">Figure: a kitchen picture of a computer. On the left, a recipe card (the program) with five lines: LOAD A, [0]; LOAD B, [1]; ADD A, B; STORE A, [2]; HALT, and a finger pointing at line 2 (the program counter). In the middle, the CPU as a cook with three hands named A, B and C (the registers) and a calculator (the ALU). On the right, a shelf of eight numbered boxes (memory) holding 2, 3, 5 and zeros. LOAD moves a number from a box to a hand; STORE moves it back.</p></div>
<figcaption><strong>Hands are fast but few; boxes are many but far away.</strong> That one trade-off shapes almost every assembly program. Illustrative picture.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: registers, memory, the program counter and the ALU</summary>

A **register** is a tiny storage slot built right into the CPU. Think of it as the cook's hand: whatever you want to add, compare or change has to be in a hand first. A real x86-64 CPU gives programs 16 general-purpose registers, each holding one 64-bit number; an ARM64 CPU gives 31. That's all. You can't add two numbers while they sit on the shelf.

**Memory** (RAM) is the shelf of numbered boxes. A computer has billions of them, and each box has an **address**, its number on the shelf. Memory is much bigger than the registers but slower to reach: reading from main memory can take a hundred clock ticks or more, while a register is ready immediately. That's why so much of assembly is moving numbers from boxes to hands (**load**), working on them, and putting results back (**store**).

Two more parts complete the picture:

- The **program counter** (PC, called the instruction pointer `rip` on x86-64) is the cook's finger on the recipe. It holds the address of the next instruction. Normally it moves down one line at a time; a **jump** moves it somewhere else.
- The **ALU** (arithmetic logic unit) is the calculator. It adds, subtracts, compares and does bit operations on numbers that are in registers. After each calculation, it sets little **flags**, such as the *zero flag* that turns on when the answer was 0.

| Kid word | Real word | What it does |
|---|---|---|
| Hands | Registers | Hold the few numbers being worked on right now |
| Shelf of boxes | Memory (RAM) | Holds everything else, each box at a numbered address |
| Recipe card | Program | The list of instructions, also stored in memory |
| Finger | Program counter | Remembers which instruction runs next |
| Calculator | ALU | Does the math, sets the flags |

</details>

## Watch a tiny CPU run assembly, step by step

<figure class="hv" data-hv="sim">
<div class="hv-canvas"><p class="hv-fallback">Figure: an interactive tiny CPU with three registers (A, B, C), a program counter, a zero flag and eight memory boxes. Program 1, "Add two numbers", with x = 2 and y = 3: LOAD A, [0] copies 2 from box 0 into A; LOAD B, [1] copies 3 into B; ADD A, B makes A = 5; STORE A, [2] writes 5 into box 2; HALT stops. It takes 5 instructions and 15 steps. Program 2, "Multiply by adding": MOV A, 0; MOV B, 3; MOV C, 4; then ADD A, B; DEC C; JNZ 3 loops four times until C reaches 0 and the zero flag turns on, then STORE A, [0] writes 12 and HALT stops after 17 instructions (51 steps).</p></div>
<figcaption><strong>Every instruction is a fetch, a decode and an execute.</strong> Press <em>Step</em> for one phase, <em>Run</em> to let it go, and change x and y. This is a real (toy) CPU running in your browser: it executes each instruction on the registers and boxes you see.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the toy instruction set and the two programs</summary>

The simulator runs a **made-up teaching instruction set**, kept tiny so every instruction fits in one sentence. Real instruction sets have hundreds of instructions, but these seven show the important kinds: moving data, doing math and changing the order.

| Instruction | Plain words | Real x86-64 cousin |
|---|---|---|
| `MOV A, 3` | Put the number 3 in register A | `mov eax, 3` |
| `LOAD A, [0]` | Copy the number in memory box 0 into A | `mov eax, [address]` |
| `STORE A, [2]` | Copy A into memory box 2 | `mov [address], eax` |
| `ADD A, B` | A = A + B, and set the zero flag if the answer is 0 | `add eax, ebx` |
| `DEC C` | C = C − 1, and set the zero flag if the answer is 0 | `dec ecx` |
| `JNZ 3` | If the zero flag is off, jump to line 3 | `jnz label` |
| `HALT` | Stop | `hlt` (in an OS, a program calls `exit` instead) |

**Program 1: add two numbers.** With 2 in box 0 and 3 in box 1, the CPU loads both into registers, because the calculator only works on hands, adds them, and stores the 5 in box 2. Five instructions, and at three phases each, 15 steps.

**Program 2: multiply by adding.** This toy CPU has no multiply instruction, so it does 3 × 4 the way a child might: start with 0, add 3, and repeat 4 times. Register C counts down how many additions are left. `DEC C` takes one away and turns on the zero light when C reaches 0. `JNZ 3` ("jump if not zero") sends the finger back to line 3 while the light is off. That pair is a **loop**, and it's how every `for` and `while` loop in every language ends up on the CPU. With x = 3 and y = 4 it runs 3 setup instructions, 4 rounds of 3 loop instructions, then STORE and HALT: 17 instructions, 51 steps, and box 0 ends at 12.

I limited x and y to 1-9 on purpose. If C started at 0, `DEC C` would make it −1, the zero light would never come on, and the loop would run (nearly) forever. That's a classic assembly bug, and a good reason compilers do this bookkeeping for us.

</details>

## How does a CPU run each instruction? Fetch, decode, execute

<figure class="hv" data-hv="cycle">
<div class="hv-canvas"><p class="hv-fallback">Figure: a loop of three circles, Fetch (read the next instruction at the program counter), Decode (work out what it means), Execute (do it and move the program counter), repeated forever. Tiles: a 3 GHz clock ticks 3,000,000,000 times per second; one tick lasts 0.33 nanoseconds, the time light takes to travel about 10 cm; real cores overlap the phases of many instructions (pipelining).</p></div>
<figcaption><strong>A CPU does one thing, very fast, forever:</strong> fetch the next instruction, decode it, execute it. The tick numbers are simple arithmetic for a 3 GHz clock.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: the instruction cycle and the clock</summary>

Every CPU, from a washing-machine controller to a laptop, repeats the same **fetch-decode-execute cycle** (also called the instruction cycle):

1. **Fetch:** read the instruction stored at the address in the program counter.
2. **Decode:** work out which operation it is and which registers or memory it uses.
3. **Execute:** do it (add, copy, compare) and update the program counter, either to the next instruction or, for a jump, to a new place.

A **clock** keeps everything in step by ticking at a fixed rate. At 3 GHz (3 gigahertz) it ticks 3,000,000,000 times per second, so one tick lasts 1 ÷ 3,000,000,000 s ≈ 0.33 nanoseconds. In that time light travels only about 10 cm.

The simulator above spends one tick on each phase, so each instruction costs exactly three. Real CPUs are cleverer. They **pipeline**, so while one instruction executes, the next is being decoded and the one after is being fetched, like a car assembly line. Modern cores also run several instructions per tick and sometimes out of order. The result looks exactly as if the instructions ran one at a time, in order, which is why the simple model is still the right way to read assembly.

</details>

## What does real assembly look like?

Here is the add program for a real x86-64 Linux computer. I assembled it with GNU `as` and `ld` (binutils 2.42), ran it, and printed its exit code:

```asm
    .intel_syntax noprefix
    .globl _start
_start:
    mov  eax, 2        # put 2 in register eax
    mov  ebx, 3        # put 3 in register ebx
    add  eax, ebx      # eax = eax + ebx  -> 5
    mov  edi, eax      # exit code = eax
    mov  eax, 60       # system call 60 = exit (Linux x86-64)
    syscall
```

```sh
$ as -o five.o five.s && ld -o five five.o && ./five; echo "exit code: $?"
exit code: 5
```

<figure class="hv" data-hv="listing">
<div class="hv-canvas"><p class="hv-fallback">Figure: the program above as objdump shows it. Address 401000, bytes b8 02 00 00 00, mov eax, 2. 401005, bb 03 00 00 00, mov ebx, 3. 40100a, 01 d8, add eax, ebx. 40100c, 89 c7, mov edi, eax. 40100e, b8 3c 00 00 00, mov eax, 60. 401013, 0f 05, syscall. 6 instructions, 21 bytes of machine code, exit code 5.</p></div>
<figcaption><strong>Every line of assembly is a few bytes in memory.</strong> Real <code>objdump -d -M intel</code> output for the program above; the 5 came back as its exit code.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: reading the listing, and the loop version</summary>

Each row of the listing is one instruction. The **address** is where it sits in memory (the "box number" of the recipe line); the **bytes** are its machine code. Notice two things. First, the program itself lives in memory, just like data, which is what the program counter points into. Second, x86-64 instructions have different lengths: `add eax, ebx` is 2 bytes, but `mov eax, 2` is 5, because the number 2 is stored inside the instruction as 4 bytes (`02 00 00 00`, smallest byte first).

The last two lines aren't math. `syscall` asks the operating system (Linux) to do something on the program's behalf; the number in `eax` picks what, and 60 means "exit". Linux takes the exit code from `edi`, which is why the 5 is copied there first. The shell's `$?` then shows it.

The multiply-by-adding loop from the simulator is just as short in real x86-64. I ran this too; it exits with code 12:

```asm
    .intel_syntax noprefix
    .globl _start
_start:
    mov  eax, 0        # A = 0   (the answer starts empty)
    mov  ebx, 3        # B = 3   (what we add each time)
    mov  ecx, 4        # C = 4   (how many times)
again:
    add  eax, ebx      # A = A + B
    dec  ecx           # C = C - 1, sets the zero flag when C hits 0
    jnz  again         # not zero yet? jump back
    mov  edi, eax      # exit code = A
    mov  eax, 60       # Linux x86-64 system call 60 = exit
    syscall
```

```sh
$ as -o mul.o mul.s && ld -o mul mul.o && ./mul; echo "exit code: $?"
exit code: 12
```

In machine code the jump `jnz again` is `75 fa`: "jump if not zero, back 6 bytes". The assembler worked out that distance from the label for you, which is the second job of an assembler after turning names into numbers.

</details>

## Is there one assembly language for every computer?

<figure class="hv" data-hv="isa">
<div class="hv-canvas"><p class="hv-fallback">Figure: the C function int add(int a, int b) { return a + b; } compiled for two CPU families. x86-64 with GCC 13.3 at -O2: endbr64; lea eax, [rdi+rsi]; ret. It has 16 general-purpose registers and instructions 1 to 15 bytes long. ARM64 with Clang 18 at -O2: add w0, w1, w0; ret. It has 31 general-purpose registers and every instruction is 4 bytes.</p></div>
<figcaption><strong>Same idea, different dialects.</strong> Real compiler output for <code>int add(int a, int b) { return a + b; }</code> on two instruction sets.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: instruction sets, x86-64 and ARM64</summary>

No. Each CPU family has its own **instruction set architecture** (ISA): the list of instructions, registers and byte encodings it understands. Assembly is just a readable form of an ISA, so every ISA has its own assembly language. The two you meet most are:

- **x86-64**, used by Intel and AMD chips in most Windows PCs and servers. It has 16 general-purpose registers and variable-length instructions of 1 to 15 bytes.
- **ARM64** (AArch64), used in nearly all phones, Apple M-series Macs and many servers. It has 31 general-purpose registers and every instruction is exactly 4 bytes.

The x86 compiler used `lea` ("load effective address"), an address-calculating instruction that compilers often borrow as a handy "add two registers into a third" in one step. The `endbr64` line isn't part of the addition: Ubuntu's GCC adds it by default as a landing pad for Intel's control-flow protection, which makes it harder for attackers to jump into the middle of functions. The ARM version is the cleanest possible answer: one `add`, then `ret` (return).

Because the dialects differ, a program has to be compiled separately for each ISA. That's why apps ship different builds for Intel and Apple-silicon Macs, and why Apple's Rosetta 2 has to translate x86-64 machine code into ARM64 before it can run.

</details>

## Why would anyone write assembly today?

<figure class="hv" data-hv="uses">
<div class="hv-canvas"><p class="hv-fallback">Figure: four places assembly still shows up. Reading what the compiler made, to check why a hot loop is slow. Debugging crashes without source code. The first code a computer runs: bootloaders, kernels and tiny microcontrollers. The fastest inner loops: video codecs and crypto libraries.</p></div>
<figcaption><strong>Most programmers read assembly far more often than they write it.</strong> Illustrative examples.</figcaption>
</figure>

<details class="hv-more" markdown="1">
<summary>Read more: assembly in practice</summary>

Almost nobody writes whole programs in assembly anymore. Modern compilers for C, C++, Rust and Go schedule instructions and juggle registers better than most people can, and their code runs on many CPUs without rewriting. But assembly is still the ground truth of what a program does, so knowing how to read it pays off:

- **Performance work.** Looking at the compiler's output (for example with `gcc -S` or the Compiler Explorer website) shows whether a loop was vectorized or why it's slower than expected. I use the same habit when I check what my [C++ notes](/blog_posts/CppNotes.html) on templates and `constexpr` actually compile to.
- **Debugging.** When a program crashes inside a library you don't have the source for, the debugger shows assembly and registers.
- **Low-level systems.** The first instructions a computer runs at power-on, parts of operating system kernels, and small microcontrollers still contain hand-written assembly.
- **Hot loops.** Projects such as video codecs and cryptography libraries hand-write a few critical routines to use special vector instructions.

The same "tiny fixed steps" idea goes all the way down into hardware design. In my post on the [Taalas HC1 chip](/blog_posts/taalas-hc1-chatjimmy-explained.html) the steps go one level further: the model's weights are built into the silicon itself, with no instructions to fetch at all.

</details>

## Sources

- Intel, [*Intel 64 and IA-32 Architectures Software Developer's Manuals*](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html): registers, instruction encodings, the 15-byte instruction length limit.
- Arm, [*Arm Architecture Reference Manual for A-profile architecture*](https://developer.arm.com/documentation/ddi0487/latest): the 31 general-purpose registers and fixed 32-bit A64 instructions.
- Linux kernel, [x86-64 system call table](https://github.com/torvalds/linux/blob/master/arch/x86/entry/syscalls/syscall_64.tbl): system call 60 is `exit`.
- [GNU Binutils](https://www.gnu.org/software/binutils/) (`as`, `ld`, `objdump`) 2.42, used to assemble, run and disassemble both example programs on x86-64 Linux; GCC 13.3 and Clang 18.1 for the compiler output.
- Matt Godbolt's [Compiler Explorer](https://godbolt.org/), a handy way to see the assembly for your own code.

<script defer src="/blog_posts/experiments/assembly-language/asm-post.js"></script>
