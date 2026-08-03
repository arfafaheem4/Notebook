"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Play, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { marked } from "marked";
import { runPythonCode } from "@/lib/execution/pyodideRunner";


const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Props = {
  id: number;
  code: string;
  type: "code" | "markdown";
  output?: string;
  image?: string;
  onChange: (code: string) => void;
  onRunComplete: (output: string, image?: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export default function Cell({ id, code, type, output: savedOutput, image: savedImage, onChange, onRunComplete, onDelete, onDuplicate, onMoveUp, onMoveDown }: Props) {
  const [output, setOutput] = useState<{ text: string; image?: string }>({ text: savedOutput || "", image: savedImage });
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState(type === "markdown");
  const editorRef = useRef<any>(null);

  useEffect(() => {
  setOutput({ text: savedOutput || "", image: savedImage });
}, [savedOutput, savedImage]);

  function handleMount(editor: any) {
    editorRef.current = editor;
    setTimeout(() => editor.layout(), 100);
  }

  async function handleRun() {
    if (type === "markdown") { setPreview(true); return; }
    setRunning(true);
    const result = await runPythonCode(code);
    setOutput(result);
    onRunComplete(result.text, result.image);
    setRunning(false);
  }

  if (type === "markdown" && preview) {
    return (
      <div className="border border-gray-300 rounded-xl p-4" onDoubleClick={() => setPreview(false)}>
        <div dangerouslySetInnerHTML={{ __html: marked(code || "*Empty markdown cell — double-click to edit*") }} />
        <div className="flex gap-2">
          <button onClick={onMoveUp} className="p-2 bg-gray-300 rounded-md"><ArrowUp size={16} /></button>
          <button onClick={onMoveDown} className="p-2 bg-gray-300 rounded-md"><ArrowDown size={16} /></button>
          <button onClick={onDuplicate} className="p-2 bg-gray-300 rounded-md"><Copy size={16} /></button>
          <button onClick={onDelete} className="p-2 bg-red-500 text-white rounded-md"><Trash2 size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }} className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
      <Editor
        path={`cell-${id}`}
        height="150px"
        width="100%"
        language={type === "markdown" ? "markdown" : "python"}
        value={code}
        onChange={(v) => onChange(v || "")}
        onMount={handleMount}
        options={{ automaticLayout: true }}
      />
      <div className="flex justify-between items-center bg-gray-50 px-4 py-2">
        <button onClick={handleRun} disabled={running} className="p-2 bg-green-600 text-white rounded-md disabled:opacity-50">
          <Play size={16} />
        </button>
        <div className="flex gap-2">
          <button onClick={onMoveUp} className="p-2 bg-gray-300 rounded-md"><ArrowUp size={16} /></button>
          <button onClick={onMoveDown} className="p-2 bg-gray-300 rounded-md"><ArrowDown size={16} /></button>
          <button onClick={onDuplicate} className="p-2 bg-gray-300 rounded-md"><Copy size={16} /></button>
          <button onClick={onDelete} className="p-2 bg-red-500 text-white rounded-md"><Trash2 size={16} /></button>
        </div>
      </div>
      {output.text && <pre className="bg-black text-green-400 text-sm p-3 whitespace-pre-wrap">{output.text}</pre>}
      {output.image && <img src={`data:image/png;base64,${output.image}`} className="p-3" />}
    </div>
  );
}