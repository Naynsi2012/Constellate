import { config } from "./config/config.js";
import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  if (config.isDevelopment) {
    return res.status(200).json({
      status: "ok",
      environment: "development",
      message: "Server is running on development",
    });
  }

  res.status(200).json({
    status: "ok",
    environment: "production",
    message: "Server is running on production",
  });
});

export default app;
