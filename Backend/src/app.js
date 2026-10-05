import { config } from "./config/config.js";
import express from "express";
import cors from "cors";

// Routes
import roomRouter from "./routes/room.routes.js";

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// Simple health check used by the frontend's status page and uptime probes
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is healthy",
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: config.isDevelopment ? "development" : "production",
    message: `Server is running on ${config.isDevelopment ? "development" : "production"}`,
  });
});

app.use("/api/rooms", roomRouter);

export default app;
