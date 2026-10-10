# AI Writing Assistant

> **100% Local • Private • In-Browser AI**  
> Run open-weight LLMs (Qwen 2.5 1.5B, TinyLlama 1.1B, Phi-3 Mini) directly inside your web browser using WebGPU and WebLLM. No cloud APIs, no backend servers, zero telemetry.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |         User's Web Browser            |
                      |                                       |
                      |  +---------------------------------+  |
                      |  |     React UI (TypeScript)       |  |
                      |  |  - Text Editor & Metrics        |  |
                      |  |  - Action Buttons & Shortcuts   |  |
                      |  |  - Word-level Diff Viewer       |  |
                      |  +----------------+----------------+  |
                      |                   |                   |
                      |                   v                   |
                      |  +---------------------------------+  |
                      |  |        WebLLM Runtime           |  |
                      |  |  - Streaming Token Engine       |  |
                      |  |  - Memory & Cache Controller    |  |
                      |  +----------------+----------------+  |
                      |                   |                   |
                      |                   v                   |
                      |  +---------------------------------+  |
                      |  |      Hardware Acceleration      |  |
                      |  |  - WebGPU Compute Shaders       |  |
                      |  |  - IndexedDB Model Cache        |  |
                      |  +---------------------------------+  |
                      +---------------------------------------+
                                          |
                                    [NO NETWORK]
                                          |
                                          X
                                   (Zero Cloud AI)
```

---

## Key Features

1. **Strict Client-Side Privacy**
   - No backend server or cloud AI API (zero OpenAI, Anthropic, Gemini, or Azure calls).
   - User text never departs the browser's JavaScript environment.
   - Operates fully offline once weights are cached locally.

2. **WebGPU & WebLLM Engine**
   - Supports **Qwen 2.5 1.5B Instruct** (Default), **TinyLlama 1.1B**, **Phi-3 Mini 4K**, and **Qwen 2.5 0.5B**.
   - Sharded weights downloaded once and cached permanently via the browser's Cache API / IndexedDB.
   - Real-time token streaming with tokens/sec speed tracking.

3. **Writing Transformation Actions**
   - **Improve Writing**: Polishes grammar, flow, clarity, and readability (`Ctrl + Enter` / `Cmd + Enter`).
   - **Fix Grammar**: Strictly corrects grammar, typos, and punctuation while preserving style.
   - **Professional Tone**: Rewrites drafts for workplace and executive communication.
   - **Simplify**: Converts heavy jargon into plain, clear language.
   - **Make Concise**: Trims wordiness and redundant phrasing.

4. **Productivity Tools**
   - **Word & Character Metrics**: Live character count, word count, sentence count, and reading time.
   - **Interactive Diff View**: Word-level Longest Common Subsequence (LCS) comparison highlighting additions in emerald and deletions in rose.
   - **Copy & Replace**: One-click "Replace Original" and clipboard copy with visual feedback.
   - **Download as TXT**: Export improved revisions instantly.
   - **Interactive Preview Fallback**: Graceful local simulation mode for browsers lacking WebGPU.
   - **Dark Mode**: Seamless toggle between sleek dark mode and crisp light mode.

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 22+)
- A modern browser with WebGPU enabled (Chrome 113+, Edge 113+, Arc, Brave, or Safari 18+)

### Installation
```bash
# Clone or navigate to the directory
cd proj-experiment-editor

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Enter` / `Cmd + Enter` | Run **Improve Writing** |
| `Escape` | Stop ongoing generation |

---

## Folder Structure

```
├── index.html                   # HTML entry point with fonts & dark theme setup
├── package.json                 # Dependencies & build scripts
├── postcss.config.js            # PostCSS configuration for Tailwind
├── tailwind.config.js           # Tailwind CSS configuration with brand colors
├── tsconfig.json                # TypeScript compiler configuration
├── tsconfig.node.json           # TypeScript node configuration
├── vite.config.ts               # Vite configuration with COOP/COEP headers
└── src
    ├── main.tsx                 # React application mounting
    ├── App.tsx                  # Primary single-page layout & state orchestrator
    ├── index.css                # Tailwind directives & glassmorphic utilities
    ├── types
    │   └── index.ts             # TypeScript definitions for actions & models
    ├── constants
    │   ├── models.ts            # Local LLM registry (Qwen, TinyLlama, Phi-3)
    │   └── prompts.ts           # System prompts, action templates & sample drafts
    ├── utils
    │   ├── diff.ts              # Word-level LCS diff algorithm
    │   ├── textStats.ts         # Character, word, sentence & reading time calculator
    │   └── webgpu.ts            # WebGPU adapter detector & diagnostics
    ├── hooks
    │   ├── useDarkMode.ts       # Theme manager with localStorage persistence
    │   └── useWebLLM.ts         # WebLLM engine lifecycle, streaming & caching hook
    └── components
        ├── Header.tsx           # Navigation header, model selector & theme toggle
        ├── ModelStatusBanner.tsx# Progress bar, download status & WebGPU alerts
        ├── TextEditor.tsx       # Original text input with live statistics
        ├── ActionToolbar.tsx    # 5 action buttons with loading states & shortcuts
        ├── ResultViewer.tsx     # Output container with copy, replace & TXT download
        ├── DiffViewer.tsx       # Visual word diff renderer
        └── Footer.tsx           # Privacy badge & architecture specs
```
