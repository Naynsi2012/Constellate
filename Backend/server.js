import { createServer } from "http";
import { Server } from "socket.io";

import app from "./src/app.js";
import { config } from "./src/config/config.js";
import { registerRoomHandlers } from "./src/sockets/room.handlers.js";
import { loadPersistedRooms, allRooms, cleanupExpiredRooms } from "./src/lib/rooms.js";
import { flushAll } from "./src/lib/persistence.js";

loadPersistedRooms();

cleanupExpiredRooms(config.ROOM_TTL_MS);
setInterval(() => cleanupExpiredRooms(config.ROOM_TTL_MS), config.CLEANUP_INTERVAL_MS).unref();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  registerRoomHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

httpServer.listen(config.PORT, () => {
  console.log(`Server is running on PORT: ${config.PORT}`);
});

// Flush pending room saves so no mutation is lost on shutdown
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    flushAll(allRooms());
    process.exit(0);
  });
}
