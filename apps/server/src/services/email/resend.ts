import { env } from "../../config/env.js";

export function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.RESEND_FROM);
}

export async function sendViaResend(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    throw new Error("Resend is not configured. Set RESEND_API_KEY and RESEND_FROM.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API ${res.status}: ${body}`);
  }
}
