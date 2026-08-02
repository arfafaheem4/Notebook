# ML Notebook

A browser-based Jupyter-style notebook built with Next.js, Monaco Editor, and Pyodide (Python running entirely in the browser via WebAssembly — no backend server needed).

## Features
- Multiple independent code cells (add, delete, duplicate)
- Python execution in-browser (numpy, pandas, matplotlib supported)
- Matplotlib chart rendering as images
- File upload (CSV/data files) accessible from Python code
- Light/dark theme toggle

## Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Monaco Editor (`@monaco-editor/react`)
- Pyodide (loaded via CDN, not npm)
- next-themes
- lucide-react (icons)

## Setup

1. Clone the repo:
   ```bash
   git clone <your-repo-url>
   cd ml-notebook
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

No Python installation or backend setup required — Pyodide runs Python directly in the browser.

## Project Structure
```
components/
  notebook/
    Cell.tsx        # Single code cell (editor + run/delete/duplicate)
    Notebook.tsx     # Manages cell list, file uploads, theme toggle
    ThemeToggle.tsx  # Light/dark mode switch
lib/
  execution/
    pyodideRunner.ts  # Loads Pyodide, runs Python code, captures output/images
types/
  cell.ts            # Cell data shape
```

## Notes
- First run of numpy/pandas/matplotlib takes a few seconds (one-time package download per browser session).
- Uploaded files are stored in Pyodide's in-browser virtual filesystem (not persisted after refresh).
