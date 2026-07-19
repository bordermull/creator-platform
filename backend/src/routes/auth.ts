import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { clearSessionCookie, createSessionToken, requireAuth, setSessionCookie, type AuthedRequest } from "../lib/auth.js";
import { sendPasswordResetEmail, sendRegistrationEmail } from "../lib/mailer.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { prisma } from "../lib/prisma.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(80)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/register", async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);
    const passwordHash = await hashPassword(input.password);
    const usersCount = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        displayName: input.displayName,
        role: usersCount === 0 ? "ADMIN" : "USER"
      }
    });

    await sendRegistrationEmail(user.email);
    setSessionCookie(response, createSessionToken({ id: user.id, role: sessionRole(user.role) }));
    response.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      response.status(401).json({ error: "Invalid credentials" });
      return;
    }

    setSessionCookie(response, createSessionToken({ id: user.id, role: sessionRole(user.role) }));
    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_request, response) => {
  clearSessionCookie(response);
  response.status(204).end();
});

authRouter.get("/me", requireAuth, async (request, response, next) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: (request as AuthedRequest).user.id }
    });

    response.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/password-reset/request", async (request, response, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        }
      });

      await sendPasswordResetEmail(user.email, `${config.frontendOrigin}/#reset-password/${token}`);
    }

    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

authRouter.post("/password-reset/confirm", async (request, response, next) => {
  try {
    const input = z.object({
      token: z.string().min(20),
      password: z.string().min(8)
    }).parse(request.body);
    const tokenHash = crypto.createHash("sha256").update(input.token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      response.status(400).json({ error: "Invalid reset token" });
      return;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: await hashPassword(input.password) }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      })
    ]);

    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

function publicUser(user: { id: string; email: string; displayName: string; bio: string | null; avatarFileId: string | null; role: string }) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatarFileId: user.avatarFileId,
    role: user.role
  };
}

function sessionRole(role: string) {
  return role === "ADMIN" ? "ADMIN" : "USER";
}
