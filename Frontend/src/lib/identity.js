const COLORS = ["#7aa2ff", "#ff7a90", "#ffd166", "#6ee7b7", "#c4a1ff", "#ff9f68"];

export function getUserId() {
  let id = localStorage.getItem("userId");
  if (!id) {
    id = "u_" + crypto.randomUUID().slice(0, 12);
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

export const getHostToken = (roomId) => localStorage.getItem(`host:${roomId}`) ?? undefined;
export const saveHostToken = (roomId, token) => localStorage.setItem(`host:${roomId}`, token);
export const removeHostToken = (roomId) => localStorage.removeItem(`host:${roomId}`);

export function getHostedRoomIds() {
  return Object.keys(localStorage).filter((key) => key.startsWith("host:")).map((key) => key.slice("host:".length));
}