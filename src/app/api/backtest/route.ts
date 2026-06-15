import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runBacktestSimulation } from "@/lib/backtesting";
import { syncHistoricalCandles } from "@/lib/binance";

export async function GET() {
  try {
    const defaultUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!defaultUser) {
      return NextResponse.json({ backtests: [] });
    }

    const backtests = await prisma.backtest.findMany({
      where: { userId: defaultUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ backtests });
  } catch (error: any) {
    console.error("Fetch backtests error:", error);
    return NextResponse.json({ error: "Failed to retrieve backtest logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { symbol, timeframe, startDate, endDate } = await req.json();

    if (!symbol || !timeframe || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Symbol, timeframe, startDate, and endDate are required fields." },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure we have candles in range. If DB records are low, trigger a sync.
    const candleCount = await prisma.marketCandle.count({
      where: {
        symbol: symbol.toUpperCase(),
        timeframe,
        timestamp: { gte: start, lte: end },
      },
    });

    // If we have very few candles, try syncing recent ones from Binance
    if (candleCount < 30) {
      console.log(`Backtest warning: only ${candleCount} candles in DB. Attempting sync...`);
      await syncHistoricalCandles(symbol.toUpperCase(), timeframe, 150);
    }

    // Run strategy backtest
    const results = await runBacktestSimulation({
      symbol: symbol.toUpperCase(),
      timeframe,
      startDate: start,
      endDate: end,
    });

    // Save backtest results if there were trades
    const defaultUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (defaultUser && results.totalTrades > 0) {
      await prisma.backtest.create({
        data: {
          userId: defaultUser.id,
          symbol: symbol.toUpperCase(),
          timeframe,
          startDate: start,
          endDate: end,
          totalTrades: results.totalTrades,
          winRate: results.winRate,
          profitFactor: results.profitFactor,
          drawdown: results.drawdown,
          roi: results.roi,
          // Store results payload (JSON string or object)
          results: JSON.parse(JSON.stringify(results)),
        },
      });
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Backtest execution error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute strategy simulation" },
      { status: 500 }
    );
  }
}
