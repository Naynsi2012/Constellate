import api from "../../lib/api";

export const createRoom = (question = "") => {
  return api.post("/api/rooms/", { question });
};
