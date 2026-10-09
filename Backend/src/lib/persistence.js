import fs from "node:fs";
import path from "node:path";
import { config } from "../config/config.js";

const pending = new Map();

export function initStorage() {
  fs.mkdirSync(config.DATA_DIR, { recursive: true });
}

export function loadRoomsFromDisk() {
  initStorage();
  const loaded = [];
  for (const file of fs.readdirSync(config.DATA_DIR)) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = fs.readFileSync(path.join(config.DATA_DIR, file), "utf8");
      const room = JSON.parse(raw);
      if (room && typeof room.roomId === "string") loaded.push(room);
    } catch (err) {
      console.error(`Skipping corrupt room file ${file}:`, err.message);
    }
  }
  return loaded;
}

export function saveRoomNow(room) {
  initStorage();
  const file = path.join(config.DATA_DIR, `${room.roomId}.json`);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(room));
  fs.renameSync(tmp, file);
}

// Save after important mutations, but coalesce bursts of changes
export function scheduleSave(room) {
  room.lastActivityAt = Date.now();
  clearTimeout(pending.get(room.roomId));
  pending.set(
    room.roomId,
    setTimeout(() => {
      pending.delete(room.roomId);
      try {
        saveRoomNow(room);
      } catch (err) {
        console.error(`Failed to persist room ${room.roomId}:`, err.message);
      }
    }, config.SAVE_DEBOUNCE_MS),
  );
}

export function flushAll(rooms) {
  for (const room of rooms) {
    clearTimeout(pending.get(room.roomId));
    try {
      saveRoomNow(room);
    } catch (err) {
      console.error(`Failed to persist room ${room.roomId}:`, err.message);
    }
  }
}

export function deleteRoomFile(roomId){
  clearTimeout(pending.get(roomId));
  pending.delete(roomId);

  try {
    fs.rmSync(path.join(config.DATA_DIR, `${roomId}.json`), { force: true });
  } catch (err) {
    console.error(`Failed to delete room file ${roomId}:`, err.message);
  }
}