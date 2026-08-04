"use client";
import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";

type CellData = { code: string; type: "code" | "markdown" };

export default function DownloadMenu({ cells, notebookName }: { cells: CellData[]; notebookName: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function trigger(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPy() {
    const content = cells.map((c) => c.code).join("\n\n# ---\n\n");
    trigger(new Blob([content], { type: "text/plain" }), `${notebookName}.py`);
  }

  function downloadIpynb() {
    const notebook = {
      cells: cells.map((c) => ({ cell_type: c.type, source: c.code.split("\n"), metadata: {}, outputs: [], execution_count: null })),
      metadata: {}, nbformat: 4, nbformat_minor: 5,
    };
    trigger(new Blob([JSON.stringify(notebook, null, 2)], { type: "application/json" }), `${notebookName}.ipynb`);
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setShow(!show)} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
        <Download size={14} />
        Export
      </button>
      {show && (
        <div className="absolute right-0 z-10 mt-2 overflow-hidden whitespace-nowrap rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <button onClick={() => { downloadPy(); setShow(false); }} className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700">Download: .py</button>
          <button onClick={() => { downloadIpynb(); setShow(false); }} className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700">Download: .ipynb</button>
        </div>
      )}
    </div>
  );
}
