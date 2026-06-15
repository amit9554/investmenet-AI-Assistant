import { PatternSignal } from "./ta";

interface EngineInput {
  trendStrength: { adx: number; plusDI: number; minusDI: number; strength: string };
  rsi: number;
  macdHist: number;
  volumeMultiplier: number;
  volatilityRatio: number; // ATR / Price
  pattern: PatternSignal;
}

export interface ConfidenceOutput {
  percentage: number;
  level: "Low" | "Medium" | "High";
}

export function calculateConfidence(input: EngineInput): ConfidenceOutput {
  let score = 50; // Base score (neutral)

  // 1. Trend Strength (Weight: 30%)
  // High ADX is strong trend. We reward trend alignment.
  const adx = input.trendStrength.adx;
  const isBullishTrend = input.trendStrength.plusDI > input.trendStrength.minusDI;
  
  let trendPoints = 0;
  if (adx > 25) {
    trendPoints += 15; // strong trend exists
  }
  if (adx > 40) {
    trendPoints += 5; // very strong trend
  }
  
  // Align with pattern or direction
  if (input.pattern.direction === "BULLISH" && isBullishTrend) {
    trendPoints += 10;
  } else if (input.pattern.direction === "BEARISH" && !isBullishTrend) {
    trendPoints += 10;
  }
  score += trendPoints - 10; // offset base

  // 2. Momentum (RSI) (Weight: 20%)
  let momentumPoints = 0;
  if (input.pattern.direction === "BULLISH") {
    if (input.rsi > 50 && input.rsi < 70) {
      momentumPoints += 20; // Bullish momentum zone
    } else if (input.rsi <= 30) {
      momentumPoints += 15; // Deep oversold (reversal buy)
    } else if (input.rsi >= 75) {
      momentumPoints -= 10; // Overbought, risk is higher
    }
  } else if (input.pattern.direction === "BEARISH") {
    if (input.rsi < 50 && input.rsi > 30) {
      momentumPoints += 20; // Bearish momentum zone
    } else if (input.rsi >= 70) {
      momentumPoints += 15; // Deep overbought (reversal sell)
    } else if (input.rsi <= 25) {
      momentumPoints -= 10; // Oversold, risk is higher
    }
  }
  score += momentumPoints - 5;

  // 3. Volume Support (Weight: 20%)
  let volumePoints = 0;
  if (input.volumeMultiplier > 1.8) {
    volumePoints += 20; // Massive institutional support
  } else if (input.volumeMultiplier > 1.2) {
    volumePoints += 15; // Average volume confirmation
  } else if (input.volumeMultiplier < 0.7) {
    volumePoints -= 10; // Dry volume, lower probability
  }
  score += volumePoints;

  // 4. Pattern Weight (Weight: 15%)
  let patternPoints = 0;
  if (input.pattern.type === "BREAKOUT") {
    patternPoints += 15; // Breakouts have high follow-through
  } else if (input.pattern.type === "REVERSAL") {
    patternPoints += 10; // Reversals are slightly riskier but valid
  }
  score += patternPoints;

  // 5. Volatility Safety (Weight: 15%)
  // If ATR relative to price is extremely high, slippage/risk is higher, so adjust slightly
  if (input.volatilityRatio > 0.05) {
    score -= 5; // Extra high volatility, slightly reduce confidence
  } else if (input.volatilityRatio > 0.01 && input.volatilityRatio <= 0.03) {
    score += 5; // Healthy trading volatility
  }

  // Ensure bounds
  const percentage = Math.max(30, Math.min(98, Math.round(score)));
  
  let level: "Low" | "Medium" | "High" = "Medium";
  if (percentage < 60) level = "Low";
  else if (percentage >= 75) level = "High";

  return { percentage, level };
}
