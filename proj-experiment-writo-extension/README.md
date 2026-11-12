# Writo - Chrome Extension (100% In-Browser AI Writing Assistant)

> **Private • In-Browser • WebGPU Accelerated**  
> AI writing assistance on **any website** in Google Chrome. Runs open-weight LLMs directly inside your browser via WebGPU and WebLLM. Zero cloud API calls, zero tracking, works 100% offline once model weights are cached.

---

## Key Features

1. **Model Power Tiers (Low, Mid, High)**
   - **Low ("Vapor" - Qwen 2.5 0.5B)**: ~380 MB. Ultra-fast startup, minimal VRAM usage. Perfect for older laptops and quick checks.
   - **Mid ("Solid" - Qwen 2.5 1.5B)**: ~980 MB. *Recommended default*. Gold standard balance of vocabulary, flow, and speed.
   - **High ("Core" - Phi-3 Mini 3.8B)**: ~2,200 MB. Deep precision and nuance for technical and executive writing.

2. **Both Assistance Modes Provided**
   - **Option A: In-Page Floating Assistant**:
     - Highlights any text or focuses any input field (`<textarea>`, `<input>`, or `contenteditable` like Gmail, Jira, Slack, Confluence).
     - A floating pill appears with word counts and the Writo icon.
     - Click to trigger: *Improve Writing*, *Fix Grammar*, *Professional Tone*, *Simplify*, or *Make Concise*.
     - In-place streaming replacement with native Undo (`Ctrl+Z` / `Cmd+Z`) support.
   - **Option B: Side Panel Full Workspace**:
     - Opens right alongside your active tab without covering content (`Ctrl+Shift+U` or `Cmd+Shift+U`).
     - Live word, character, and reading time metrics.
     - Word-level **LCS Diff Viewer** (additions highlighted in emerald, deletions in rose).
     - One-click **"Apply to Webpage"**, copy to clipboard, or download as `.txt`.

3. **Chrome Manifest V3 WebGPU Architecture**
   - Uses an **Offscreen Document** (`chrome.offscreen`) to host the `@mlc-ai/web-llm` WebGPU compute pipeline.
   - Model weights are stored in the extension's local Cache API & IndexedDB.
   - In-page UI is encapsulated inside a **closed Shadow DOM** so host website CSS never distorts the extension.

---

## How to Install in Google Chrome

1. **Build the extension**:
   ```bash
   cd proj-experiment-writo-extension
   npm run build
   ```
2. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select the `dist` folder located at:
   ```
   <repo-root>/proj-experiment-writo-extension/dist
   ```
6. The **Writo** extension icon will appear in your Chrome toolbar!

---

## How to Use

1. Click the **Writo icon** in your toolbar to open the popup.
2. Select your desired model tier (**Low**, **Mid**, or **High**).
3. Click **Download & Activate** (sharded weights are cached permanently in the browser).
4. Go to any website (e.g. Gmail, GitHub, Jira, LinkedIn):
   - **Highlight any text** to reveal the floating pill.
   - Press **Cmd+Shift+I** (Mac) or **Ctrl+Shift+I** (Windows) for quick improvement.
   - Press **Cmd+Shift+U** (Mac) or **Ctrl+Shift+U** (Windows) to open the full side-by-side workspace!

