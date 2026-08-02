"use client";
import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import Cell from "./cell";
import { uploadFile } from "@/lib/execution/pyodideRunner";
import ThemeToggle from "./ThemeToggle";

type CellData = { id: number; code: string };

export default function Notebook() {
  const [cells, setCells] = useState<CellData[]>([{ id: 1, code: "" }]);
  const [files, setFiles] = useState<string[]>([]);

  function addCell() {
    setCells([...cells, { id: Date.now(), code: "" }]);
  }
  function deleteCell(id: number) {
    setCells(cells.filter((c) => c.id !== id));
  }
  function duplicateCell(id: number) {
    const index = cells.findIndex((c) => c.id === id);
    const newCell = { id: Date.now(), code: cells[index].code };
    const newCells = [...cells];
    newCells.splice(index + 1, 0, newCell);
    setCells(newCells);
  }
  function updateCode(id: number, code: string) {
    setCells(cells.map((c) => (c.id === id ? { ...c, code } : c)));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
      setFiles([...files, file.name]);
    }
  }

  return (
    <div className="flex overflow-x-hidden">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-gray-300 dark:border-gray-700 p-4 min-h-screen overflow-hidden">
        <label className="flex items-center gap-2 cursor-pointer mb-4 px-3 py-2 bg-blue-600 text-white rounded-md w-fit">
          <Upload size={16} />
          Upload
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>
        {files.map((f) => (
          <div key={f} className="flex items-center justify-between gap-2 text-sm py-1">
            <span className="flex items-center gap-1 truncate">
              <FileText size={14} className="shrink-0" />
              <span className="truncate">{f}</span>
            </span>
            <button onClick={() => setFiles(files.filter((x) => x !== f))} className="shrink-0 text-red-500">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Notebook */}
      <div style={{ maxWidth: "1300px", width: "100%", margin: "0 auto", padding: "32px" }}>
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        {cells.map((cell) => (
          <div key={cell.id} style={{ marginBottom: "16px" }}>
            <Cell
              code={cell.code}
              onChange={(code) => updateCode(cell.id, code)}
              onDelete={() => deleteCell(cell.id)}
              onDuplicate={() => duplicateCell(cell.id)}
            />
          </div>
        ))}
        <button onClick={addCell} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          + Add Cell
        </button>
      </div>
    </div>
  );
}