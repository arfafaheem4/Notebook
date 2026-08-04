"use client";
import { useState } from "react";
import Cell from "./cell";
import ThemeToggle from "./ThemeToggle";
import FileSidebar from "./FileSidebar";
import DownloadMenu from "./DownloadMenu";
import ConfirmDialog from "./ConfirmDialog";
import { restartKernel } from "@/lib/execution/kernelClient";
import { RotateCcw, Plus } from "lucide-react";
import { useBackendStatus } from "@/lib/hooks/useBackendStatus";

type CellData = { id: number; code: string; type: "code" | "markdown"; output?: string; image?: string };
type Props = {
  notebookId: string;
  cells: CellData[];
  setCells: (c: CellData[]) => void;
  notebookName: string;
  saveStatus: "saved" | "saving";
  onForceSave: () => void;
};

export default function Notebook({ notebookId, cells, setCells, notebookName, saveStatus, onForceSave }: Props) {
  const [confirmCellId, setConfirmCellId] = useState<number | null>(null);
  const backendConnected = useBackendStatus();

  function addCell(type: "code" | "markdown") {
    setCells([...cells, { id: Date.now(), code: "", type, output: "", image: undefined }]);
  }
  function deleteCell(id: number) { setCells(cells.filter((c) => c.id !== id)); }
  function duplicateCell(id: number) {
    const i = cells.findIndex((c) => c.id === id);
    const newCells = [...cells];
    newCells.splice(i + 1, 0, { id: Date.now(), code: cells[i].code, type: cells[i].type, output: cells[i].output, image: cells[i].image });
    setCells(newCells);
  }
  function updateCode(id: number, code: string) { setCells(cells.map((c) => (c.id === id ? { ...c, code } : c))); }
  function updateOutput(id: number, output: string, image?: string) {
    setCells(cells.map((c) => (c.id === id ? { ...c, output, image } : c)));
  }
  function moveCell(id: number, direction: "up" | "down") {
    const i = cells.findIndex((c) => c.id === id);
    const newIndex = direction === "up" ? i - 1 : i + 1;
    if (newIndex < 0 || newIndex >= cells.length) return;
    const newCells = [...cells];
    const temp = { code: newCells[i].code, type: newCells[i].type, output: newCells[i].output, image: newCells[i].image };
    newCells[i] = { ...newCells[i], code: newCells[newIndex].code, type: newCells[newIndex].type, output: newCells[newIndex].output, image: newCells[newIndex].image };
    newCells[newIndex] = { ...newCells[newIndex], code: temp.code, type: temp.type, output: temp.output, image: temp.image };
    setCells(newCells);
  }
  const [restarting, setRestarting] = useState(false);
  async function handleRestart() {
  setRestarting(true);
  await restartKernel(notebookId);
  setRestarting(false);
}


  return (
    <div className="flex overflow-x-hidden">
      <FileSidebar notebookId={notebookId} />
      <div style={{ maxWidth: "1300px", width: "100%", margin: "0 auto", padding: "32px" }}>
        <div className="flex justify-end items-center gap-3 mb-4">
          <button
  onClick={handleRestart}
  disabled={restarting}
  className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded-md text-sm disabled:opacity-50"
>
  <RotateCcw size={14} className={restarting ? "animate-spin" : ""} />
  {restarting ? "Restarting..." : "Restart Kernel"}
</button>
          <DownloadMenu cells={cells} notebookName={notebookName} />
          <ThemeToggle />
        </div>
        {backendConnected === false && (
  <div className="mb-4 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm">
    Backend not running. Start it with <code>uvicorn main:app --reload</code> in the backend folder.
  </div>
)}
        {cells.map((cell) => (
          <div key={cell.id} style={{ marginBottom: "16px" }}>
            <Cell
              notebookId={notebookId}
              id={cell.id}
              code={cell.code}
              type={cell.type}
              output={cell.output}
              image={cell.image}
              onChange={(c) => updateCode(cell.id, c)}
              onRunComplete={(output, image) => updateOutput(cell.id, output, image)}
              onDelete={() => setConfirmCellId(cell.id)}
              onDuplicate={() => duplicateCell(cell.id)}
              onMoveUp={() => moveCell(cell.id, "up")}
              onMoveDown={() => moveCell(cell.id, "down")}
            />
          </div>
        ))}
        <div className="flex gap-4 items-center mt-2">
          <button onClick={() => addCell("code")} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600"><Plus size={14} /> Code</button>
          <button onClick={() => addCell("markdown")} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600"><Plus size={14} /> Markdown</button>
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