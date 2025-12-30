import { config } from "dotenv";

config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),

  MONGODB_URI: process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET || "super_secret_fallback_change_this",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",

  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS || "10", 10),
};

if (!env.MONGODB_URI) {
  throw new Error("❌ Fatal Error: MONGODB_URI is not defined");
}

if (
  env.JWT_SECRET === "super_secret_fallback_change_this" &&
  env.NODE_ENV === "production"
) {
  console.warn("⚠️ Warning: Using default JWT_SECRET in production!");
}
