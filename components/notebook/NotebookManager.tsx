"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import Notebook from "./notebook";
import ConfirmDialog from "./ConfirmDialog";
import DownloadMenu from "./DownloadMenu";
import ShareButton from "./ShareButton";

type CellData = { id: number; code: string; type: "code" | "markdown"; output?: string; image?: string };
type NotebookData = { id: number; name: string; cells: CellData[] };

export default function NotebookManager() {
  const [notebooks, setNotebooks] = useState<NotebookData[]>([
    { id: 1, name: "Notebook 1", cells: [{ id: 1, code: "", type: "code", output: "", image: undefined }] },
  ]);
  const [activeId, setActiveId] = useState(1);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [confirmTarget, setConfirmTarget] = useState<number | null>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const notebooksRef = useRef(notebooks);
  notebooksRef.current = notebooks;

  useEffect(() => {
    const saved = localStorage.getItem("notebooks");
    if (saved) setNotebooks(JSON.parse(saved));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      localStorage.setItem("notebooks", JSON.stringify(notebooks));
      setSaveStatus("saved");
    }, 500);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [notebooks, loaded]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        localStorage.setItem("notebooks", JSON.stringify(notebooksRef.current));
        setSaveStatus("saved");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function forceSave() {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    localStorage.setItem("notebooks", JSON.stringify(notebooks));
    setSaveStatus("saved");
  }

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

  function deleteNotebook(id: number) {
    if (notebooks.length === 1) return;
    const remaining = notebooks.filter((n) => n.id !== id);
    setNotebooks(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  }

  const active = notebooks.find((n) => n.id === activeId) || notebooks[0];

  return (
    <div>
      <div className="flex items-center justify-between border-b border-gray-300 dark:border-gray-700 bg-background px-2 py-2">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          {notebooks.map((n) => (
            <div key={n.id}>
              {n.id === activeId && renamingId === n.id ? (
                <input
                  autoFocus
                  defaultValue={n.name}
                  onBlur={(e) => renameNotebook(n.id, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="px-3 py-1.5 rounded-md border text-sm"
                />
              ) : (
                <div
                  onClick={() => setActiveId(n.id)}
                  onDoubleClick={() => setRenamingId(n.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
                    n.id === activeId
                      ? "bg-gray-800 dark:bg-gray-700 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {n.name}
                  <X
                    size={14}
                    onClick={(e) => { e.stopPropagation(); setConfirmTarget(n.id); }}
                    className="hover:opacity-70"
                  />
                </div>
              )}
            </div>
          ))}
          <button onClick={addNotebook} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Plus size={16} />
          </button>
        </div>

        {/* Download + Share */}
        <div className="flex items-center gap-2">
          <ShareButton cells={active.cells} notebookName={active.name} />
        </div>
      </div>

      <Notebook
  notebookId={active.id.toString()}
  cells={active.cells}
  setCells={(cells) => updateCells(active.id, cells)}
  notebookName={active.name}
  saveStatus={saveStatus}
  onForceSave={forceSave}
/>

      <ConfirmDialog
        open={confirmTarget !== null}
        message="Delete this notebook? This cannot be undone."
        onConfirm={() => { if (confirmTarget !== null) deleteNotebook(confirmTarget); setConfirmTarget(null); }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}