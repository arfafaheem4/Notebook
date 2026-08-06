# ML Notebook

A browser-based Jupyter-style notebook built with Next.js, Monaco Editor, and a real local Python kernel backend (FastAPI + jupyter_client + ipykernel) — the same technology real Jupyter uses. Runs entirely on the user's own machine (their own CPU/GPU/RAM), not a hosted server.

## Features
- Multiple notebooks, each with its own real Python kernel
- Cells: code (Monaco editor) and markdown
- Run, Stop (interrupt), Restart Kernel, execution count tracking
- Matplotlib chart rendering as inline images
- Pandas DataFrame output rendered as styled HTML tables
- Shared `data/` folder — any file placed there is usable from any notebook via `pd.read_csv(...)`, no upload step required (Upload button is a convenience, not mandatory)
- Real `.ipynb` notebook files saved to disk (`notebooks/` folder), openable in real Jupyter/VS Code too
- Backup layer: auto-saves to localStorage too, with automatic recovery if the main copy is corrupted
- Crash-resilient UI: a broken cell won't crash the rest of the notebook (ErrorBoundary with auto-retry)
- Light/dark theme toggle
- "Open File" — import an existing `.py`/`.ipynb` from your computer into a new notebook tab

## Tech Stack
**Frontend:** Next.js (App Router) + TypeScript, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), next-themes, lucide-react

**Backend:** Python, FastAPI, jupyter_client, ipykernel — see `backend/requirements.txt`

## Setup

1. Clone the repo:
```bash
   git clone <your-repo-url>
   cd ml-notebook
```

2. Install frontend dependencies:
```bash
   npm install
```

3. Install backend dependencies:
```bash
   cd backend
   pip install -r requirements.txt
   cd ..
```

4. Run **both** servers (two separate terminals — both must be running):

   **Terminal 1 — backend:**
```bash
   cd backend
   python -m uvicorn kernel_server:app --reload --port 8000
```

   **Terminal 2 — frontend:**
```bash
   npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

⚠️ This app requires a real Python backend running locally — it does NOT run Python in the browser (Pyodide was removed early in development due to being unable to run PyTorch/TensorFlow/full sklearn).

## 📂 Project Structure

```text
ML-Notebook/
├── app/                          # Next.js App Router
│   ├── favicon.ico
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main application page
│
├── backend/                      # Python backend
│   ├── __pycache__/
│   ├── data/                     # Dataset files
│   │   └── Accounting Automation.xlsx
│   ├── notebooks/                # User uploaded notebooks
│   │   ├── demo.ipynb
│   │   ├── first notebook.ipynb
│   │   ├── 2nd notebook.ipynb
│   │   └── Notebook 3.ipynb
│   └── kernel_server.py          # Jupyter kernel execution server
│
├── components/                   # React components
│   ├── notebook/
│   │   ├── cell.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── DownloadMenu.tsx
│   │   ├── FileSidebar.tsx
│   │   ├── notebook.tsx
│   │   ├── NotebookManager.tsx
│   │   ├── ShareButton.tsx
│   │   └── ThemeToggle.tsx
│   └── ErrorBoundary.tsx
│
├── hooks/                        # Custom React hooks
│   ├── useBackendStatus.ts
│   └── notebookStore.ts
│
├── lib/
│   └── execution/
│       └── kernelClient.ts       # Communicates with backend kernel
│
├── public/                       # Static assets
│
├── types/                        # TypeScript type definitions
│   └── cell.ts
│
├── node_modules/
│
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
└── README.md
```

## 📁 Folder Overview

| Folder | Purpose |
|---------|----------|
| `app/` | Next.js App Router pages and global styles |
| `backend/` | Python backend for notebook execution using Jupyter kernels |
| `components/` | Reusable React UI components |
| `components/notebook/` | Notebook editor, cells, sidebar, dialogs, and notebook management |
| `hooks/` | Custom React hooks for state management and backend communication |
| `lib/execution/` | Frontend logic for communicating with the Python kernel |
| `types/` | Shared TypeScript interfaces and types |
| `public/` | Static assets such as images and icons |
| `backend/notebooks/` | Stores uploaded Jupyter notebooks |
| `backend/data/` | Input datasets used by notebooks |

## Known Limitations
- Windows-only: Stop/Interrupt requires `pywin32` (already in requirements.txt), and the backend must be restarted after first installing it
- Shared `data/` folder means filenames could collide across unrelated notebooks (same tradeoff real Jupyter has) — accepted for now, may revisit
- No installer yet — requires manually running two servers; packaging (Electron/Tauri or similar) not yet decided