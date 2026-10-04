import { Router } from "express";
import { createRoom } from "../controllers/room.controller.js";

const roomRouter = Router();

roomRouter.post("/", createRoom);

export default roomRouter;
