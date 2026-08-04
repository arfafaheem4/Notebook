"use client";
import { useState } from "react";
import Cell from "./cell";
import ThemeToggle from "./ThemeToggle";
import FileSidebar from "./FileSidebar";
import DownloadMenu from "./DownloadMenu";
import ConfirmDialog from "./ConfirmDialog";
import { restartKernel } from "@/lib/execution/kernelClient";
import { RotateCcw, Plus, Save } from "lucide-react";
import { useBackendStatus } from "@/lib/hooks/useBackendStatus";

type CellData = { id: number; code: string; type: "code" | "markdown"; output?: string; image?: string; html?: string };
type Props = {
  notebookId: string;
  cells: CellData[];
  setCells: (c: CellData[]) => void;
  notebookName: string;
  saveStatus: "saved" | "saving";
  onForceSave: () => void;
  notebooks: { id: number; name: string }[];
  activeId: number;
  renamingId: number | null;
  onAddNotebook: () => void;
  onSelectNotebook: (id: number) => void;
  onStartRenaming: (id: number | null) => void;
  onRenameNotebook: (id: number, name: string) => void;
  onDeleteNotebook: (id: number) => void;
};

export default function Notebook({ notebookId, cells, setCells, notebookName, saveStatus, onForceSave, notebooks, activeId, renamingId, onAddNotebook, onSelectNotebook, onStartRenaming, onRenameNotebook, onDeleteNotebook }: Props) {
  const [confirmCellId, setConfirmCellId] = useState<number | null>(null);
  const [executionCountReset, setExecutionCountReset] = useState(0);
  const backendConnected = useBackendStatus();

  function addCell(type: "code" | "markdown", insertAt = cells.length) {
    setCells([...cells.slice(0, insertAt), { id: Date.now(), code: "", type, output: "", image: undefined }, ...cells.slice(insertAt)]);
  }
  function deleteCell(id: number) { setCells(cells.filter((c) => c.id !== id)); }
  function duplicateCell(id: number) {
    const i = cells.findIndex((c) => c.id === id);
    const newCells = [...cells];
    newCells.splice(i + 1, 0, { id: Date.now(), code: cells[i].code, type: cells[i].type, output: cells[i].output, image: cells[i].image, html: cells[i].html });
    setCells(newCells);
  }
  function updateCode(id: number, code: string) { setCells(cells.map((c) => (c.id === id ? { ...c, code } : c))); }
  function updateOutput(id: number, output: string, image?: string, html?: string) {
    setCells(cells.map((c) => (c.id === id ? { ...c, output, image, html } : c)));
  }
  function moveCell(id: number, direction: "up" | "down") {
    const i = cells.findIndex((c) => c.id === id);
    const newIndex = direction === "up" ? i - 1 : i + 1;
    if (newIndex < 0 || newIndex >= cells.length) return;
    const newCells = [...cells];
    const temp = { code: newCells[i].code, type: newCells[i].type, output: newCells[i].output, image: newCells[i].image, html: newCells[i].html };
    newCells[i] = { ...newCells[i], code: newCells[newIndex].code, type: newCells[newIndex].type, output: newCells[newIndex].output, image: newCells[newIndex].image, html: newCells[newIndex].html };
    newCells[newIndex] = { ...newCells[newIndex], code: temp.code, type: temp.type, output: temp.output, image: temp.image, html: temp.html };
    setCells(newCells);
  }
  const [restarting, setRestarting] = useState(false);
  async function handleRestart() {
  setRestarting(true);
  await restartKernel(notebookId);
  setExecutionCountReset((count) => count + 1);
  setRestarting(false);
}


  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-[#171b25]">
      <FileSidebar
        notebookId={notebookId}
        notebooks={notebooks}
        activeId={activeId}
        renamingId={renamingId}
        onAddNotebook={onAddNotebook}
        onSelectNotebook={onSelectNotebook}
        onStartRenaming={onStartRenaming}
        onRenameNotebook={onRenameNotebook}
        onDeleteNotebook={onDeleteNotebook}
      />
      <div className="ml-72 min-h-screen">
      <div style={{ maxWidth: "1300px", width: "100%", margin: "0 auto", padding: "32px" }}>
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <button
  onClick={handleRestart}
  disabled={restarting}
  className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
>
  <RotateCcw size={14} className={restarting ? "animate-spin" : ""} />
  {restarting ? "Restarting..." : "Restart Kernel"}
</button>
          <button
            onClick={onForceSave}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <Save size={14} />
            Save
          </button>
          <DownloadMenu cells={cells} notebookName={notebookName} />
          <div className="flex items-center gap-2 px-2">
            <span className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {saveStatus === "saved" ? "Auto-saved" : "Saving..."}
            </span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        {backendConnected === false && (
  <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm">
    Backend not running. Start it with <code>uvicorn main:app --reload</code> in the backend folder.
  </div>
)}
        {cells.map((cell, index) => (
          <div key={cell.id} className="mb-2">
            <Cell
              notebookId={notebookId}
              id={cell.id}
              code={cell.code}
              type={cell.type}
              output={cell.output}
              image={cell.image}
              html={cell.html}
              executionCountReset={executionCountReset}
              onChange={(c) => updateCode(cell.id, c)}
              onRunComplete={(output, image, html) => updateOutput(cell.id, output, image, html)}
              onDelete={() => setConfirmCellId(cell.id)}
              onDuplicate={() => duplicateCell(cell.id)}
              onMoveUp={() => moveCell(cell.id, "up")}
              onMoveDown={() => moveCell(cell.id, "down")}
            />
            <div className="group relative z-10 h-0 pl-10">
              <div className="absolute -top-3 left-10 right-0 h-6">
                <div className="absolute top-1/2 h-px w-full bg-slate-200 transition-colors group-hover:bg-blue-200 dark:bg-slate-700 dark:group-hover:bg-blue-900" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl bg-slate-50 px-2 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 dark:bg-[#171b25]">
                  <button onClick={() => addCell("code", index + 1)} className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Plus size={14} /> Code</button>
                  <button onClick={() => addCell("markdown", index + 1)} className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Plus size={14} /> Markdown</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {cells.length === 0 && <div className="mt-4 flex items-center gap-2">
          <button onClick={() => addCell("code")} className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Plus size={14} /> Code</button>
          <button onClick={() => addCell("markdown")} className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Plus size={14} /> Markdown</button>
        </div>}
      </div>
      </div>
      <ConfirmDialog
        open={confirmCellId !== null}
        message="Delete this cell?"
        onConfirm={() => { if (confirmCellId !== null) deleteCell(confirmCellId); setConfirmCellId(null); }}
        onCancel={() => setConfirmCellId(null)}
      />
    </div>
  );
}
