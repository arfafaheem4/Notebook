"use client";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Play, Trash2, Copy } from "lucide-react";
import { runPythonCode } from "@/lib/execution/pyodideRunner";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Props = {
  code: string;
  onChange: (code: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
};

export default function Cell({ code, onChange, onDelete, onDuplicate }: Props) {
  const [output, setOutput] = useState<{ text: string; image?: string }>({ text: "" });
  const [running, setRunning] = useState(false);
  const editorRef = useRef<any>(null);

  function handleMount(editor: any) {
    editorRef.current = editor;
    setTimeout(() => editor.layout(), 100);
  }

  async function handleRun() {
    setRunning(true);
    const result = await runPythonCode(code);
    setOutput(result);
    setRunning(false);
  }

  return (
    <div style={{ width: "100%" }} className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
      <Editor
        height="150px"
        width="100%"
        language="python"
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
          <button onClick={onDuplicate} className="p-2 bg-gray-300 rounded-md">
            <Copy size={16} />
          </button>
          <button onClick={onDelete} className="p-2 bg-red-500 text-white rounded-md">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {output.text && <pre className="bg-black text-green-400 text-sm p-3 whitespace-pre-wrap">{output.text}</pre>}
      {output.image && <img src={`data:image/png;base64,${output.image}`} className="p-3" />}
    </div>
  );
}