import api from "../../lib/api";
import { getHostToken } from "../../lib/identity"

export const createRoom = (question = "") => {
  return api.post("/api/rooms/", { question });
};

export const getResults = (roomId) => {
  return api.get(`/api/rooms/${roomId}/results`);
};

export const downloadExport = async (roomId) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL ?? ""}/api/rooms/${roomId}/export`,
    { headers: { "x-host-token": getHostToken(roomId) ?? "" } },
  );
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error ?? "Export failed");
  }
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: `constellate-${roomId}-results.md`,
  });
  a.click();
  URL.revokeObjectURL(url);
};