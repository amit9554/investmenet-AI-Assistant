export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
}

// 1. Calculate Simple Moving Average (SMA)
export function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  if (prices.length < period) return sma;
  
  for (let i = 0; i <= prices.length - period; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i + j];
    }
    sma.push(sum / period);
  }
  return sma;
}

// 2. Calculate Exponential Moving Average (EMA)
export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  if (prices.length < period) return ema;

  const k = 2 / (period + 1);
  
  // Start with SMA as first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let currentEma = sum / period;
  
  // Pad the beginning with nulls or just push the first EMA for index matching
  // To keep indexing clean, we'll return an array of the same length as prices,
  // filling initial elements with the SMA or null values.
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      ema.push(prices[i]); // Fill with raw price or dummy value
    } else if (i === period - 1) {
      ema.push(currentEma);
    } else {
      currentEma = prices[i] * k + currentEma * (1 - k);
      ema.push(currentEma);
    }
  }
  return ema;
}

// 3. Calculate Relative Strength Index (RSI)
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  if (prices.length <= period) {
    return new Array(prices.length).fill(50); // Default to neutral
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      gains.push(diff);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(diff));
    }
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Fill initial values with 50
  for (let i = 0; i <= period; i++) {
    rsi.push(50);
  }

  for (let i = period; i < prices.length - 1; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

// 4. Calculate MACD
export interface MACDResult {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
}

export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const fastEma = calculateEMA(prices, fastPeriod);
  const slowEma = calculateEMA(prices, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    macdLine.push(fastEma[i] - slowEma[i]);
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);
  const histogram: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }

  return { macdLine, signalLine, histogram };
}

// 5. Calculate Average True Range (ATR)
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  const atr: number[] = [];
  if (candles.length < 2) return new Array(candles.length).fill(0);

  const trueRanges: number[] = [candles[0].high - candles[0].low];

  for (let i = 1; i < candles.length; i++) {
    const highLow = candles[i].high - candles[i].low;
    const highPrevClose = Math.abs(candles[i].high - candles[i - 1].close);
    const lowPrevClose = Math.abs(candles[i].low - candles[i - 1].close);
    
    const tr = Math.max(highLow, highPrevClose, lowPrevClose);
    trueRanges.push(tr);
  }

  // Calculate first ATR value (SMA of True Ranges)
  let sumTR = 0;
  for (let i = 0; i < Math.min(period, trueRanges.length); i++) {
    sumTR += trueRanges[i];
  }
  let currentAtr = sumTR / Math.min(period, trueRanges.length);

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      atr.push(trueRanges[i]);
    } else if (i === period - 1) {
      atr.push(currentEmaAtr(trueRanges.slice(0, period), period));
    } else {
      currentAtr = (currentAtr * (period - 1) + trueRanges[i]) / period;
      atr.push(currentAtr);
    }
  }

  return atr;
}

function currentEmaAtr(values: number[], period: number): number {
  return values.reduce((sum, v) => sum + v, 0) / period;
}

// 6. Calculate Bollinger Bands
export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsResult {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      middle.push(prices[i]);
      upper.push(prices[i]);
      lower.push(prices[i]);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const sma = slice.reduce((sum, p) => sum + p, 0) / period;
      
      const variance = slice.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      middle.push(sma);
      upper.push(sma + stdDevMultiplier * stdDev);
      lower.push(sma - stdDevMultiplier * stdDev);
    }
  }

  return { upper, middle, lower };
}

// 7. Calculate VWAP (Volume Weighted Average Price)
export function calculateVWAP(candles: Candle[]): number[] {
  const vwap: number[] = [];
  let cumulativeTypicalPriceVolume = 0;
  let cumulativeVolume = 0;

  // Resets cumulative stats daily (or accumulates across series depending on standard)
  // Here we do standard cumulative accumulation over the series.
  for (let i = 0; i < candles.length; i++) {
    const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
    cumulativeTypicalPriceVolume += typicalPrice * candles[i].volume;
    cumulativeVolume += candles[i].volume;

    if (cumulativeVolume === 0) {
      vwap.push(candles[i].close);
    } else {
      vwap.push(cumulativeTypicalPriceVolume / cumulativeVolume);
    }
  }

  return vwap;
}

// 8. Calculate Volume Profile
export interface VolumeProfileBin {
  price: number;
  volume: number;
}

export function calculateVolumeProfile(candles: Candle[], binsCount: number = 12): VolumeProfileBin[] {
  if (candles.length === 0) return [];

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  for (const c of candles) {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  }

  const range = maxPrice - minPrice;
  if (range === 0) return [{ price: minPrice, volume: 1 }];

  const binWidth = range / binsCount;
  const bins: VolumeProfileBin[] = Array.from({ length: binsCount }, (_, i) => ({
    price: minPrice + binWidth * i + binWidth / 2,
    volume: 0,
  }));

  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    let binIdx = Math.floor((typicalPrice - minPrice) / binWidth);
    if (binIdx >= binsCount) binIdx = binsCount - 1;
    if (binIdx < 0) binIdx = 0;
    
    bins[binIdx].volume += c.volume;
  }

  return bins;
}

// 9. Calculate Trend Strength (ADX approximation)
export function calculateTrendStrength(candles: Candle[], period: number = 14): { adx: number; plusDI: number; minusDI: number; strength: string } {
  if (candles.length < period * 2) {
    return { adx: 20, plusDI: 20, minusDI: 20, strength: "Weak" };
  }

  const plusDM: number[] = [0];
  const minusDM: number[] = [0];

  for (let i = 1; i < candles.length; i++) {
    const highDiff = candles[i].high - candles[i - 1].high;
    const lowDiff = candles[i - 1].low - candles[i].low;

    if (highDiff > lowDiff && highDiff > 0) {
      plusDM.push(highDiff);
    } else {
      plusDM.push(0);
    }

    if (lowDiff > highDiff && lowDiff > 0) {
      minusDM.push(lowDiff);
    } else {
      minusDM.push(0);
    }
  }

  const tr = calculateATR(candles, period);
  const smoothedPlusDM: number[] = [];
  const smoothedMinusDM: number[] = [];

  let sumPlus = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let sumMinus = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  smoothedPlusDM.push(sumPlus);
  smoothedMinusDM.push(sumMinus);

  for (let i = period; i < candles.length; i++) {
    sumPlus = sumPlus - sumPlus / period + plusDM[i];
    sumMinus = sumMinus - sumMinus / period + minusDM[i];
    smoothedPlusDM.push(sumPlus);
    smoothedMinusDM.push(sumMinus);
  }

  const plusDI: number[] = [];
  const minusDI: number[] = [];
  const dx: number[] = [];

  for (let i = 0; i < smoothedPlusDM.length; i++) {
    const atrValue = tr[i + period - 1] || 1;
    const diPlus = (smoothedPlusDM[i] / atrValue) * 100;
    const diMinus = (smoothedMinusDM[i] / atrValue) * 100;

    plusDI.push(diPlus);
    minusDI.push(diMinus);

    const sumDI = diPlus + diMinus;
    const diffDI = Math.abs(diPlus - diMinus);

    dx.push(sumDI === 0 ? 0 : (diffDI / sumDI) * 100);
  }

  const adxValues = calculateEMA(dx, period);
  const latestAdx = adxValues[adxValues.length - 1] || 25;
  const latestPlusDI = plusDI[plusDI.length - 1] || 25;
  const latestMinusDI = minusDI[minusDI.length - 1] || 25;

  let strength = "Neutral";
  if (latestAdx < 20) strength = "Weak";
  else if (latestAdx < 25) strength = "Neutral";
  else if (latestAdx < 40) strength = "Strong";
  else strength = "Very Strong";

  return {
    adx: Math.round(latestAdx),
    plusDI: Math.round(latestPlusDI),
    minusDI: Math.round(latestMinusDI),
    strength,
  };
}

// 10. Detect Support and Resistance Zones
export interface LevelZone {
  price: number;
  hits: number;
  type: "SUPPORT" | "RESISTANCE";
}

export function detectSupportResistance(candles: Candle[], tolerancePercent: number = 1.0): LevelZone[] {
  if (candles.length < 10) return [];

  const pivots: { price: number; type: "SUPPORT" | "RESISTANCE" }[] = [];

  // Local fractal reversals (left/right window of 3)
  for (let i = 3; i < candles.length - 3; i++) {
    const c = candles[i];
    const isResistance =
      c.high > candles[i - 1].high &&
      c.high > candles[i - 2].high &&
      c.high > candles[i - 3].high &&
      c.high > candles[i + 1].high &&
      c.high > candles[i + 2].high &&
      c.high > candles[i + 3].high;

    const isSupport =
      c.low < candles[i - 1].low &&
      c.low < candles[i - 2].low &&
      c.low < candles[i - 3].low &&
      c.low < candles[i + 1].low &&
      c.low < candles[i + 2].low &&
      c.low < candles[i + 3].low;

    if (isResistance) pivots.push({ price: c.high, type: "RESISTANCE" });
    if (isSupport) pivots.push({ price: c.low, type: "SUPPORT" });
  }

  // Cluster pivots that are close to each other
  const zones: LevelZone[] = [];

  for (const pivot of pivots) {
    let clustered = false;
    for (const zone of zones) {
      const pctDiff = (Math.abs(zone.price - pivot.price) / zone.price) * 100;
      if (pctDiff <= tolerancePercent && zone.type === pivot.type) {
        zone.price = (zone.price * zone.hits + pivot.price) / (zone.hits + 1);
        zone.hits += 1;
        clustered = true;
        break;
      }
    }
    if (!clustered) {
      zones.push({ price: pivot.price, hits: 1, type: pivot.type });
    }
  }

  // Sort by strength (hits)
  return zones.sort((a, b) => b.hits - a.hits).slice(0, 6);
}

// 11. Detect Breakouts, Pullbacks and reversals
export interface PatternSignal {
  type: "BREAKOUT" | "PULLBACK" | "REVERSAL" | "NONE";
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  description: string;
}

export function detectBreakoutsAndReversals(candles: Candle[], zones: LevelZone[]): PatternSignal {
  if (candles.length < 5 || zones.length === 0) {
    return { type: "NONE", direction: "NEUTRAL", description: "Insufficient data" };
  }

  const currentCandle = candles[candles.length - 1];
  const previousCandle = candles[candles.length - 2];
  
  // Calculate average volume
  const avgVolume = candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / 20;
  
  // 1. Breakout detection
  const resistances = zones.filter(z => z.type === "RESISTANCE");
  const supports = zones.filter(z => z.type === "SUPPORT");

  for (const res of resistances) {
    if (
      currentCandle.close > res.price &&
      previousCandle.close <= res.price &&
      currentCandle.volume > avgVolume * 1.3
    ) {
      return {
        type: "BREAKOUT",
        direction: "BULLISH",
        description: `Bullish breakout above resistance zone at $${res.price.toFixed(2)} on above-average volume.`,
      };
    }
  }

  for (const sup of supports) {
    if (
      currentCandle.close < sup.price &&
      previousCandle.close >= sup.price &&
      currentCandle.volume > avgVolume * 1.3
    ) {
      return {
        type: "BREAKOUT",
        direction: "BEARISH",
        description: `Bearish breakdown below support zone at $${sup.price.toFixed(2)} on above-average volume.`,
      };
    }
  }

  // 2. Trend Reversal via EMA crossover
  const closes = candles.map(c => c.close);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  const len = closes.length;
  if (len > 3) {
    const prevEma20 = ema20[len - 2];
    const prevEma50 = ema50[len - 2];
    const curEma20 = ema20[len - 1];
    const curEma50 = ema50[len - 1];

    if (prevEma20 <= prevEma50 && curEma20 > curEma50) {
      return {
        type: "REVERSAL",
        direction: "BULLISH",
        description: "Bullish Trend Reversal: EMA 20 crossed above EMA 50 (Golden Cross approximation).",
      };
    }

    if (prevEma20 >= prevEma50 && curEma20 < curEma50) {
      return {
        type: "REVERSAL",
        direction: "BEARISH",
        description: "Bearish Trend Reversal: EMA 20 crossed below EMA 50 (Death Cross approximation).",
      };
    }
  }

  // 3. Support/Resistance Rejections (Reversals)
  for (const res of resistances) {
    if (
      currentCandle.high >= res.price * 0.99 &&
      currentCandle.close < res.price &&
      currentCandle.close < currentCandle.open && // red candle
      previousCandle.close > previousCandle.open // green candle
    ) {
      return {
        type: "REVERSAL",
        direction: "BEARISH",
        description: `Bearish rejection at resistance zone of $${res.price.toFixed(2)}.`,
      };
    }
  }

  for (const sup of supports) {
    if (
      currentCandle.low <= sup.price * 1.01 &&
      currentCandle.close > sup.price &&
      currentCandle.close > currentCandle.open && // green candle
      previousCandle.close < previousCandle.open // red candle
    ) {
      return {
        type: "REVERSAL",
        direction: "BULLISH",
        description: `Bullish bounce from support zone of $${sup.price.toFixed(2)}.`,
      };
    }
  }

  return { type: "NONE", direction: "NEUTRAL", description: "Trend is continuing normally." };
}
