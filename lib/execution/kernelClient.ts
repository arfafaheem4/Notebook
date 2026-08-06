const sockets: Map<string, WebSocket> = new Map();
const connecting: Map<string, Promise<WebSocket>> = new Map();
let msgId = 0;
const pending = new Map<number, { onChunk: (text: string, image?: string, html?: string) => void; resolve: (executionCount?: number) => void }>();

function getSocket(notebookId: string): Promise<WebSocket> {
  const existing = sockets.get(notebookId);
  if (existing && existing.readyState === WebSocket.OPEN) return Promise.resolve(existing);

  const inProgress = connecting.get(notebookId);
  if (inProgress) return inProgress;

  const promise = new Promise<WebSocket>((resolve) => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${notebookId}`);
    ws.onopen = () => {
      sockets.set(notebookId, ws);
      connecting.delete(notebookId);
      resolve(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handler = pending.get(data.id);
        if (!handler) return;
        if (data.output || data.image || data.html) handler.onChunk(data.output, data.image, data.html);
        if (data.done) {
          handler.resolve(data.execution_count);
          pending.delete(data.id);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err, event.data);
      }
    };
  });

  connecting.set(notebookId, promise);
  return promise;
}

export async function runPythonCode(
  notebookId: string,
  code: string,
  onChunk: (text: string, image?: string, html?: string) => void
): Promise<number | undefined> {
  const ws = await getSocket(notebookId);
  const id = ++msgId;
  return new Promise<number | undefined>((resolve) => {
    pending.set(id, { onChunk, resolve });
    ws.send(JSON.stringify({ code, id }));
  });
}

export async function stopExecution(notebookId: string) {
  await fetch(`http://localhost:8000/interrupt/${notebookId}`, { method: "POST" });
}

export async function restartKernel(notebookId: string) {
  await fetch(`http://localhost:8000/restart/${notebookId}`, { method: "POST" });
}