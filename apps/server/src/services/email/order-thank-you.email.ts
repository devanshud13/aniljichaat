import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { getAppSettings } from "../settings.service.js";
import { isSmtpConfigured, sendMail } from "./mailer.js";
export interface OrderEmailPayload {
  _id: string;
  orderType: string;
  tableNumber?: number | null;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  subtotal: number;
  discount?: number;
  offerTitle?: string;
  tax: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt?: Date | string;
  items: { nameSnapshot: string; quantity: number; priceSnapshot: number }[];
  outletId?: { name?: string; address?: string } | string;
}

function orderShortId(id: string): string {
  return String(id).slice(-8).toUpperCase();
}

function formatDate(d?: Date | string): string {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function orderContextLabel(order: OrderEmailPayload): string {
  if (order.orderType === "TAKEAWAY") return "Takeaway";
  if (order.tableNumber) return `Table ${order.tableNumber}`;
  return "Dine-in";
}

export function buildThankYouEmailHtml(order: OrderEmailPayload): string {
  const logoUrl = `${env.SITE_URL.replace(/\/$/, "")}/logo.png`;
  const id = orderShortId(order._id);
  const discount = order.discount ?? 0;
  const outletName =
    typeof order.outletId === "object" && order.outletId?.name
      ? order.outletId.name
      : "Anil Ji Chaat";

  const rows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0e6d8;color:#3d2914;font-size:14px;">${i.nameSnapshot}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0e6d8;text-align:center;color:#5c4a3a;font-size:14px;">${i.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0e6d8;text-align:right;color:#3d2914;font-size:14px;font-weight:600;">₹${i.priceSnapshot * i.quantity}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Thank you — Anil Ji Chaat</title>
</head>
<body style="margin:0;padding:0;background:#f5ebe0;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5ebe0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(61,41,20,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a0c0c 0%,#8b1a1a 100%);padding:32px 28px;text-align:center;">
              <img src="${logoUrl}" alt="Anil Ji Chaat" width="160" style="max-width:160px;height:auto;display:block;margin:0 auto 16px;" />
              <p style="margin:0;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#e5b54f;">Thank you for choosing us</p>
              <h1 style="margin:12px 0 0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">We loved serving you!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0 0 8px;font-size:16px;color:#3d2914;line-height:1.6;">
                Dear ${order.customerName ? order.customerName : "Guest"},
              </p>
              <p style="margin:0;font-size:15px;color:#5c4a3a;line-height:1.65;">
                Your order at <strong style="color:#8b1a1a;">${outletName}</strong> is complete. We hope every bite brought you the authentic taste of Ambala&apos;s favourite chaat.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fffaf5;border:1px solid #e8dcc8;border-radius:12px;padding:20px;">
                <tr>
                  <td colspan="3">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#9a8b7a;">Order invoice</p>
                    <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#8b1a1a;">#${id}</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#5c4a3a;"><strong>${orderContextLabel(order)}</strong> · ${formatDate(order.createdAt)}</p>
                    ${order.customerPhone ? `<p style="margin:4px 0 0;font-size:13px;color:#5c4a3a;">Phone: ${order.customerPhone}</p>` : ""}
                  </td>
                </tr>
                <tr>
                  <td colspan="3" style="padding-top:12px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <th align="left" style="padding:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9a8b7a;border-bottom:2px solid #e5b54f;">Item</th>
                        <th align="center" style="padding:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9a8b7a;border-bottom:2px solid #e5b54f;">Qty</th>
                        <th align="right" style="padding:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9a8b7a;border-bottom:2px solid #e5b54f;">Amount</th>
                      </tr>
                      ${rows}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td colspan="3" style="padding-top:16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr><td style="padding:4px 0;font-size:14px;color:#5c4a3a;">Subtotal</td><td align="right" style="padding:4px 0;font-size:14px;color:#3d2914;">₹${order.subtotal}</td></tr>
                      ${discount > 0 ? `<tr><td style="padding:4px 0;font-size:14px;color:#5c4a3a;">Discount${order.offerTitle ? ` (${order.offerTitle})` : ""}</td><td align="right" style="padding:4px 0;font-size:14px;color:#2d6a2d;">−₹${discount}</td></tr>` : ""}
                      <tr><td style="padding:4px 0;font-size:14px;color:#5c4a3a;">Tax (5%)</td><td align="right" style="padding:4px 0;font-size:14px;color:#3d2914;">₹${order.tax}</td></tr>
                      <tr>
                        <td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#8b1a1a;border-top:2px solid #e5b54f;">Total paid</td>
                        <td align="right" style="padding:12px 0 0;font-size:18px;font-weight:700;color:#8b1a1a;border-top:2px solid #e5b54f;">₹${order.total}</td>
                      </tr>
                    </table>
                    <p style="margin:16px 0 0;font-size:12px;color:#9a8b7a;">Payment: ${order.paymentStatus} · ${order.paymentMethod}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <a href="${env.SITE_URL.replace(/\/$/, "")}/order" style="display:inline-block;background:#e5b54f;color:#1a1208;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:8px;font-family:Arial,sans-serif;">Order Again</a>
            </td>
          </tr>
          <tr>
            <td style="background:#3d2914;padding:20px 28px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#f5e6d3;line-height:1.5;">Jaggi City Centre, Sena Nagar, Ambala City</p>
              <p style="margin:8px 0 0;font-size:12px;color:#e5b54f;">Ambala&apos;s Most Loved · Since 1966</p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:#9a8b7a;font-family:Arial,sans-serif;">This is an automated receipt for your completed order.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildThankYouEmailText(order: OrderEmailPayload): string {
  const id = orderShortId(order._id);
  const lines = order.items.map(
    (i) => `  - ${i.nameSnapshot} x${i.quantity}  ₹${i.priceSnapshot * i.quantity}`
  );
  return `Thank you for choosing Anil Ji Chaat!

Order #${id} (${orderContextLabel(order)})
${formatDate(order.createdAt)}

${lines.join("\n")}

Subtotal: ₹${order.subtotal}
${(order.discount ?? 0) > 0 ? `Discount: −₹${order.discount}\n` : ""}Tax: ₹${order.tax}
Total: ₹${order.total}

We hope to see you again soon!
${env.SITE_URL}`;
}

export async function sendOrderThankYouEmail(order: OrderEmailPayload): Promise<boolean> {
  const settings = await getAppSettings();
  if (!settings.thankYouEmailsEnabled) return false;

  const email = order.customerEmail?.trim().toLowerCase();
  if (!email) return false;

  if (!isSmtpConfigured()) {
    logger.warn("Thank-you email skipped: SMTP_USER / SMTP_PASS not configured");
    return false;
  }

  const html = buildThankYouEmailHtml(order);
  await sendMail({
    to: email,
    subject: `Thank you! Your Anil Ji Chaat order #${orderShortId(order._id)}`,
    html,
    text: buildThankYouEmailText(order),
  });
  return true;
}

export async function trySendThankYouOnComplete(orderId: string): Promise<void> {
  const { Order: OrderModel, OrderItem } = await import("@anilji/database");
  const order = await OrderModel.findById(orderId).populate("outletId", "name address");
  if (!order || order.status !== "COMPLETED") return;
  if (order.thankYouEmailSent) return;
  if (!order.customerEmail) return;

  const items = await OrderItem.find({ orderId: order._id });
  const outlet = order.populated("outletId")
    ? (order.outletId as { name?: string; address?: string })
    : undefined;
  const payload: OrderEmailPayload = {
    _id: order._id.toString(),
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    subtotal: order.subtotal,
    discount: order.discount,
    offerTitle: order.offerTitle,
    tax: order.tax,
    total: order.total,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    outletId: outlet,
    items: items.map((i) => ({
      nameSnapshot: i.nameSnapshot,
      quantity: i.quantity,
      priceSnapshot: i.priceSnapshot,
    })),
  };

  try {
    const sent = await sendOrderThankYouEmail(payload);
    if (sent) {
      order.thankYouEmailSent = true;
      await order.save();
    }
  } catch (err) {
    logger.error("Failed to send thank-you email", {
      orderId,
      email: order.customerEmail,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
