import { prisma } from "./db";
import {
  Candle,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateATR,
  calculateVWAP,
  calculateTrendStrength,
  detectSupportResistance,
  detectBreakoutsAndReversals,
} from "./ta";
import { calculateConfidence } from "./confidenceEngine";
import { SignalType, SignalStatus, SignalOutcome } from "@prisma/client";

// Monitored assets
export const MONITORED_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "NIFTY", "SENSEX", "RELIANCE", "TCS", "INFY"];

export interface GeneratedSignal {
  symbol: string;
  type: SignalType;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: number;
  confidenceScore: number;
  confidenceLevel: string;
  description: string;
}

export async function runSignalAnalysis(symbol: string, timeframe: string = "1h"): Promise<GeneratedSignal | null> {
  // 1. Fetch candles from DB
  const candleRecords = await prisma.marketCandle.findMany({
    where: { symbol, timeframe },
    orderBy: { timestamp: "asc" },
    take: 120, // Fetch past 120 candles for proper indicator warm-up
  });

  if (candleRecords.length < 60) {
    console.log(`Insufficient candle history for ${symbol} (${timeframe}): ${candleRecords.length} records`);
    return null;
  }

  // 2. Map DB records to TA Candle format
  const candles: Candle[] = candleRecords.map((c) => ({
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
    timestamp: c.timestamp,
  }));

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const currentPrice = closes[closes.length - 1];

  // 3. Compute indicators
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const atr = calculateATR(candles, 14);
  const vwap = calculateVWAP(candles);

  const currentEma20 = ema20[ema20.length - 1];
  const currentEma50 = ema50[ema50.length - 1];
  const currentRsi = rsi[rsi.length - 1];
  const currentMacdHist = macd.histogram[macd.histogram.length - 1];
  const currentAtr = atr[atr.length - 1] || (currentPrice * 0.015);
  const currentVwap = vwap[vwap.length - 1];

  // Volume multiplier compared to 20-period average
  const avgVolume20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentVolume = volumes[volumes.length - 1];
  const volumeMultiplier = avgVolume20 > 0 ? currentVolume / avgVolume20 : 1.0;

  // Support and Resistance Zones
  const zones = detectSupportResistance(candles);
  const pattern = detectBreakoutsAndReversals(candles, zones);

  // Volatility safety ratio
  const volatilityRatio = currentAtr / currentPrice;

  // 4. Direction decision based on indicators
  let direction: "BUY" | "SELL" | null = null;
  let triggerReason = "";

  const isEmaBullish = currentEma20 > currentEma50;
  const isRsiBullish = currentRsi > 50 && currentRsi < 70;
  const isVolumeHigh = volumeMultiplier > 1.1;

  // BUY CONDITIONS
  if (
    (isEmaBullish && isRsiBullish && isVolumeHigh) ||
    (pattern.type === "BREAKOUT" && pattern.direction === "BULLISH") ||
    (pattern.type === "REVERSAL" && pattern.direction === "BULLISH" && currentRsi < 45)
  ) {
    direction = "BUY";
    triggerReason = pattern.type !== "NONE" ? pattern.description : "EMA alignment with high momentum volume support.";
  }

  // SELL CONDITIONS
  const isEmaBearish = currentEma20 < currentEma50;
  const isRsiBearish = currentRsi < 50 && currentRsi > 30;

  if (
    (isEmaBearish && isRsiBearish && isVolumeHigh) ||
    (pattern.type === "BREAKOUT" && pattern.direction === "BEARISH") ||
    (pattern.type === "REVERSAL" && pattern.direction === "BEARISH" && currentRsi > 55)
  ) {
    direction = "SELL";
    triggerReason = pattern.type !== "NONE" ? pattern.description : "Bearish trend crossovers with weakening RSI.";
  }

  if (!direction) {
    return null;
  }

  // 5. Calculate Stop Loss & Take Profit
  let stopLoss = 0;
  let takeProfit1 = 0;
  let takeProfit2 = 0;
  let rrRatio = 1.5;

  // Find nearest support/resistance to place stop loss
  const supportLevels = zones.filter((z) => z.type === "SUPPORT").map((z) => z.price);
  const resistanceLevels = zones.filter((z) => z.type === "RESISTANCE").map((z) => z.price);

  if (direction === "BUY") {
    // Stop Loss is lower of (currentPrice - 1.5 * ATR) or the nearest support level
    const atrStop = currentPrice - 1.8 * currentAtr;
    const nearestSupport = supportLevels.find((price) => price < currentPrice);
    stopLoss = nearestSupport ? Math.max(atrStop, nearestSupport * 0.995) : atrStop;
    
    // Risk size
    const risk = currentPrice - stopLoss;
    
    // Take profits based on risk size (TP1 = 1.5R, TP2 = 3.0R)
    takeProfit1 = currentPrice + risk * 1.5;
    takeProfit2 = currentPrice + risk * 3.0;
    rrRatio = (takeProfit1 - currentPrice) / risk;
  } else {
    // Sell SL is higher of (currentPrice + 1.8 * ATR) or nearest resistance
    const atrStop = currentPrice + 1.8 * currentAtr;
    const nearestResistance = resistanceLevels.find((price) => price > currentPrice);
    stopLoss = nearestResistance ? Math.min(atrStop, nearestResistance * 1.005) : atrStop;

    const risk = stopLoss - currentPrice;
    takeProfit1 = currentPrice - risk * 1.5;
    takeProfit2 = currentPrice - risk * 3.0;
    rrRatio = (currentPrice - takeProfit1) / risk;
  }

  // 6. Calculate Trend Strength DI & ADX
  const trendStrength = {
    adx: 25,
    plusDI: direction === "BUY" ? 30 : 15,
    minusDI: direction === "BUY" ? 15 : 30,
    strength: "Neutral",
  };

  try {
    const computedTrend = calculateTrendStrength(candles, 14);
    trendStrength.adx = computedTrend.adx;
    trendStrength.plusDI = computedTrend.plusDI;
    trendStrength.minusDI = computedTrend.minusDI;
    trendStrength.strength = computedTrend.strength;
  } catch (e) {
    console.error("Trend strength calculations fallback: ", e);
  }

  // 7. Calculate Confidence Score
  const confidence = calculateConfidence({
    trendStrength,
    rsi: currentRsi,
    macdHist: currentMacdHist,
    volumeMultiplier,
    volatilityRatio,
    pattern: {
      type: pattern.type,
      direction: direction === "BUY" ? "BULLISH" : "BEARISH",
      description: triggerReason,
    },
  });

  // Filter signals below 60% confidence
  if (confidence.percentage < 60) {
    return null;
  }

  // Return the signal details
  return {
    symbol,
    type: direction === "BUY" ? SignalType.BUY : SignalType.SELL,
    entryPrice: Number(currentPrice.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    takeProfit1: Number(takeProfit1.toFixed(2)),
    takeProfit2: Number(takeProfit2.toFixed(2)),
    riskReward: Number(rrRatio.toFixed(2)),
    confidenceScore: confidence.percentage,
    confidenceLevel: confidence.level,
    description: triggerReason,
  };
}

export async function processAndSaveSignals(): Promise<GeneratedSignal[]> {
  const newSignals: GeneratedSignal[] = [];

  for (const symbol of MONITORED_SYMBOLS) {
    try {
      const signal = await runSignalAnalysis(symbol, "1h");
      if (signal) {
        // Save to DB
        await prisma.signal.create({
          data: {
            symbol: signal.symbol,
            type: signal.type,
            entryPrice: signal.entryPrice,
            stopLoss: signal.stopLoss,
            takeProfit1: signal.takeProfit1,
            takeProfit2: signal.takeProfit2,
            riskReward: signal.riskReward,
            confidenceScore: signal.confidenceScore,
            confidenceLevel: signal.confidenceLevel,
            description: signal.description,
            status: SignalStatus.OPEN,
            outcome: SignalOutcome.PENDING,
          },
        });
        
        newSignals.push(signal);
        console.log(`[SIGNAL GENERATED] ${signal.type} ${signal.symbol} @ ${signal.entryPrice} with ${signal.confidenceScore}% confidence.`);
      }
    } catch (err) {
      console.error(`Error processing signal for ${symbol}:`, err);
    }
  }

  return newSignals;
}
