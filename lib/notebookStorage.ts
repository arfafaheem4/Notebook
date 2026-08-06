export async function saveNotebookToDisk(notebookId: string, notebook: { name: string; cells: unknown[]; _lastSavedName?: string }): Promise<string | null> {
  try {
    const res = await fetch(`http://localhost:8000/notebooks/${notebookId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notebook),
    });
    const data = await res.json();
    return data.filename || null;
  } catch (err) {
    console.error("Failed to save notebook to disk:", err);
    return null;
  }
}

export async function loadNotebookFromDisk(name: string) {
  try {
    const res = await fetch(`http://localhost:8000/notebooks/${encodeURIComponent(name)}`);
    const data = await res.json();
    return data.found ? data.cells : null;
  } catch {
    return null;
  }
}

export async function listNotebooksOnDisk(): Promise<string[]> {
  try {
    const res = await fetch(`http://localhost:8000/notebooks`);
    const data = await res.json();
    return data.notebooks || [];
  } catch {
    return [];
  }
}

export async function deleteNotebookFromDisk(name: string) {
  try {
    await fetch(`http://localhost:8000/notebooks/${encodeURIComponent(name)}`, { method: "DELETE" });
  } catch (err) {
    console.error("Failed to delete notebook file:", err);
  }
}
export async function getWorkspacePath(): Promise<string | null> {
  try {
    const res = await fetch("http://localhost:8000/workspace");
    const data = await res.json();
    return data.path || null;
  } catch {
    return null;
  }
}