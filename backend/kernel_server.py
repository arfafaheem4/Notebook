from fastapi import FastAPI, WebSocket
from fastapi import UploadFile, File
import os
from jupyter_client import KernelManager
from fastapi.middleware.cors import CORSMiddleware
from queue import Empty
import json
import re
import asyncio

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

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
        folder = os.path.join(UPLOAD_DIR, notebook_id)
        os.makedirs(folder, exist_ok=True)
        km = KernelManager()
        km.start_kernel(cwd=os.path.abspath(folder))
        kc = km.client()
        kc.start_channels()
        kc.wait_for_ready(timeout=60)
        kc.execute("%matplotlib inline")
        kc.get_shell_msg(timeout=30)
        drain_iopub(kc)
        kernels[notebook_id] = {"km": km, "kc": kc}
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
        kc.execute(code)
        while True:
            try:
                msg = await asyncio.to_thread(kc.get_iopub_msg, timeout=30)
            except Empty:
                await websocket.send_text(json.dumps({"id": req_id, "output": "\n[Timed out]", "image": None, "done": True}))
                break
            msg_type = msg["msg_type"]
            content = msg["content"]
            if msg_type == "stream":
                await websocket.send_text(json.dumps({"id": req_id, "output": content["text"], "image": None, "done": False}))
            elif msg_type == "error":
                await websocket.send_text(json.dumps({"id": req_id, "output": strip_ansi("\n".join(content["traceback"])), "image": None, "done": False}))
            elif msg_type == "execute_result":
                await websocket.send_text(json.dumps({"id": req_id, "output": content["data"].get("text/plain", ""), "image": None, "done": False}))
            elif msg_type == "display_data":
                img = content["data"].get("image/png")
                txt = "" if img else content["data"].get("text/plain", "")
                await websocket.send_text(json.dumps({"id": req_id, "output": txt, "image": img, "done": False}))
            elif msg_type == "status" and content["execution_state"] == "idle":
                await websocket.send_text(json.dumps({"id": req_id, "output": "", "image": None, "done": True}))
                break

@app.post("/interrupt/{notebook_id}")
async def interrupt_kernel(notebook_id: str):
    kernel = get_kernel(notebook_id)
    kernel["km"].interrupt_kernel()
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
    kc.execute("%matplotlib inline")
    await asyncio.to_thread(kc.get_shell_msg, timeout=30)
    await asyncio.to_thread(drain_iopub, kc)
    kernels[notebook_id]["kc"] = kc
    return {"status": "restarted"}

@app.post("/upload/{notebook_id}")
async def upload_file(notebook_id: str, file: UploadFile = File(...)):
    folder = os.path.join(UPLOAD_DIR, notebook_id)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, file.filename)
    with open(path, "wb") as f:
        f.write(await file.read())
    return {"status": "uploaded", "filename": file.filename}

@app.get("/files/{notebook_id}")
async def list_files(notebook_id: str):
    folder = os.path.join(UPLOAD_DIR, notebook_id)
    if not os.path.exists(folder):
        return {"files": []}
    return {"files": os.listdir(folder)}

@app.delete("/kernel/{notebook_id}")
async def shutdown_kernel(notebook_id: str):
    kernel = kernels.pop(notebook_id, None)
    if kernel:
        kernel["kc"].stop_channels()
        kernel["km"].shutdown_kernel(now=True)
    return {"status": "shutdown"}

@app.put("/files/{notebook_id}/{filename}")
async def rename_file(notebook_id: str, filename: str, new_name: str):
    old_path = os.path.join(UPLOAD_DIR, notebook_id, filename)
    new_path = os.path.join(UPLOAD_DIR, notebook_id, new_name)
    if os.path.exists(old_path):
        os.rename(old_path, new_path)
    return {"status": "renamed"}

@app.delete("/files/{notebook_id}/{filename}")
async def delete_file(notebook_id: str, filename: str):
    path = os.path.join(UPLOAD_DIR, notebook_id, filename)
    if os.path.exists(path):
        os.remove(path)
    return {"status": "deleted"}