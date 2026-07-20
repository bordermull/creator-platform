import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { config } from "./config.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { projectsRouter } from "./routes/projects.js";

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

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Uploaded files are stored locally in development. Serving them from the API
// keeps user uploads available to the separate static frontend on port 4173.
app.use("/uploads", express.static(config.uploadDir));

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/admin", adminRouter);

// Route handlers pass validation and runtime errors here through next(error).
// Zod errors are client mistakes, while unknown errors are hidden from clients.
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: "Validation error", issues: error.issues });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Internal server error" });
});
