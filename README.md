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

## Repository & Workspace Structure

```
.
├── package.json                         # Root workspace scripts (dev, build:all, etc.)
├── proj-experiment-writo-web/           # Standalone Web App (React + Vite + WebGPU)
│   ├── src/
│   │   ├── components/                  # UnifiedEditor, Header, ActionToolbar, DiffViewer, HistoryModal
│   │   ├── hooks/                       # useWebLLM, useDarkMode, useSpeechRecognition
│   │   ├── constants/                   # Model registry & prompt configurations
│   │   └── utils/                       # Diff, metrics & WebGPU hardware checks
│   ├── package.json
│   └── vite.config.ts
├── proj-experiment-writo-extension/     # Chrome Extension (Manifest V3 + WebGPU Offscreen)
│   ├── src/
│   │   ├── background/                  # Service worker lifecycle & pill injection
│   │   ├── offscreen/                   # WebGPU WebLLM generation engine & chunk streaming
│   │   ├── content/                     # Floating selection pill & in-page text replacement
│   │   ├── popup/                       # Model download manager & status UI
│   │   └── sidepanel/                   # Dedicated sidepanel rewrite workspace
│   ├── manifest.json
│   └── package.json
└── proj-experiment-writo-raycast/       # macOS Raycast Companion Extension
    ├── src/
    └── package.json
```

## Quick Start Commands (from root)

```bash
# Run Web Application in dev mode
npm run dev
# or
npm run dev:web

# Build Web Application
npm run build:web

# Build Chrome Extension
npm run build:extension

# Build all applications
npm run build:all
```
