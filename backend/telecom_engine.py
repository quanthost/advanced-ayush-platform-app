from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List

router = APIRouter(prefix="/api/v1/telecom", tags=["Telecommunications"])

class ConnectionHub:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}

    async def join_room(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []
        self.active_rooms[room_id].append(websocket)

    def leave_room(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_rooms and websocket in self.active_rooms[room_id]:
            self.active_rooms[room_id].remove(websocket)

    async def broadcast(self, room_id: str, message: dict):
        for connection in self.active_rooms.get(room_id, []):
            await connection.send_json(message)

hub = ConnectionHub()

@router.websocket("/ws/{room_id}")
async def telecom_websocket(websocket: WebSocket, room_id: str):
    await hub.join_room(room_id, websocket)
    try:
        while True:
            payload = await websocket.receive_json()
            await hub.broadcast(room_id, payload)
    except WebSocketDisconnect:
        hub.leave_room(room_id, websocket)