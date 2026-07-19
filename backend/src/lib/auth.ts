import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const authCookieName = "creatur_session";

export type SessionUser = {
  id: string;
  role: "ADMIN" | "USER";
};

export type AuthedRequest = Request & {
  user: SessionUser;
};

export function createSessionToken(user: SessionUser) {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "14d" });
}

export function setSessionCookie(response: Response, token: string) {
  response.cookie(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 14 * 24 * 60 * 60 * 1000
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(authCookieName);
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = request.cookies?.[authCookieName];

  if (!token) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    (request as AuthedRequest).user = jwt.verify(token, config.jwtSecret) as SessionUser;
    next();
  } catch {
    response.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  requireAuth(request, response, () => {
    if ((request as AuthedRequest).user.role !== "ADMIN") {
      response.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  });
}
