import fs from "node:fs";
import path from "node:path";

// Rooms are persisted as one JSON file per room: data/rooms/<roomId>.json
const DATA_DIR = path.resolve(process.cwd(), "data", "rooms");
const SAVE_DEBOUNCE_MS = 250;

const pending = new Map();

export function initStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadRoomsFromDisk() {
  initStorage();
  const loaded = [];
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf8");
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
  const file = path.join(DATA_DIR, `${room.roomId}.json`);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(room));
  fs.renameSync(tmp, file);
}

// Save after important mutations, but coalesce bursts of changes
export function scheduleSave(room) {
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
    }, SAVE_DEBOUNCE_MS),
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
