import dotenv from "dotenv"
dotenv.config();
import path from "node:path";
import { 
    DEFAULT_CLEANUP_INTERVAL,
    DEFAULT_ROOM_TTL,
    parseDuration 
} from "../lib/constants.js";

if (!process.env.PORT){
    throw new Error("PORT is not defined in environment variables");
}

if (!process.env.FRONTEND_URL){
    throw new Error("FRONTEND_URL is not defined in environment variables");
}

if (!process.env.NODE_ENV){
  throw new Error("NODE_ENV is not defined in environment variables");
}

export const config = {
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    isTest: process.env.NODE_ENV === "test",
    DATA_DIR: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(process.cwd(), "data", "rooms"),
    ROOM_TTL_MS: parseDuration(process.env.ROOM_TTL, DEFAULT_ROOM_TTL),
    CLEANUP_INTERVAL_MS: parseDuration(process.env.ROOM_CLEANUP_INTERVAL, DEFAULT_CLEANUP_INTERVAL)
}