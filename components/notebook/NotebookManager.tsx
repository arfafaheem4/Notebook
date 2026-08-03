"use client";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Notebook from "./notebook";

type CellData = { id: number; code: string; type: "code" | "markdown"; output?: string; image?: string };
type NotebookData = { id: number; name: string; cells: CellData[] };

export default function NotebookManager() {
 const [notebooks, setNotebooks] = useState<NotebookData[]>([
  { id: 1, name: "Notebook 1", cells: [{ id: 1, code: "", type: "code", output: "", image: undefined }] },
]);
  const [activeId, setActiveId] = useState(1);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
  const saved = localStorage.getItem("notebooks");
  if (saved) {
    const parsed = JSON.parse(saved);
    console.log("LOADED FROM STORAGE:", parsed);
    setNotebooks(parsed);
  }
  setLoaded(true);
}, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("notebooks", JSON.stringify(notebooks));
  }, [notebooks, loaded]);

  function addNotebook() {
  const id = Date.now();
  setNotebooks([...notebooks, { id, name: `Notebook ${notebooks.length + 1}`, cells: [{ id: 1, code: "", type: "code", output: "", image: undefined }] }]);
  setActiveId(id);
}

  function updateCells(id: number, cells: CellData[]) {
    setNotebooks(notebooks.map((n) => (n.id === id ? { ...n, cells } : n)));
  }

  function renameNotebook(id: number, name: string) {
    setNotebooks(notebooks.map((n) => (n.id === id ? { ...n, name } : n)));
    setRenamingId(null);
  }

  const active = notebooks.find((n) => n.id === activeId) || notebooks[0];

  return (
    <div>
      <div className="flex gap-2 border-b border-gray-300 dark:border-gray-700 p-2">
        {notebooks.map((n) => (
          <div key={n.id} className="flex items-center">
            {n.id === activeId && renamingId === n.id ? (
              <input
                autoFocus
                defaultValue={n.name}
                onBlur={(e) => renameNotebook(n.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="px-2 py-1 rounded border"
              />
            ) : (
              <button
                onClick={() => setActiveId(n.id)}
                onDoubleClick={() => setRenamingId(n.id)}
                className={`px-3 py-1 rounded ${n.id === activeId ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                {n.name}
              </button>
            )}
          </div>
        ))}
        <button onClick={addNotebook} className="px-2 py-1 bg-gray-200 rounded"><Plus size={16} /></button>
      </div>
      <Notebook cells={active.cells} setCells={(cells) => updateCells(active.id, cells)} notebookName={active.name} />
    </div>
  );
}