const COLORS = [
  "#7aa2ff",
  "#ff7a90",
  "#ffd166",
  "#6ee7b7",
  "#c4a1ff",
  "#ff9f68",
];

function createUUID() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // UUID version 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

export function getUserId() {
  let id = localStorage.getItem("userId");
  if (!id) {
    id = "u_" + createUUID().slice(0, 12);
    localStorage.setItem("userId", id);
  }

  return id;
}

export function getColor() {
  let color = localStorage.getItem("color");
  if (!color) {
    color = COLORS[Math.floor(Math.random() * COLORS.length)];
    localStorage.setItem("color", color);
  }

  return color;
}

export const getName = () => localStorage.getItem("name") ?? "";
export const saveName = (name) => localStorage.setItem("name", name.trim());

// The host token proves "I created this room". One token per room, so one browser can host many rooms.
export const getHostToken = (roomId) =>
  localStorage.getItem(`host:${roomId}`) ?? undefined;
export const saveHostToken = (roomId, token) =>
  localStorage.setItem(`host:${roomId}`, token);
export const removeHostToken = (roomId) =>
  localStorage.removeItem(`host:${roomId}`);

// Every room this browser is the host of (used for the "Your rooms" list on the landing page).
export function getHostedRoomIds() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith("host:"))
    .map((key) => key.slice("host:".length));
}
