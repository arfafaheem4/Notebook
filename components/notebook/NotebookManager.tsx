"use client";
import { useState, useEffect, useRef } from "react";
import Notebook from "./notebook";
import ConfirmDialog from "./ConfirmDialog";

type CellData = { id: number; code: string; type: "code" | "markdown"; output?: string; image?: string; html?: string };
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
      <Notebook
        notebookId={active.id.toString()}
        cells={active.cells}
        setCells={(cells) => updateCells(active.id, cells)}
        notebookName={active.name}
        saveStatus={saveStatus}
        onForceSave={forceSave}
        notebooks={notebooks}
        activeId={activeId}
        renamingId={renamingId}
        onAddNotebook={addNotebook}
        onSelectNotebook={setActiveId}
        onStartRenaming={setRenamingId}
        onRenameNotebook={renameNotebook}
        onDeleteNotebook={setConfirmTarget}
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
