import api from "../../lib/api";

export const createRoom = (question = "") => {
  return api.post("/api/rooms/", { question });
};

export const getResults = (roomId) => {
  return api.get(`/api/rooms/${roomId}/results`);
};

export const exportUrl = (roomId) => {
  return `${import.meta.env.VITE_API_URL ?? ""}/api/rooms/${roomId}/export`;
};
