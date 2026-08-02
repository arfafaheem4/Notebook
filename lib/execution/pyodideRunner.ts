declare global {
  interface Window {
    loadPyodide: any;
  }
}

let pyodideInstance: any = null;

async function loadScript() {
  if (window.loadPyodide) return;
  await new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export async function loadPyodideRunner() {
  if (pyodideInstance) return pyodideInstance;
  await loadScript();
  pyodideInstance = await window.loadPyodide();
  return pyodideInstance;
}

export async function runPythonCode(code: string): Promise<{ text: string; image?: string }> {
  const pyodide = await loadPyodideRunner();
  let captured = "";
  pyodide.setStdout({ batched: (s: string) => (captured += s + "\n") });
  try {
    await pyodide.loadPackagesFromImports(code);
    await pyodide.runPythonAsync(code);
let image;
if (code.includes("plt")) {
  const imgCode = `
import base64, io
buf = io.BytesIO()
plt.savefig(buf, format='png')
buf.seek(0)
base64.b64encode(buf.read()).decode('utf-8')
  `;
  try {
    image = await pyodide.runPythonAsync(imgCode);
    console.log("IMAGE LENGTH:", image?.length);
  } catch (imgError) {
    console.error("IMAGE ERROR:", imgError);
  }
}

    return { text: captured, image };
  } catch (error: any) {
    return { text: `Error: ${error.message}` };
  }
}
export async function uploadFile(file: File) {
  const pyodide = await loadPyodideRunner();
  const buffer = await file.arrayBuffer();
  pyodide.FS.writeFile(file.name, new Uint8Array(buffer));
}