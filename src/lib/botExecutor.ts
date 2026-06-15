import { prisma } from "./db";
import { fetchLivePrices, syncHistoricalCandles } from "./binance";
import { placeLiveBinanceOrder, getAccountSpotBalance } from "./binanceOrder";
import { checkProfitBooking, checkCustomPriceAlerts } from "./profitBooking";
import { processAndSaveSignals, MONITORED_SYMBOLS } from "./signalEngine";
import { SignalStatus, SignalOutcome } from "@prisma/client";

// Global reference for interval to avoid duplicate runs during hot reloads
const globalForBot = global as unknown as {
  botInterval: NodeJS.Timeout | undefined;
  isScanning: boolean;
};

export async function runBotExecutorRound() {
  if (globalForBot.isScanning) {
    console.log("[BOT EXECUTOR] Scan already in progress. Skipping.");
    return;
  }
  
  globalForBot.isScanning = true;
  console.log("[BOT EXECUTOR] Initiating scanning round...");

  try {
    // 1. Fetch active bot settings to see if anyone has automated bot ON
    const activeBotSettings = await prisma.setting.findMany({
      where: {
        key: "auto_trading_bot",
        value: "true",
      },
    });

    if (activeBotSettings.length === 0) {
      console.log("[BOT EXECUTOR] Auto-Trading Bot is inactive for all users.");
      globalForBot.isScanning = false;
      return;
    }

    console.log(`[BOT EXECUTOR] Active bot configurations found for ${activeBotSettings.length} user(s).`);

    // 2. Fetch current prices
    const prices = await fetchLivePrices();

    // 3. Sync recent candles and evaluate profit booking / stop losses
    for (const symbol of MONITORED_SYMBOLS) {
      const currentPrice = prices[symbol];
      if (currentPrice) {
        console.log(`[BOT EXECUTOR] Syncing candles and checking exits for ${symbol} @ $${currentPrice}`);
        await syncHistoricalCandles(symbol, "1h", 100);
        await checkProfitBooking(symbol, currentPrice);
        await checkCustomPriceAlerts(symbol, currentPrice);
      }
    }

    // 4. Scan technical indicators and search for new signals
    const newSignals = await processAndSaveSignals();
    if (newSignals.length > 0) {
      console.log(`[BOT EXECUTOR] Generated ${newSignals.length} new signals. Evaluating execution...`);

      for (const setting of activeBotSettings) {
        const userId = setting.userId;

        for (const signal of newSignals) {
          // Prevent multiple open trades for the same user on the same symbol
          const existingOpenTrade = await prisma.trade.findFirst({
            where: {
              userId,
              symbol: signal.symbol,
              status: "OPEN",
            },
          });

          if (existingOpenTrade) {
            console.log(`[BOT EXECUTOR] User ${userId} already has an active trade on ${signal.symbol}. Skipping.`);
            continue;
          }

          // Fetch account Spot USDT balance to calculate position size (5%)
          const spotBalance = await getAccountSpotBalance();
          const entryPrice = signal.entryPrice;
          
          // Determine risk size (5% of spot USDT balance, or minimum 15 USDT for Binance trading limit constraints)
          const targetRiskValue = spotBalance * 0.05;
          const posValueUsdt = Math.max(targetRiskValue, 15.0);

          if (spotBalance < 10.0 && !process.env.BINANCE_API_KEY) {
            console.warn(`[BOT EXECUTOR] Insufficient balance for user ${userId}. Balance: $${spotBalance}`);
          }

          const quantity = Number((posValueUsdt / entryPrice).toFixed(5));
          const side = signal.type === "BUY" ? "BUY" : "SELL";

          console.log(`[BOT EXECUTOR] Executing order: User ${userId} | ${side} ${quantity} ${signal.symbol} @ $${entryPrice}`);

          try {
            const orderRes = await placeLiveBinanceOrder(
              signal.symbol,
              side,
              "MARKET",
              quantity
            );

            // Record the trade execution in DB
            await prisma.trade.create({
              data: {
                userId,
                signalId: (signal as any).id || null, // Will attempt to link signal if id is present
                symbol: signal.symbol,
                entryPrice: entryPrice,
                amount: quantity,
                status: "OPEN",
                binanceOrderId: orderRes ? String(orderRes.orderId) : `v_${Date.now()}`,
              },
            });

            console.log(`[BOT EXECUTOR] Auto-trade successfully filled & recorded in DB. Order ID: ${orderRes?.orderId}`);
          } catch (orderErr) {
            console.error(`[BOT EXECUTOR] Failed to route live order for User ${userId}:`, orderErr);
          }
        }
      }
    }
  } catch (error) {
    console.error("[BOT EXECUTOR] Error during execution round:", error);
  } finally {
    globalForBot.isScanning = false;
  }
}

export async function closeBinanceTradeIfLive(trade: any, signal: any, currentPrice: number) {
  if (!trade.binanceOrderId) return;
  
  // Close order side is opposite of the signal entry type
  const closeSide = signal.type === "BUY" ? "SELL" : "BUY";
  console.log(`[BOT EXECUTOR] Executing live close order on Binance for ${trade.symbol}. Side: ${closeSide}, Amount: ${trade.amount}`);
  
  try {
    await placeLiveBinanceOrder(
      trade.symbol,
      closeSide,
      "MARKET",
      trade.amount
    );
    console.log(`[BOT EXECUTOR] Binance position closed successfully for trade ${trade.id}`);
  } catch (err) {
    console.error(`[BOT EXECUTOR] Failed to execute close order on Binance for trade ${trade.id}:`, err);
  }
}

export function startBotExecutor(intervalMs: number = 60000) {
  if (globalForBot.botInterval) {
    console.log("[BOT EXECUTOR] Background scanner loop already running.");
    return;
  }

  console.log(`[BOT EXECUTOR] Starting background scanner loop (Interval: ${intervalMs}ms)...`);
  
  // Run first round immediately
  runBotExecutorRound();

  globalForBot.botInterval = setInterval(async () => {
    await runBotExecutorRound();
  }, intervalMs);
}

export function stopBotExecutor() {
  if (globalForBot.botInterval) {
    console.log("[BOT EXECUTOR] Stopping background scanner loop...");
    clearInterval(globalForBot.botInterval);
    globalForBot.botInterval = undefined;
  }
}

export function getBotExecutorStatus(): { running: boolean } {
  return {
    running: typeof globalForBot.botInterval !== "undefined",
  };
}
