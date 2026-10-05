import { randomBytes, randomInt } from "node:crypto";
import { loadRoomsFromDisk, scheduleSave } from "./persistence.js";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz123456789";

const rooms = new Map();

export const PHASES = ["diverge", "cluster", "converge"];

// What participants may do in each phase. The server enforces this, never the UI alone
export const PHASE_RULES = {
  diverge: { noteCreate: true, noteEdit: true, noteMove: "author", edges: true, clusters: false, vote: false },
  cluster: { noteCreate: true, noteEdit: true, noteMove: "anyone", edges: true, clusters: true, vote: false },
  converge: { noteCreate: false, noteEdit: false, noteMove: "none", edges: false, clusters: false, vote: true },
};

export const QUESTION_COLOR = "#1e2a4a";
export const CLUSTER_COLORS = ["#7aa2ff", "#c4a1ff", "#6ee7b7", "#ffd166", "#ff9f68", "#ff7a90"];

export function newId(prefix) {
  return prefix + randomBytes(5).toString("hex");
}

function makeTimer() {
  return { duration: 600, remaining: 600, running: false, endsAt: null };
}

// The session question becomes the first anchor note in the center of the canvas
export function makeQuestionNote(question) {
  return {
    id: newId("q_"),
    type: "question",
    x: -140,
    y: -55,
    text: String(question).slice(0, 200),
    color: QUESTION_COLOR,
    fontSize: 18,
    fontFamily: "sans",
    authorId: null, // belongs to the room, not to a participant
    clusterId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createNewRoom({ question = "" }) {
  let roomId;

  do {
    roomId = Array.from(
      { length: 5 },
      () => ALPHABET[randomInt(ALPHABET.length)],
    ).join("");
  } while (rooms.has(roomId));

  const room = {
    roomId,
    hostToken: randomBytes(16).toString("hex"),
    question: String(question).slice(0, 200),
    phase: "diverge",
    settings: {
      silentMode: true,
      voteBudget: 5,
      timer: makeTimer(),
    },
    participants: {},
    users: {},
    notes: {},
    edges: {},
    clusters: {},
    votes: [],
    createdAt: Date.now(),
  };

  if (room.question) {
    const anchor = makeQuestionNote(room.question);
    room.notes[anchor.id] = anchor;
  }

  rooms.set(roomId, room);
  scheduleSave(room);
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

// A room loaded from disk has nobody online and no running timer
function sanitizeLoadedRoom(room) {
  room.phase = PHASES.includes(room.phase) ? room.phase : "diverge";
  room.settings = {
    silentMode: room.settings?.silentMode !== false,
    voteBudget: Number.isInteger(room.settings?.voteBudget) ? room.settings.voteBudget : 5,
    timer: makeTimer(),
  };
  if (room.settings?.timer && Number.isFinite(room.settings.timer.duration)) {
    room.settings.timer.duration = room.settings.timer.duration;
    room.settings.timer.remaining = room.settings.timer.duration;
  }
  room.participants = {};
  room.users = room.users ?? {};
  room.notes = room.notes ?? {};
  room.edges = room.edges ?? {};
  room.clusters = room.clusters ?? {};
  room.votes = Array.isArray(room.votes) ? room.votes : [];
  return room;
}

export function loadPersistedRooms() {
  let count = 0;
  for (const room of loadRoomsFromDisk()) {
    if (!rooms.has(room.roomId)) {
      rooms.set(room.roomId, sanitizeLoadedRoom(room));
      count++;
    }
  }
  if (count > 0) console.log(`Restored ${count} room(s) from disk`);
}

export function allRooms() {
  return rooms.values();
}

// During silent Diverge, other participants must not receive the real authorId
// The server keeps the real author internally; clients learn it when the phase moves on
export function publicState(room, forUserId = null) {
  const { hostToken, ...rest } = room;
  const anonymous = room.settings.silentMode && room.phase === "diverge";
  return {
    ...rest,
    notes: Object.fromEntries(
      Object.entries(room.notes).map(([id, note]) => [
        id,
        anonymous && note.authorId && note.authorId !== forUserId
          ? { ...note, authorId: null }
          : note,
      ]),
    ),
  };
}

// The note as one specific recipient is allowed to see it
export function publicNote(room, note, forUserId = null) {
  const anonymous = room.settings.silentMode && room.phase === "diverge";
  if (anonymous && note.authorId && note.authorId !== forUserId) {
    return { ...note, authorId: null };
  }
  return note;
}

export function clusterAt(room, x, y) {
  // Last created cluster wins when clusters overlap
  const list = Object.values(room.clusters);
  for (let i = list.length - 1; i >= 0; i--) {
    const c = list[i];
    if (x >= c.x && x <= c.x + c.width && y >= c.y && y <= c.y + c.height) return c;
  }
  return null;
}

export function voteCounts(room) {
  const perNote = {};
  const perCluster = {};
  for (const vote of room.votes) {
    if (vote.targetType === "cluster") {
      perCluster[vote.targetId] = (perCluster[vote.targetId] ?? 0) + 1;
    } else {
      perNote[vote.targetId] = (perNote[vote.targetId] ?? 0) + 1;
    }
  }
  return { perNote, perCluster };
}
