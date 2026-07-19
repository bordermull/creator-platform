import nodemailer from "nodemailer";
import { config } from "../config.js";

const transport = config.smtpUrl
  ? nodemailer.createTransport(config.smtpUrl)
  : nodemailer.createTransport({ jsonTransport: true });

export async function sendRegistrationEmail(to: string) {
  await transport.sendMail({
    from: config.mailFrom,
    to,
    subject: "Добро пожаловать в CREATUR",
    text: "Ваш аккаунт CREATUR создан."
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transport.sendMail({
    from: config.mailFrom,
    to,
    subject: "Сброс пароля CREATUR",
    text: `Для сброса пароля откройте ссылку: ${resetUrl}`
  });
}
