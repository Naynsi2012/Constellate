import { io } from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL || undefined, {
  withCredentials: true,
  autoConnect: false,
});
