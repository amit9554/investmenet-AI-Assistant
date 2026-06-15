import { prisma } from "./db";
import { Candle, calculateEMA, calculateRSI } from "./ta";

interface BacktestInput {
  symbol: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
}

export interface BacktestTrade {
  type: "BUY" | "SELL";
  entryTime: Date;
  entryPrice: number;
  exitTime: Date;
  exitPrice: number;
  pnlPercent: number;
  profitLoss: number;
  balanceAfter: number;
  outcome: "WIN" | "LOSS";
}

export interface BacktestResult {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  drawdown: number;
  roi: number;
  initialBalance: number;
  finalBalance: number;
  trades: BacktestTrade[];
  equityCurve: { time: string; balance: number }[];
}

export async function runBacktestSimulation(input: BacktestInput): Promise<BacktestResult> {
  const { symbol, timeframe, startDate, endDate } = input;

  // 1. Fetch candles in range
  const candleRecords = await prisma.marketCandle.findMany({
    where: {
      symbol,
      timeframe,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: "asc" },
  });

  const initialBalance = 10000;
  let balance = initialBalance;
  const trades: BacktestTrade[] = [];
  const equityCurve: { time: string; balance: number }[] = [
    { time: startDate.toLocaleDateString(), balance: initialBalance },
  ];

  if (candleRecords.length < 50) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      profitFactor: 0,
      drawdown: 0,
      roi: 0,
      initialBalance,
      finalBalance: balance,
      trades: [],
      equityCurve,
    };
  }

  // 2. Map candles and calculate indicators
  const candles: Candle[] = candleRecords.map((c) => ({
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    timestamp: c.timestamp,
  }));

  const closes = candles.map((c) => c.close);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes, 14);

  let inPosition = false;
  let positionType: "BUY" | "SELL" | null = null;
  let entryPrice = 0;
  let entryTime: Date | null = null;
  let stopLoss = 0;
  let takeProfit = 0;
  let riskPerTradePercent = 2; // 2% risk of account balance
  let peakBalance = initialBalance;
  let maxDrawdown = 0;

  // 3. Loop candles to simulate trading
  for (let i = 50; i < candles.length; i++) {
    const currentPrice = candles[i].close;
    const currentTime = candles[i].timestamp;
    const currentRsi = rsi[i];

    // Peak Balance tracker for drawdown
    if (balance > peakBalance) {
      peakBalance = balance;
    }
    const currentDrawdown = ((peakBalance - balance) / peakBalance) * 100;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    if (inPosition) {
      // Check for Exit
      let exitTriggered = false;
      let exitPriceValue = currentPrice;

      if (positionType === "BUY") {
        if (candles[i].low <= stopLoss) {
          exitTriggered = true;
          exitPriceValue = stopLoss; // Hit stop loss
        } else if (candles[i].high >= takeProfit) {
          exitTriggered = true;
          exitPriceValue = takeProfit; // Hit take profit
        }
      } else {
        // SELL position exits
        if (candles[i].high >= stopLoss) {
          exitTriggered = true;
          exitPriceValue = stopLoss;
        } else if (candles[i].low <= takeProfit) {
          exitTriggered = true;
          exitPriceValue = takeProfit;
        }
      }

      if (exitTriggered) {
        // Calculate P&L
        const positionSize = (balance * (riskPerTradePercent / 100)) / Math.abs(entryPrice - stopLoss);
        const pnl = positionType === "BUY"
          ? (exitPriceValue - entryPrice) * positionSize
          : (entryPrice - exitPriceValue) * positionSize;

        const pnlPercent = positionType === "BUY"
          ? ((exitPriceValue - entryPrice) / entryPrice) * 100
          : ((entryPrice - exitPriceValue) / entryPrice) * 100;

        balance += pnl;

        trades.push({
          type: positionType!,
          entryTime: entryTime!,
          entryPrice,
          exitTime: currentTime,
          exitPrice: exitPriceValue,
          pnlPercent,
          profitLoss: pnl,
          balanceAfter: balance,
          outcome: pnl > 0 ? "WIN" : "LOSS",
        });

        equityCurve.push({
          time: currentTime.toLocaleDateString(),
          balance: Number(balance.toFixed(2)),
        });

        inPosition = false;
        positionType = null;
      }
    } else {
      // Check for Entry
      const prevEma20 = ema20[i - 1];
      const prevEma50 = ema50[i - 1];
      const curEma20 = ema20[i];
      const curEma50 = ema50[i];

      // EMA Crossover logic for backtesting
      const emaBullishCross = prevEma20 <= prevEma50 && curEma20 > curEma50;
      const emaBearishCross = prevEma20 >= prevEma50 && curEma20 < curEma50;

      if (emaBullishCross && currentRsi > 45 && currentRsi < 65) {
        // Enter BUY
        inPosition = true;
        positionType = "BUY";
        entryPrice = currentPrice;
        entryTime = currentTime;
        
        // SL is 1.5 ATR (estimated at 1.5% of price for simplicity in backtest historical logs)
        const atrValue = currentPrice * 0.015;
        stopLoss = currentPrice - 1.5 * atrValue;
        takeProfit = currentPrice + 2.5 * atrValue; // 1 : 1.66 R:R
      } else if (emaBearishCross && currentRsi < 55 && currentRsi > 35) {
        // Enter SELL
        inPosition = true;
        positionType = "SELL";
        entryPrice = currentPrice;
        entryTime = currentTime;

        const atrValue = currentPrice * 0.015;
        stopLoss = currentPrice + 1.5 * atrValue;
        takeProfit = currentPrice - 2.5 * atrValue;
      }
    }
  }

  // 4. Summarize statistics
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.outcome === "WIN").length;
  const losses = totalTrades - wins;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  
  let grossProfits = 0;
  let grossLosses = 0;
  for (const t of trades) {
    if (t.profitLoss > 0) grossProfits += t.profitLoss;
    else grossLosses += Math.abs(t.profitLoss);
  }
  const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : grossProfits > 0 ? 99.9 : 1.0;
  const roi = ((balance - initialBalance) / initialBalance) * 100;

  return {
    totalTrades,
    wins,
    losses,
    winRate: Number(winRate.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    drawdown: Number(maxDrawdown.toFixed(2)),
    roi: Number(roi.toFixed(2)),
    initialBalance,
    finalBalance: Number(balance.toFixed(2)),
    trades,
    equityCurve,
  };
}
