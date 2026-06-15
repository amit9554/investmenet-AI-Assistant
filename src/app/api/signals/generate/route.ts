import { NextResponse } from "next/server";
import { processAndSaveSignals, MONITORED_SYMBOLS } from "@/lib/signalEngine";
import { syncHistoricalCandles, fetchLivePrices } from "@/lib/binance";
import { checkProfitBooking, checkCustomPriceAlerts } from "@/lib/profitBooking";

export async function POST() {
  try {
    console.log("Forced signal analysis triggered...");

    // 1. Fetch live prices first
    const prices = await fetchLivePrices();

    // 2. Perform candle sync and profit booking checks for each symbol
    for (const symbol of MONITORED_SYMBOLS) {
      const currentPrice = prices[symbol];
      if (currentPrice) {
        // Sync recent history first (so indicator warmups are accurate)
        await syncHistoricalCandles(symbol, "1h", 100);
        
        // Check if current prices hit active trade targets (SL/TP)
        await checkProfitBooking(symbol, currentPrice);

        // Check if custom user price alerts are triggered
        await checkCustomPriceAlerts(symbol, currentPrice);
      }
    }

    // 3. Scan indicators and generate new signal decisions
    const newSignals = await processAndSaveSignals();

    return NextResponse.json({
      message: "Signal analysis completed successfully",
      syncedSymbols: MONITORED_SYMBOLS,
      newSignalsGeneratedCount: newSignals.length,
      newSignals,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error("Forced signal generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute signal generation scan" },
      { status: 500 }
    );
  }
}
