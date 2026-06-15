import { prisma } from "./db";

interface NotificationPayload {
  title: string;
  message: string;
  symbol: string;
  price: number;
  confidence?: number;
}

export async function sendAlertNotification(payload: NotificationPayload): Promise<void> {
  console.log(`[ALERT DISPATCH] Title: ${payload.title} | Msg: ${payload.message}`);

  // 1. Save In-App Alert to DB
  // For safety, we find the first user (or admin) to link the alert to.
  // In a multi-tenant production app, we would broadcast to all matching subscribers.
  try {
    const defaultUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (defaultUser) {
      await prisma.alert.create({
        data: {
          userId: defaultUser.id,
          symbol: payload.symbol,
          type: "SIGNAL",
          condition: "TRIGGERED",
          value: payload.price,
          isTriggered: true,
          isSent: true,
          channels: ["IN_APP", "TELEGRAM", "EMAIL"],
          // We can pack title and description into the message field or structure it
        },
      });
    }
  } catch (dbErr) {
    console.error("Failed to store alert in database:", dbErr);
  }

  // 2. Dispatch to Telegram (if configured)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;

  if (tgToken && tgChatId && tgToken !== "mock_bot_token" && tgChatId !== "mock_chat_id") {
    const formattedText = `🔔 *${payload.title}*\n\n📈 Asset: ${payload.symbol}\n💵 Price: $${payload.price.toFixed(2)}\n🎯 Details: ${payload.message}\n${
      payload.confidence ? `📊 Confidence: ${payload.confidence}%` : ""
    }`;

    try {
      const tgUrl = `https://api.telegram.org/bot${tgToken}/sendMessage`;
      const res = await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: formattedText,
          parse_mode: "Markdown",
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error(`Telegram API error: status ${res.status} - ${errText}`);
      } else {
        console.log("Telegram notification sent successfully.");
      }
    } catch (tgErr) {
      console.error("Failed to send Telegram notification:", tgErr);
    }
  } else {
    console.log("[SIMULATION] Telegram alert logged (Telegram token/chat_id not configured).");
  }

  // 3. Dispatch Email (simulated)
  const emailHost = process.env.EMAIL_SERVER_HOST;
  const emailFrom = process.env.EMAIL_FROM || "alerts@tradingai.com";

  console.log(`[SIMULATION] Sending Email from: ${emailFrom} -> SMTP: ${emailHost || "localhost"}`);
  console.log(`Subject: [AI Trading] ${payload.title}`);
  console.log(`Body:\n---\nHello Trader,\n\n${payload.message}\n\nGood luck,\nAI Crypto Assistant Team\n---`);
}

// Custom manual alert trigger endpoint helper
export async function createCustomAlert(userId: string, symbol: string, type: string, condition: string, value: number, channels: string[]): Promise<any> {
  const alert = await prisma.alert.create({
    data: {
      userId,
      symbol,
      type,
      condition,
      value,
      isTriggered: false,
      isSent: false,
      channels,
    },
  });
  return alert;
}
