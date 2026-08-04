"use client";
import { useState, useEffect } from "react";
import { Upload, FileText, X } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

export default function FileSidebar({ notebookId }: { notebookId: string }) {
  const [files, setFiles] = useState<string[]>([]);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);

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

  return (
    <div className="w-56 shrink-0 border-r border-gray-300 dark:border-gray-700 p-4 min-h-screen overflow-hidden">
      <label className="flex items-center gap-2 cursor-pointer mb-4 px-3 py-2 bg-blue-600 text-white rounded-md w-fit">
        <Upload size={16} /> Upload
        <input type="file" onChange={handleFileUpload} className="hidden" />
      </label>
      {files.map((f) => (
        <div key={f} className="flex items-center justify-between gap-2 text-sm py-1">
          {editingFile === f ? (
            <input
              autoFocus
              defaultValue={f}
              onBlur={(e) => renameFile(f, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="flex-1 min-w-0 px-1 border rounded text-sm"
            />
          ) : (
            <span
              onDoubleClick={() => setEditingFile(f)}
              className="flex items-center gap-1 truncate cursor-pointer"
              title="Double-click to rename"
            >
              <FileText size={14} className="shrink-0" />
              <span className="truncate">{f}</span>
            </span>
          )}
          <button onClick={() => setConfirmTarget(f)} className="shrink-0 text-red-500"><X size={14} /></button>
        </div>
      ))}
      <ConfirmDialog
        open={!!confirmTarget}
        message={`Delete file "${confirmTarget}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}