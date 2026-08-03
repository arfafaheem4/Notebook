"use client";
import Cell from "./cell";
import ThemeToggle from "./ThemeToggle";
import FileSidebar from "./FileSidebar";
import DownloadMenu from "./DownloadMenu";
import { Plus } from "lucide-react";

type CellData = { id: number; code: string; type: "code" | "markdown"; output?: string; image?: string };
type Props = { cells: CellData[]; setCells: (c: CellData[]) => void; notebookName: string };

export default function Notebook({ cells, setCells, notebookName }: Props) {
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

  return (
    <div className="flex overflow-x-hidden">
      <FileSidebar />
      <div style={{ maxWidth: "1300px", width: "100%", margin: "0 auto", padding: "32px" }}>
        <div className="flex justify-end gap-2 mb-4">
          <DownloadMenu cells={cells} notebookName={notebookName} />
          <ThemeToggle />
        </div>
        {cells.map((cell) => (
          <div key={cell.id} style={{ marginBottom: "16px" }}>
            <Cell
              id={cell.id}
              code={cell.code}
              type={cell.type}
              output={cell.output}
              image={cell.image}
              onChange={(c) => updateCode(cell.id, c)}
              onRunComplete={(output, image) => updateOutput(cell.id, output, image)}
              onDelete={() => deleteCell(cell.id)}
              onDuplicate={() => duplicateCell(cell.id)}
              onMoveUp={() => moveCell(cell.id, "up")}
              onMoveDown={() => moveCell(cell.id, "down")}
            />
          </div>
        ))}
        <div className="flex gap-4 items-center mt-2">
          <button onClick={() => addCell("code")} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">
            <Plus size={14} /> Code
          </button>
          <button onClick={() => addCell("markdown")} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">
            <Plus size={14} /> Markdown
          </button>
        </div>
      </div>
    </div>
  );
}