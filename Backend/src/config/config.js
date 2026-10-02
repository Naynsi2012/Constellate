import dotenv from "dotenv"
dotenv.config();

if (!process.env.PORT){
    throw new Error("PORT is not defined in environment variables");
}

if (!process.env.FRONTEND_URL){
    throw new Error("FRONTEND_URL is not defined in environment variables");
}

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV is not defined in environment variables");
}

export const config = {
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    isTest: process.env.NODE_ENV === "test",
}