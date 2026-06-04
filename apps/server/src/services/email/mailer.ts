import dns from "node:dns";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { isResendConfigured, sendViaResend } from "./resend.js";

// Render and many hosts have no working IPv6 egress; Gmail SMTP often resolves to AAAA first.
dns.setDefaultResultOrder("ipv4first");

let transporter: nodemailer.Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
}

/** True when Resend (HTTPS) or Gmail SMTP is configured. */
export function isEmailConfigured(): boolean {
  return isResendConfigured() || isSmtpConfigured();
}

function getTransporter(): nodemailer.Transporter {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured. Set SMTP_USER and SMTP_PASS in environment.");
  }
  if (!transporter) {
    const smtpOptions = {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER!,
        pass: env.SMTP_PASS!.replace(/\s/g, ""),
      },
      connectionTimeout: 30_000,
      greetingTimeout: 30_000,
      socketTimeout: 30_000,
      lookup: (
        hostname: string,
        _options: dns.LookupOptions,
        callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
      ) => {
        dns.lookup(hostname, { family: 4 }, callback);
      },
    } as SMTPTransport.Options;

    transporter = nodemailer.createTransport(smtpOptions);
  }
  return transporter;
}

async function sendViaSmtp(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const transport = getTransporter();
  const from = `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`;
  await transport.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error(
      "Email is not configured. Set RESEND_API_KEY + RESEND_FROM (Render free tier) or SMTP_USER + SMTP_PASS."
    );
  }

  // Resend uses HTTPS (port 443) — works on Render free tier; SMTP ports 25/465/587 are blocked there.
  if (isResendConfigured()) {
    await sendViaResend(options);
    logger.info("Email sent via Resend", { to: options.to, subject: options.subject });
    return;
  }

  await sendViaSmtp(options);
  logger.info("Email sent via SMTP", { to: options.to, subject: options.subject });
}
