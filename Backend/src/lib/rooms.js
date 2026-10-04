import { randomBytes, randomInt } from "node:crypto";
const ALPHABET = "abcdefghijklmnopqrstuvwxyz123456789";

const rooms = new Map();

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
    silentMode: true,
    voteBudget: 5,
    participants: {},
    notes: {},
    clusters: {},
    votes: {},
  };

  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

export function publicState(room) {
  const { hostToken, ...rest } = room;
  return rest;
}

export function newId(prefix) {
  return prefix + randomBytes(5).toString("hex");
}
