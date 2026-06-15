import { NextResponse } from "next/server";
import { fetchLivePrices } from "@/lib/binance";

export async function GET() {
  try {
    const prices = await fetchLivePrices();
    return NextResponse.json({ prices, timestamp: new Date() });
  } catch (error: any) {
    console.error("Market API error:", error);
    return NextResponse.json({ error: "Failed to fetch live prices" }, { status: 500 });
  }
}
