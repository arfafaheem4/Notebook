"use client";
import { useState, useEffect } from "react";
import { Upload, FileText, X, Search, Plus, Pencil, Trash2 } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

type NotebookItem = { id: number; name: string };

type Props = {
  notebookId: string;
  notebooks: NotebookItem[];
  activeId: number;
  renamingId: number | null;
  onAddNotebook: () => void;
  onSelectNotebook: (id: number) => void;
  onStartRenaming: (id: number | null) => void;
  onRenameNotebook: (id: number, name: string) => void;
  onDeleteNotebook: (id: number) => void;
};

export default function FileSidebar({ notebookId, notebooks, activeId, renamingId, onAddNotebook, onSelectNotebook, onStartRenaming, onRenameNotebook, onDeleteNotebook }: Props) {
  const [files, setFiles] = useState<string[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAllNotebooks, setShowAllNotebooks] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);

  async function loadFiles() {
  try {
    const res = await fetch(`http://localhost:8000/files/${notebookId}`);
    const data = await res.json();
    setFiles(data.files);
  } catch {
    setFiles([]);
  }
}

  useEffect(() => {
    loadFiles();
  }, [notebookId]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`http://localhost:8000/upload/${notebookId}`, { method: "POST", body: formData });
    loadFiles();
  } catch {
    // backend down — banner in notebook.tsx already shows this
  }
}

 async function confirmDelete() {
  if (!confirmTarget) return;
  try {
    const res = await fetch(`http://localhost:8000/files/${notebookId}/${encodeURIComponent(confirmTarget)}`, { method: "DELETE" });
    console.log("delete status:", res.status, await res.text());
  } catch (err) {
    console.error("delete failed:", err);
  }
  setConfirmTarget(null);
  loadFiles();
}

  async function renameFile(oldName: string, newName: string) {
  setEditingFile(null);
  if (!newName || newName === oldName) return;
  try {
    await fetch(`http://localhost:8000/files/${notebookId}/${oldName}?new_name=${encodeURIComponent(newName)}`, { method: "PUT" });
  } catch {
    // backend down — top banner already covers this
  }
  loadFiles();
}

  const filteredNotebooks = notebooks.filter((notebook) => notebook.name.toLowerCase().includes(search.toLowerCase()));
  const visibleNotebooks = filteredNotebooks.slice(0, 2);
  const visibleFiles = files.slice(0, 2);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col overflow-hidden border-r border-slate-200 bg-white px-3 py-4 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <button onClick={onAddNotebook} className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
        <Plus size={17} />
        New Notebook
      </button>

      <div className="relative mb-5">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          aria-label="Search notebooks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notebooks..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-800"
        />
      </div>

      <section className="shrink-0">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recent notebooks</p>
          <span className="text-xs text-slate-400">{filteredNotebooks.length}</span>
        </div>
        <div className="space-y-1">
          {visibleNotebooks.map((notebook) => (
            <div
              key={notebook.id}
              onClick={() => onSelectNotebook(notebook.id)}
              className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                notebook.id === activeId
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <FileText size={15} className="shrink-0" />
              {renamingId === notebook.id ? (
                <input
                  autoFocus
                  defaultValue={notebook.name}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => onRenameNotebook(notebook.id, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="min-w-0 flex-1 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-slate-700 outline-none focus:border-blue-500 dark:border-blue-700 dark:bg-slate-900 dark:text-slate-100"
                />
              ) : (
                <span className="min-w-0 flex-1 truncate" title={notebook.name}>{notebook.name}</span>
              )}
              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={(e) => { e.stopPropagation(); onStartRenaming(notebook.id); }} className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:bg-white hover:text-blue-600 dark:hover:bg-slate-700"><Pencil size={13} /></button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteNotebook(notebook.id); }} className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:bg-white hover:text-red-600 dark:hover:bg-slate-700"><X size={14} /></button>
              </div>
            </div>
          ))}
          {filteredNotebooks.length === 0 && <p className="px-3 py-4 text-center text-xs text-slate-400">No notebooks found</p>}
        </div>
        <button onClick={() => setShowAllNotebooks(true)} className="mt-2 w-full rounded-lg px-2 py-2 text-left text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40">
          Show all notebooks
        </button>
      </section>

      <section className="mt-5 flex min-h-0 flex-1 flex-col border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Files</p>
        <label className="mb-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          <Upload size={15} /> Upload file
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {visibleFiles.map((f) => (
            <div key={f} className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
              {editingFile === f ? (
                <input
                  autoFocus
                  defaultValue={f}
                  onBlur={(e) => renameFile(f, e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900"
                />
              ) : (
                <span
                  onDoubleClick={() => setEditingFile(f)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 truncate text-xs text-slate-600 dark:text-slate-300"
                  title="Double-click to rename"
                >
                  <FileText size={14} className="shrink-0 text-slate-400" />
                  <span className="truncate">{f}</span>
                </span>
              )}
              <button onClick={() => setConfirmTarget(f)} className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-400 opacity-0 transition hover:bg-white hover:text-red-500 group-hover:opacity-100 dark:hover:bg-slate-700"><X size={14} /></button>
            </div>
          ))}
        </div>
        <button onClick={() => setShowAllFiles(true)} className="mt-2 w-full shrink-0 rounded-lg px-2 py-2 text-left text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40">
          Show all files
        </button>
      </section>

      <div className="mt-3 shrink-0 space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-400"><Trash2 size={16} />Trash <span className="ml-auto text-xs">0</span></div>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        message={`Delete file "${confirmTarget}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />

      {showAllNotebooks && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="All notebooks">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">All notebooks</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Select a notebook to open it.</p>
              </div>
              <button onClick={() => setShowAllNotebooks(false)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"><X size={17} /></button>
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto p-3">
              {notebooks.map((notebook) => (
                <button
                  key={notebook.id}
                  onClick={() => { onSelectNotebook(notebook.id); setShowAllNotebooks(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    notebook.id === activeId
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <FileText size={16} className="shrink-0" />
                  <span className="truncate">{notebook.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAllFiles && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="All files">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">All files</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Manage files for this notebook.</p>
              </div>
              <button onClick={() => setShowAllFiles(false)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"><X size={17} /></button>
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto p-3">
              {files.map((f) => (
                <div key={f} className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                  {editingFile === f ? (
                    <input
                      autoFocus
                      defaultValue={f}
                      onBlur={(e) => renameFile(f, e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900"
                    />
                  ) : (
                    <span onDoubleClick={() => setEditingFile(f)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 truncate text-slate-700 dark:text-slate-200" title="Double-click to rename">
                      <FileText size={15} className="shrink-0 text-slate-400" />
                      <span className="truncate">{f}</span>
                    </span>
                  )}
                  <button onClick={() => setConfirmTarget(f)} className="grid h-7 w-7 shrink-0 place-items-center rounded text-slate-400 transition hover:bg-white hover:text-red-500 dark:hover:bg-slate-700"><X size={14} /></button>
                </div>
              ))}
              {files.length === 0 && <p className="px-3 py-6 text-center text-xs text-slate-400">No files uploaded yet</p>}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
