---
title: "Typst: a faster latex alternative"
date: 2026-08-12
tags:
  - typst
  - resume
  - latex
  - documentation
  - tools
---

## What is Typst?

[Typst](https://typst.app/) is a modern, open-source markup language for typesetting documents. Designed as a fast, intuitive alternative to LaTeX, Typst compiles complex documents into pixel-perfect PDFs in milliseconds.

I use Typst to design and build my personal resume because it combines the typographic precision of LaTeX with the simplicity of Markdown and the power of a modern programming language.

---

## Why Choose Typst Over LaTeX?

- **Instant Preview & Fast Compile:** Compiles in milliseconds rather than seconds.
- **Clean Syntax:** No more endless `\begin{itemize}` and `\end{itemize}` blocks.
- **Built-in Layout System:** Grid layouts, columns, margins, and custom headers are built natively into the syntax.
- **Programmable & Reusable Templates:** Define reusable functions for resume headers, experience entries, and skill badges.

---

## 1. Syntax Basics

### Text Formatting

Writing in Typst feels as natural as Markdown:

```typst
= Heading 1
== Heading 2
=== Heading 3

This is *bold* text, _italic_ text, and `raw code`.
You can also highlight #highlight[important details].
```

### Lists

```typst
- Bullet item 1
- Bullet item 2

+ First numbered step
+ Second numbered step
```

### Mathematics & Formulas

Typst features built-in math syntax that is far simpler than LaTeX:

```typst
Inline math: $a^2 + b^2 = c^2$

Display math:
$ integral_0^\infty e^(-x^2) dx = sqrt(pi) / 2 $
```

---

## 2. Page Configuration & Styling

Typst allows you to configure document-wide rules using `#set` and `#show` rules:

```typst
// Set page dimensions and margins
#set page(
  paper: "a4",
  margin: (x: 1.5cm, y: 1.5cm),
)

// Set global font and size
#set text(
  font: "Liberation Sans",
  size: 10pt,
  fill: rgb("#2b2b2b"),
)

// Customize heading styles
#show heading: set text(fill: rgb("#284b63"))
```

---

## 3. How I Build My Resume in Typst

Below is a complete, working Typst template that structures a clean, professional one-page resume:

```typst
#set page(
  paper: "us-letter",
  margin: (x: 1.25cm, y: 1.25cm),
)
#set text(font: "PT Sans", size: 10pt)

// Define a reusable entry function
#let resume-item(title, location, role, date, body) = [
  #grid(
    columns: (1fr, auto),
    [*#title* - _#role_], [#date],
  )
  #v(-4pt)
  #text(size: 9pt, fill: luma(100))[#location]
  #v(2pt)
  #body
  #v(8pt)
]

// Header
#align(center)[
  #text(size: 20pt, weight: "bold")[Hervé] \
  #text(size: 9pt)[
    #link("mailto:contact@example.com")[contact\@example.com] | 
    #link("https://notosansdiary.com")[notosansdiary.com] | 
    #link("https://github.com")[github.com/user]
  ]
]

#v(10pt)

// Section: Education
== Education

#resume-item(
  "Ajou University",
  "Suwon, South Korea",
  "B.S. in Software Engineering (4th Year)",
  "2021 – Present",
  [
    - Focused on Systems Programming, Web Development, and Computer Architecture.
  ]
)

// Section: Technical Skills
== Technical Skills

- *Languages:* Rust, JavaScript, TypeScript, HTML/CSS, C
- *Frameworks & Tools:* Typst, Quartz, Git, Raylib, Node.js, Linux
- *Specializations:* Full-Stack Web Development, CLI Tools, Interactive Software

// Section: Projects
== Key Projects

#resume-item(
  "Personal Digital Garden",
  "notosansdiary.com",
  "Creator & Developer",
  "2026",
  [
    - Built an interactive, personal portfolio and digital garden using Quartz and SCSS.
    - Implemented custom typography, search, and graph visualization.
  ]
)
```

---

## 4. How to Compile Typst Documents

### Option A: Official Web App
You can sign up for free at [typst.app](https://typst.app/) to edit documents in your browser with real-time visual preview and PDF download.

### Option B: Local CLI (Recommended for Developers)

1. **Install the CLI:**
   - **macOS (Homebrew):** `brew install typst`
   - **Cargo (Rust):** `cargo install --locked typst-cli`

2. **Compile to PDF:**
   ```bash
   typst compile resume.typ resume.pdf
   ```

3. **Live Watch Mode (Auto-recompile on save):**
   ```bash
   typst watch resume.typ
   ```

---

> [!TIP] Resources
> - **Official Typst Tutorial:** [typst.app/docs/tutorial](https://typst.app/docs/tutorial/)
> - **Typst Package Registry:** [typst.app/universe](https://typst.app/universe/)
