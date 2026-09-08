import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { config } from "./config.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { projectsRouter } from "./routes/projects.js";
import { usersRouter } from "./routes/users.js";
import { socialRouter } from "./routes/social.js";

export const app = express();

// Prisma returns BigInt for large file sizes. JSON.stringify cannot serialize
// BigInt by default, so Express gets a replacer before any API route responds.
app.set("json replacer", (_key: string, value: unknown) => (
  typeof value === "bigint" ? value.toString() : value
));

// Cookie-based auth needs CORS credentials enabled. The allowed origin is kept
// in config so local frontend and future deployed frontend can differ cleanly.
app.use(cors({
  origin: config.frontendOrigin,
  credentials: true
}));

app.use(express.json({ limit: "6mb" }));
app.use(cookieParser());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/projects", socialRouter, projectsRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);

// Route handlers pass validation and runtime errors here through next(error).
// Zod errors are client mistakes, while unknown errors are hidden from clients.
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: "Validation error", issues: error.issues });
    return;
  }

  // Ошибки уникальности/отсутствия записи — ожидаемые ответы интерфейсу,
  // а не авария сервера (например, повторная регистрация того же email).
  const code = (error as { code?: string })?.code;
  if (code === "P2002") { response.status(409).json({ error: "Record already exists" }); return; }
  if (code === "P2025" || code === "P2003") { response.status(404).json({ error: "Record not found" }); return; }
  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});
