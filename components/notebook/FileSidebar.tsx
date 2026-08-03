"use client";
import { useState, useEffect } from "react";
import { Upload, FileText, X } from "lucide-react";
import { uploadFile, deleteFile } from "@/lib/execution/pyodideRunner";
import { get, set, del } from "idb-keyval";


export default function FileSidebar() {
  const [files, setFiles] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const saved = (await get("uploadedFiles")) || [];
      for (const name of saved) {
        const buffer = await get(`file:${name}`);
        if (buffer) await uploadFile(new File([buffer], name));
      }
      setFiles(saved);
    })();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    const buffer = await file.arrayBuffer();
    await set(`file:${file.name}`, buffer);
    const updated = [...files, file.name];
    setFiles(updated);
    await set("uploadedFiles", updated);
  }

 async function removeFile(name: string) {
  await deleteFile(name);
  const updated = files.filter((f) => f !== name);
  setFiles(updated);
  await set("uploadedFiles", updated);
  await del(`file:${name}`);
}

  async function renameFile(oldName: string, newName: string) {
    if (!newName || newName === oldName) { setRenaming(null); return; }
    const buffer = await get(`file:${oldName}`);
    await set(`file:${newName}`, buffer);
    await del(`file:${oldName}`);
    await uploadFile(new File([buffer], newName));
    const updated = files.map((f) => (f === oldName ? newName : f));
    setFiles(updated);
    await set("uploadedFiles", updated);
    setRenaming(null);
  }

  return (
    <div className="w-56 shrink-0 border-r border-gray-300 dark:border-gray-700 p-4 min-h-screen overflow-hidden">
      <label className="flex items-center gap-2 cursor-pointer mb-4 px-3 py-2 bg-blue-600 text-white rounded-md w-fit">
        <Upload size={16} /> Upload
        <input type="file" onChange={handleFileUpload} className="hidden" />
      </label>
      {files.map((f) => (
        <div key={f} className="flex items-center justify-between gap-2 text-sm py-1">
          {renaming === f ? (
            <input
              autoFocus
              defaultValue={f}
              onBlur={(e) => renameFile(f, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="text-xs px-1 rounded border w-full"
            />
          ) : (
            <span
              className="flex items-center gap-1 truncate cursor-pointer"
              onDoubleClick={() => setRenaming(f)}
            >
              <FileText size={14} className="shrink-0" />
              <span className="truncate">{f}</span>
            </span>
          )}
          <button onClick={() => removeFile(f)} className="shrink-0 text-red-500"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}