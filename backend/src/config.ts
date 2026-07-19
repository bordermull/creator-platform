import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://127.0.0.1:4173",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret",
  mailFrom: process.env.MAIL_FROM || "CREATUR <noreply@creatur.local>",
  smtpUrl: process.env.SMTP_URL || "",
  uploadDir: process.env.UPLOAD_DIR || "uploads"
};
