"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { marked } from "marked";
import { useTheme } from "next-themes";
import { runPythonCode, stopExecution } from "@/lib/execution/kernelClient";
import { Play, Square, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Props = {
  notebookId: string;
  id: number;
  code: string;
  type: "code" | "markdown";
  output?: string;
  image?: string;
  html?: string;
  executionCountReset: number;
  onChange: (code: string) => void;
  onRunComplete: (output: string, image?: string, html?: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export default function Cell({ notebookId, id, code, type, output: savedOutput, image: savedImage, html: savedHtml, executionCountReset, onChange, onRunComplete, onDelete, onDuplicate, onMoveUp, onMoveDown }: Props) {

  const { resolvedTheme } = useTheme();
  const [output, setOutput] = useState<{ text: string; image?: string; html?: string }>({ text: savedOutput || "", image: savedImage, html: savedHtml });
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState(type === "markdown");
  const [executionCount, setExecutionCount] = useState<number | null>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setOutput({ text: savedOutput || "", image: savedImage, html: savedHtml });
  }, [savedOutput, savedImage, savedHtml]);

  useEffect(() => {
    setExecutionCount(null);
  }, [executionCountReset]);

  function handleMount(editor: any) {
    editorRef.current = editor;
    setTimeout(() => editor.layout(), 100);
  }

  async function handleRun() {
    if (type === "markdown") { setPreview(true); return; }
    setRunning(true);
    let text = "";
    let image: string | undefined;
    let html: string | undefined;
    const currentCode = editorRef.current?.getValue() ?? code;
    const completedExecutionCount = await runPythonCode(notebookId, currentCode, (chunk, img, htmlChunk) => {
      text += chunk;
      if (img) image = img;
      if (htmlChunk) html = htmlChunk;
      setOutput({ text, image, html });
    });
    setExecutionCount(completedExecutionCount ?? null);
    onRunComplete(text, image, html);
    setRunning(false);
  }

  if (type === "markdown" && preview) {
    return (
      <div className="flex items-start gap-3">
        <span className="w-7 shrink-0 pt-3 text-right font-mono text-sm font-medium text-slate-400 dark:text-slate-500">[{executionCount ?? " "}]</span>
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" onDoubleClick={() => setPreview(false)}>
          <div className="flex items-center justify-end gap-1 border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
            <button onClick={onMoveUp} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"><ArrowUp size={15} /></button>
            <button onClick={onMoveDown} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"><ArrowDown size={15} /></button>
            <button onClick={onDuplicate} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"><Copy size={15} /></button>
            <button onClick={onDelete} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"><Trash2 size={15} /></button>
          </div>
          <div className="prose prose-sm max-w-none px-5 py-4 text-slate-700 dark:prose-invert dark:text-slate-200" dangerouslySetInnerHTML={{ __html: marked(code || "*Empty markdown cell — double-click to edit*") as string }}/>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-start gap-3">
      <span className="w-7 shrink-0 pt-3 text-right font-mono text-sm font-medium text-slate-400 dark:text-slate-500">[{executionCount ?? " "}]</span>
      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {type === "markdown" ? "Markdown" : "Python"}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleRun} disabled={running} className="grid h-7 w-8 place-items-center rounded-md bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">
              <Play size={14} fill="currentColor" />
            </button>
            {running && (
              <button onClick={() => stopExecution(notebookId)} className="grid h-7 w-7 place-items-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600">
                <Square size={13} fill="currentColor" />
              </button>
            )}
            <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <button onClick={onMoveUp} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"><ArrowUp size={15} /></button>
            <button onClick={onMoveDown} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"><ArrowDown size={15} /></button>
            <button onClick={onDuplicate} className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"><Copy size={15} /></button>
            <button onClick={onDelete} className="grid h-7 w-7 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"><Trash2 size={15} /></button>
          </div>
        </div>
        <Editor
          path={`cell-${id}`}
          height="150px"
          width="100%"
          language={type === "markdown" ? "markdown" : "python"}
          value={code}
          onChange={(v) => onChange(v || "")}
          onMount={handleMount}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          options={{ automaticLayout: true }}
        />
        {output.html ? (
          <div
            className="dataframe-output mx-3 mb-3 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "11px", lineHeight: "1.2" }}
          >
            <style>{`
              .dataframe-output table {
                width: 100% !important;
                border-collapse: collapse !important;
                border-spacing: 0 !important;
                font-family: Arial, Helvetica, sans-serif !important;
                font-size: 11px !important;
                line-height: 1.2 !important;
                color: #334155 !important;
              }
              .dataframe-output table th,
              .dataframe-output table td {
                border: 1px solid #e2e8f0 !important;
                padding: 4px 7px !important;
                white-space: nowrap !important;
              }
              .dataframe-output table thead th {
                background: #f8fafc !important;
                color: #475569 !important;
                font-size: 10px !important;
                font-weight: 600 !important;
              }
              .dataframe-output table tbody th {
                background: #f8fafc !important;
                color: #64748b !important;
                font-size: 10px !important;
                font-weight: 500 !important;
                text-align: right !important;
              }
              .dark .dataframe-output table { color: #e2e8f0 !important; }
              .dark .dataframe-output table th,
              .dark .dataframe-output table td { border-color: #475569 !important; }
              .dark .dataframe-output table thead th,
              .dark .dataframe-output table tbody th { background: #334155 !important; color: #e2e8f0 !important; }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: output.html }} />
          </div>
        ) : output.text && <pre className="mx-3 mb-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-[13px] leading-7 tabular-nums text-slate-800 whitespace-pre dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{output.text}</pre>}
        {output.image && <img src={`data:image/png;base64,${output.image}`} className="border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900" />}
      </div>
    </div>
  );
}
