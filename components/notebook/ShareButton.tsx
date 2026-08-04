"use client";
import { useState } from "react";
import { Share2, Check } from "lucide-react";

type CellData = { code: string; type: "code" | "markdown" };

function copyText(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function ShareButton({ cells, notebookName }: { cells: CellData[]; notebookName: string }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const notebook = {
      cells: cells.map((c) => ({ cell_type: c.type, source: c.code.split("\n"), metadata: {}, outputs: [], execution_count: null })),
      metadata: {}, nbformat: 4, nbformat_minor: 5,
    };
    copyText(JSON.stringify(notebook, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button onClick={handleShare} className="flex items-center gap-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm">
      {copied ? <Check size={14} /> : <Share2 size={14} />}
    </button>
  );
}