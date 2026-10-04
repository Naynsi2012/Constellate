import { createServer } from "http";
import { Server } from "socket.io";

import app from "./src/app.js";
import { config } from "./src/config/config.js";
import { registerRoomHandlers } from "./src/sockets/room.handlers.js";

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