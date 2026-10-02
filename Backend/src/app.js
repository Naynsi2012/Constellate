import { config } from "./config/config.js";
import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: config.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}))

app.get("/", (req, res) => {
    if (config.isDevelopment){
        return res.send("Server is running on development");
    }
    res.send("Server is running on production");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is healthy",
  });
});

export default app;