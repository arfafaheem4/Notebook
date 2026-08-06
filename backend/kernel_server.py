from fastapi import FastAPI, WebSocket
from fastapi import UploadFile, File
import os
from jupyter_client import KernelManager
from fastapi.middleware.cors import CORSMiddleware
from queue import Empty
import json
import re
import asyncio

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("notebook-backend")

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

def sanitize_filename(name: str) -> str:
    """Strip characters invalid in Windows/Unix filenames; fall back to a safe default."""
    cleaned = re.sub(r'[\\/:*?"<>|]', "_", name).strip()
    return cleaned or "untitled"

def strip_ansi(text):
    ansi_escape = re.compile(r'\x1b\[[0-9;]*m')
    return ansi_escape.sub('', text)

def drain_iopub(kc):
    while True:
        try:
            msg = kc.get_iopub_msg(timeout=2)
            if msg["msg_type"] == "status" and msg["content"]["execution_state"] == "idle":
                break
        except Empty:
            break

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
kernels = {}

def get_kernel(notebook_id: str):
    if notebook_id not in kernels:
        km = KernelManager()
        km.start_kernel(cwd=os.path.abspath(DATA_DIR))
        kc = km.client()
        kc.start_channels()
        kc.wait_for_ready(timeout=60)
        kc.execute("%matplotlib inline", silent=True)
        kc.get_shell_msg(timeout=30)
        drain_iopub(kc)
        kernels[notebook_id] = {"km": km, "kc": kc}
        logger.info(f"Started new kernel for notebook {notebook_id}")
    return kernels[notebook_id]

@app.websocket("/ws/{notebook_id}")
async def websocket_endpoint(websocket: WebSocket, notebook_id: str):
    await websocket.accept()
    get_kernel(notebook_id)  # ensure kernel exists
    while True:
        raw = await websocket.receive_text()
        data = json.loads(raw)
        code = data["code"]
        req_id = data["id"]

        kc = kernels[notebook_id]["kc"]  # always get the current kernel client
        msg_id = kc.execute(code)
        shell_reply_task = asyncio.create_task(asyncio.to_thread(kc.get_shell_msg, timeout=30))
        execution_count = None
        while True:
            try:
                msg = await asyncio.to_thread(kc.get_iopub_msg, timeout=30)
            except Empty:
                await websocket.send_text(json.dumps({"id": req_id, "output": "\n[Timed out]", "image": None, "done": True}))
                break

            if msg["parent_header"].get("msg_id") != msg_id:
                continue  # not our message — belongs to a stray/old request, ignore it

            msg_type = msg["msg_type"]
            content = msg["content"]
            if msg_type == "stream":
                await websocket.send_text(json.dumps({"id": req_id, "output": content["text"], "image": None, "done": False}))
            elif msg_type == "error":
                await websocket.send_text(json.dumps({"id": req_id, "output": strip_ansi("\n".join(content["traceback"])), "image": None, "done": False}))
            elif msg_type == "execute_result":
                await websocket.send_text(json.dumps({"id": req_id, "output": content["data"].get("text/plain", ""), "html": content["data"].get("text/html"), "image": None, "done": False}))
            elif msg_type == "display_data":
                img = content["data"].get("image/png")
                txt = "" if img else content["data"].get("text/plain", "")
                await websocket.send_text(json.dumps({"id": req_id, "output": txt, "html": content["data"].get("text/html"), "image": img, "done": False}))
            elif msg_type == "execute_input":
                execution_count = content.get("execution_count")
            elif msg_type == "status" and content["execution_state"] == "idle":
                try:
                    shell_reply = await shell_reply_task
                    shell_execution_count = shell_reply["content"].get("execution_count")
                    if shell_execution_count is not None:
                        execution_count = shell_execution_count
                except Empty:
                    pass
                await websocket.send_text(json.dumps({"id": req_id, "output": "", "image": None, "done": True, "execution_count": execution_count}))
                break

@app.post("/interrupt/{notebook_id}")
async def interrupt_kernel(notebook_id: str):
    kernel = get_kernel(notebook_id)
    kernel["km"].interrupt_kernel()
    logger.info(f"Interrupted kernel for notebook {notebook_id}")
    return {"status": "interrupted"}

@app.post("/restart/{notebook_id}")
async def restart_kernel(notebook_id: str):
    kernel = get_kernel(notebook_id)
    km = kernel["km"]
    await asyncio.to_thread(km.restart_kernel)
    old_kc = kernels[notebook_id]["kc"]
    old_kc.stop_channels()
    kc = km.client()
    kc.start_channels()
    await asyncio.to_thread(kc.wait_for_ready, timeout=60)
    kc.execute("%matplotlib inline", silent=True)
    await asyncio.to_thread(kc.get_shell_msg, timeout=30)
    await asyncio.to_thread(drain_iopub, kc)
    kernels[notebook_id]["kc"] = kc
    logger.info(f"Restarted kernel for notebook {notebook_id}")
    return {"status": "restarted"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    path = os.path.join(DATA_DIR, file.filename)
    with open(path, "wb") as f:
        f.write(await file.read())
    logger.info(f"Uploaded file {file.filename} to shared data folder")
    return {"status": "uploaded", "filename": file.filename}

@app.get("/files")
async def list_files():
    return {"files": os.listdir(DATA_DIR)}

@app.put("/files/{filename}")
async def rename_file(filename: str, new_name: str):
    old_path = os.path.join(DATA_DIR, filename)
    new_path = os.path.join(DATA_DIR, sanitize_filename(new_name))
    if os.path.exists(old_path):
        os.rename(old_path, new_path)
        logger.info(f"Renamed file {filename} to {new_name}")
    else:
        logger.warning(f"Attempted to rename non-existent file {filename}")
    return {"status": "renamed"}

@app.delete("/files/{filename}")
async def delete_file(filename: str):
    path = os.path.join(DATA_DIR, filename)
    if os.path.exists(path):
        os.remove(path)
        logger.info(f"Deleted file {filename}")
    else:
        logger.warning(f"Attempted to delete non-existent file {filename}")
    return {"status": "deleted"}

@app.delete("/kernel/{notebook_id}")
async def shutdown_kernel(notebook_id: str):
    kernel = kernels.pop(notebook_id, None)
    if kernel:
        kernel["kc"].stop_channels()
        kernel["km"].shutdown_kernel(now=True)
        logger.info(f"Shut down kernel for notebook {notebook_id}")
    else:
        logger.warning(f"Attempted to shut down non-existent kernel for notebook {notebook_id}")
    return {"status": "shutdown"}

NOTEBOOKS_DIR = "notebooks"
os.makedirs(NOTEBOOKS_DIR, exist_ok=True)

@app.post("/notebooks/{notebook_id}")
async def save_notebook(notebook_id: str, notebook: dict):
    base_name = sanitize_filename(notebook.get("name", notebook_id))
    name = base_name
    path = os.path.join(NOTEBOOKS_DIR, f"{name}.ipynb")

    # Only auto-append if this save isn't just re-saving the same notebook under its existing name
    existing_id_for_name = notebook.get("_lastSavedName")
    if existing_id_for_name != base_name and os.path.exists(path):
        counter = 1
        while os.path.exists(os.path.join(NOTEBOOKS_DIR, f"{base_name} ({counter}).ipynb")):
            counter += 1
        name = f"{base_name} ({counter})"
        path = os.path.join(NOTEBOOKS_DIR, f"{name}.ipynb")

    ipynb = {
        "cells": [
            {
                "cell_type": c.get("type", "code"),
                "source": c.get("code", "").split("\n"),
                "metadata": {},
                "execution_count": None,
                "outputs": [],
            }
            for c in notebook.get("cells", [])
        ],
        "metadata": {"kernelspec": {"name": "python3", "display_name": "Python 3"}},
        "nbformat": 4,
        "nbformat_minor": 5,
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(ipynb, f, ensure_ascii=False, indent=2)
    logger.info(f"Saved notebook '{name}' to {path}")
    return {"status": "saved", "filename": name}

@app.get("/notebooks/{name}")
async def load_notebook(name: str):
    path = os.path.join(NOTEBOOKS_DIR, f"{sanitize_filename(name)}.ipynb")
    if not os.path.exists(path):
        return {"found": False}
    with open(path, "r", encoding="utf-8") as f:
        ipynb = json.load(f)
    cells = [
        {
            "id": i,
            "code": "".join(c["source"]) if isinstance(c["source"], list) else c["source"],
            "type": c.get("cell_type", "code"),
            "output": "",
        }
        for i, c in enumerate(ipynb.get("cells", []))
    ]
    return {"found": True, "cells": cells}

@app.get("/notebooks")
async def list_notebooks():
    files = [f for f in os.listdir(NOTEBOOKS_DIR) if f.endswith(".ipynb")]
    return {"notebooks": [f.replace(".ipynb", "") for f in files]}

@app.put("/notebooks/rename")
async def rename_notebook_file(old_name: str, new_name: str):
    old_path = os.path.join(NOTEBOOKS_DIR, f"{sanitize_filename(old_name)}.ipynb")
    new_path = os.path.join(NOTEBOOKS_DIR, f"{sanitize_filename(new_name)}.ipynb")
    if os.path.exists(old_path):
        os.rename(old_path, new_path)
        logger.info(f"Renamed notebook file '{old_name}' to '{new_name}'")
    else:
        logger.warning(f"Attempted to rename non-existent notebook file '{old_name}'")
    return {"status": "renamed"}

@app.delete("/notebooks/{name}")
async def delete_notebook_file(name: str):
    path = os.path.join(NOTEBOOKS_DIR, f"{sanitize_filename(name)}.ipynb")
    if os.path.exists(path):
        os.remove(path)
        logger.info(f"Deleted notebook file '{name}'")
    return {"status": "deleted"}

@app.get("/workspace")
async def get_workspace():
    return {"path": os.path.abspath(NOTEBOOKS_DIR)}