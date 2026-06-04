import dns from "node:dns";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

// Render and many hosts have no working IPv6 egress; Gmail SMTP often resolves to AAAA first.
dns.setDefaultResultOrder("ipv4first");

let transporter: nodemailer.Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
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
      // Force IPv4 — Render has no IPv6 egress to Gmail (ENETUNREACH on AAAA).
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

export async function sendMail(options: {
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
  logger.info("Email sent", { to: options.to, subject: options.subject });
}
