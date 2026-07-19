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
  // The token contains only the data needed on every protected request.
  // Profile details are loaded from the database through /api/auth/me.
  return jwt.sign(user, config.jwtSecret, { expiresIn: "14d" });
}

export function setSessionCookie(response: Response, token: string) {
  // httpOnly keeps the JWT away from frontend JavaScript. That lowers the
  // impact of XSS compared with storing tokens in localStorage.
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
    // Downstream routes cast Request to AuthedRequest after this middleware.
    // Keeping the session payload tiny makes this cast predictable.
    (request as AuthedRequest).user = jwt.verify(token, config.jwtSecret) as SessionUser;
    next();
  } catch {
    response.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  // Admin protection is layered on top of normal auth so every admin route
  // first proves the user is logged in, then checks role-based permission.
  requireAuth(request, response, () => {
    if ((request as AuthedRequest).user.role !== "ADMIN") {
      response.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  });
}
