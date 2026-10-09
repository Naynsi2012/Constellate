import path from "node:path";
import { fileURLToPath } from "node:url";
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

if (!config.isProduction){
  app.get("/", (req, res) => {
    res.status(200).json({
      status: "ok",
      environment: config.isDevelopment ? "development" : "production",
      message: `Server is running on ${config.isDevelopment ? "development" : "production"}`
    })
  })
}

app.use("/api/rooms", roomRouter);

if (config.isProduction){
  const distDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../Frontend/dist"
  );

  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) return next();

    res.sendFile(path.join(distDir, "index.html"));
  })
}

export default app;
