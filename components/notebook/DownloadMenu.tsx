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
      <button onClick={() => setShow(!show)} className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded-md text-sm">
        <Download size={14} />
      </button>
      {show && (
        <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-md z-10 whitespace-nowrap">
          <button onClick={() => { downloadPy(); setShow(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Download: .py</button>
          <button onClick={() => { downloadIpynb(); setShow(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Download: .ipynb</button>
        </div>
      )}
    </div>
  );
}