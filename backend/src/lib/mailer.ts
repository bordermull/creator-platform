import nodemailer from "nodemailer";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";

const transport = config.smtpUrl
  ? nodemailer.createTransport(config.smtpUrl)
  : nodemailer.createTransport({ jsonTransport: true });

// In development SMTP_URL can stay empty. Nodemailer then uses jsonTransport,
// which builds the email payload without sending real mail.
export async function sendRegistrationEmail(to: string) {
  const result = await transport.sendMail({
    from: config.mailFrom,
    to,
    subject: "Добро пожаловать в CREATUR",
    text: "Ваш аккаунт CREATUR создан."
  });
  await saveLocalMessage((result as unknown as { message?: unknown }).message);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const result = await transport.sendMail({
    from: config.mailFrom,
    to,
    subject: "Сброс пароля CREATUR",
    text: `Для сброса пароля откройте ссылку: ${resetUrl}`
  });
  await saveLocalMessage((result as unknown as { message?: unknown }).message);
}

async function saveLocalMessage(message: unknown) {
  // Без SMTP письмо не отправляется в интернет. Сохраняем сформированное
  // сообщение локально: разработчик может открыть ссылку сброса при проверке.
  // Каталог исключён из Git, поскольку сообщения содержат адреса и токены.
  if (config.smtpUrl) return;
  const directory = path.resolve(process.env.LOCAL_MAIL_DIR || ".local-mail");
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, `${Date.now()}-${randomUUID()}.json`), String(message), "utf8");
}
