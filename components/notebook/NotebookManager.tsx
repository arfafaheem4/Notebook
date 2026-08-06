"use client";
import { useState, useEffect, useRef } from "react";
import Notebook from "./notebook";
import ConfirmDialog from "./ConfirmDialog";
import { saveNotebookToDisk, loadNotebookFromDisk, listNotebooksOnDisk, deleteNotebookFromDisk } from "@/lib/notebookStorage";

type CellData = { id: number; code: string; type: "code" | "markdown"; output?: string; image?: string; html?: string };
type NotebookData = { id: number; name: string; cells: CellData[]; _lastSavedName?: string };

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

  // --- Initial load: disk is source of truth, localStorage is fallback ---
  useEffect(() => {
    (async () => {
      const diskNames = await listNotebooksOnDisk();

      if (diskNames.length > 0) {
        const loaded: NotebookData[] = [];
        for (let i = 0; i < diskNames.length; i++) {
          const name = diskNames[i];
          const cells = await loadNotebookFromDisk(name);
          if (cells) {
            loaded.push({ id: Date.now() + i, name, cells, _lastSavedName: name });
          }
        }
        if (loaded.length > 0) {
          setNotebooks(loaded);
          setActiveId(loaded[0].id);
          setLoaded(true);
          return;
        }
      }

      // Backend unreachable or empty — fall back to localStorage
      try {
        const saved = localStorage.getItem("notebooks");
        if (saved) {
          const parsed = JSON.parse(saved);
          const valid = Array.isArray(parsed) ? parsed.filter((n) => n && n.id && Array.isArray(n.cells)) : [];
          if (valid.length > 0) setNotebooks(valid);
        }
      } catch (err) {
        console.error("Main save corrupted, trying backup:", err);
        try {
          const backup = localStorage.getItem("notebooks_backup");
          if (backup) {
            const parsed = JSON.parse(backup);
            const valid = Array.isArray(parsed) ? parsed.filter((n) => n && n.id && Array.isArray(n.cells)) : [];
            if (valid.length > 0) setNotebooks(valid);
          }
        } catch (backupErr) {
          console.error("Backup also corrupted, starting fresh:", backupErr);
        }
      }
      setLoaded(true);
    })();
  }, []);

  // --- Auto-save: localStorage (fast/offline) + disk (source of truth) ---
  useEffect(() => {
  if (!loaded) return;
  setSaveStatus("saving");
  if (saveTimeout.current) clearTimeout(saveTimeout.current);
  saveTimeout.current = setTimeout(async () => {
    const data = JSON.stringify(notebooks);
    localStorage.setItem("notebooks", data);
    localStorage.setItem("notebooks_backup", data);

    const results = await Promise.all(
      notebooks.map(async (n) => {
        const filename = await saveNotebookToDisk(n.id.toString(), n);
        return filename && filename !== n._lastSavedName ? { ...n, _lastSavedName: filename } : n;
      })
    );

    // Only trigger a state update if a filename actually changed (rare — duplicate renames)
    const changed = results.some((r, i) => r._lastSavedName !== notebooks[i]._lastSavedName);
    if (changed) {
      setNotebooks(results);
    }
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

  async function deleteNotebook(id: number) {
    if (notebooks.length === 1) return;
    const notebook = notebooks.find((n) => n.id === id);
    try {
      await fetch(`http://localhost:8000/kernel/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to shut down kernel for notebook", id, err);
    }
    if (notebook?._lastSavedName) {
      await deleteNotebookFromDisk(notebook._lastSavedName);
    }
    const remaining = notebooks.filter((n) => n.id !== id);
    setNotebooks(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  }

  async function handleOpenFile(file: File) {
    const text = await file.text();
    const id = Date.now();
    let cells: CellData[];

    if (file.name.endsWith(".ipynb")) {
      const parsed = JSON.parse(text);
      cells = parsed.cells.map((c: any, i: number) => ({
        id: Date.now() + i,
        code: Array.isArray(c.source) ? c.source.join("") : c.source,
        type: c.cell_type === "markdown" ? "markdown" : "code",
        output: "",
        image: undefined,
      }));
    } else {
      const parts = text.split("\n\n# ---\n\n");
      cells = parts.map((code, i) => ({
        id: Date.now() + i,
        code,
        type: "code" as const,
        output: "",
        image: undefined,
      }));
    }

    const name = file.name.replace(/\.(ipynb|py)$/, "");
    setNotebooks([...notebooks, { id, name, cells }]);
    setActiveId(id);
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
        onOpenFile={handleOpenFile}
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