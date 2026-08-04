const sockets: Map<string, WebSocket> = new Map();
const connecting: Map<string, Promise<WebSocket>> = new Map();
let msgId = 0;
const pending = new Map<number, { onChunk: (text: string, image?: string) => void; resolve: () => void }>();

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
      const data = JSON.parse(event.data);
      const handler = pending.get(data.id);
      if (!handler) return;
      if (data.output || data.image) handler.onChunk(data.output, data.image);
      if (data.done) {
        handler.resolve();
        pending.delete(data.id);
      }
    };
  });

  connecting.set(notebookId, promise);
  return promise;
}

export async function runPythonCode(
  notebookId: string,
  code: string,
  onChunk: (text: string, image?: string) => void
): Promise<void> {
  const ws = await getSocket(notebookId);
  const id = ++msgId;
  return new Promise((resolve) => {
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