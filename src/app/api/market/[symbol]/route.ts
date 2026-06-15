import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncHistoricalCandles } from "@/lib/binance";

export async function GET(
  request: Request,
  props: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await props.params;
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "1h";
    const limit = parseInt(searchParams.get("limit") || "100");

    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }

    // Trigger asynchronous historical sync to keep DB fresh (don't block the response)
    syncHistoricalCandles(symbol, timeframe, 250).catch((err) =>
      console.error("Background candle sync error:", err)
    );

    // Retrieve historical candles from DB
    const candles = await prisma.marketCandle.findMany({
      where: {
        symbol: symbol.toUpperCase(),
        timeframe,
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // Reverse candles to chronological ascending order (required for charting)
    candles.reverse();

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      timeframe,
      candles,
      count: candles.length,
    });
  } catch (error: any) {
    console.error(`Market symbol API error:`, error);
    return NextResponse.json({ error: "Failed to fetch symbol data" }, { status: 500 });
  }
}
