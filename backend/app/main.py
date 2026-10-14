"""FastAPI entry point.

Serves:
  /api/*   REST endpoints
  /ws/*    WebSocket endpoints
  /*       built frontend (Vite) from ./static, if present
"""

import asyncio
import math
import os
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

APP_VERSION = "0.1.0"
STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title="Digital Twin of Neural Network", version=APP_VERSION)


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "version": APP_VERSION,
        "env": os.getenv("RAILWAY_ENVIRONMENT_NAME", "local"),
    }


@app.websocket("/ws/ping")
async def ws_ping(ws: WebSocket) -> None:
    """Test stream: sends a smooth signal ~30 times/s to verify WebSocket works end-to-end."""
    await ws.accept()
    tick = 0
    try:
        while True:
            await ws.send_json({"tick": tick, "value": math.sin(tick / 15)})
            tick += 1
            await asyncio.sleep(1 / 30)
    except WebSocketDisconnect:
        pass


# --- Frontend (production build) -------------------------------------------
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str) -> FileResponse:
        candidate = (STATIC_DIR / full_path).resolve()
        if full_path and candidate.is_file() and STATIC_DIR.resolve() in candidate.parents:
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
