import { NextResponse } from "next/server";
import { sendAlertNotification } from "@/lib/alerts";

export async function POST(req: Request) {
  try {
    const { title, message, symbol, price, confidence } = await req.json();

    if (!title || !message || !symbol || !price) {
      return NextResponse.json(
        { error: "Title, message, symbol, and current asset price are required fields." },
        { status: 400 }
      );
    }

    await sendAlertNotification({
      title,
      message,
      symbol: symbol.toUpperCase(),
      price: parseFloat(price),
      confidence: confidence ? parseInt(confidence) : undefined,
    });

    return NextResponse.json({
      message: "Notification event dispatched successfully.",
      targetChannelLogs: ["IN_APP", "TELEGRAM_MOCK", "EMAIL_MOCK"],
    });
  } catch (error: any) {
    console.error("Test alert endpoint error:", error);
    return NextResponse.json({ error: "Failed to dispatch test alert" }, { status: 500 });
  }
}
