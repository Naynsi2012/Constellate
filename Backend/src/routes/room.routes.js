import { Router } from "express";
import { createRoom, getResults, exportMarkdown } from "../controllers/room.controller.js";

const roomRouter = Router();

roomRouter.post("/", createRoom);
roomRouter.get("/:roomId/results", getResults);
roomRouter.get("/:roomId/export", exportMarkdown);

export default roomRouter;
