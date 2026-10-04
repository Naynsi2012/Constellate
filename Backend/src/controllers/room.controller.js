import { createNewRoom } from "../lib/rooms.js"

export async function createRoom(req, res) {
  const question = typeof req.body?.question === "string" ? req.body.question : "";
  const room = createNewRoom({ question });

  res
    .status(201)
    .json({
      message: "Room created successfully",
      roomId: room.roomId,
      hostToken: room.hostToken,
    });
}
