import { prisma } from "./db";
import { sendAlertNotification } from "./alerts";
import { SignalStatus, SignalOutcome } from "@prisma/client";
import { placeLiveBinanceOrder } from "./binanceOrder";

export async function checkProfitBooking(symbol: string, currentPrice: number): Promise<void> {
  // 1. Fetch all OPEN signals for this symbol
  const openSignals = await prisma.signal.findMany({
    where: {
      symbol,
      status: SignalStatus.OPEN,
    },
  });

  for (const signal of openSignals) {
    let triggered = false;
    let title = "";
    let message = "";
    let outcome: SignalOutcome = SignalOutcome.PENDING;
    let nextStatus: SignalStatus = SignalStatus.OPEN;
    let pnlPercent = 0;

    const isBuy = signal.type === "BUY";

    // Stop Loss Hit
    if (isBuy ? currentPrice <= signal.stopLoss : currentPrice >= signal.stopLoss) {
      triggered = true;
      nextStatus = SignalStatus.CLOSED;
      outcome = SignalOutcome.LOSS;
      pnlPercent = isBuy
        ? ((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100
        : ((signal.entryPrice - signal.stopLoss) / signal.entryPrice) * 100;
      title = `Stop Loss Triggered`;
      message = `Stop Loss hit for ${symbol} ${signal.type} at price $${currentPrice.toFixed(2)}. Entry: $${signal.entryPrice}. PnL: ${pnlPercent.toFixed(2)}%`;
    }
    // Take Profit 2 Hit
    else if (isBuy ? currentPrice >= signal.takeProfit2 : currentPrice <= signal.takeProfit2) {
      triggered = true;
      nextStatus = SignalStatus.CLOSED;
      outcome = SignalOutcome.WIN;
      pnlPercent = isBuy
        ? ((signal.takeProfit2 - signal.entryPrice) / signal.entryPrice) * 100
        : ((signal.entryPrice - signal.takeProfit2) / signal.entryPrice) * 100;
      title = `Take Profit 2 Reached`;
      message = `Take Profit 2 reached for ${symbol} ${signal.type} at price $${currentPrice.toFixed(2)}. Entry: $${signal.entryPrice}. PnL: ${pnlPercent.toFixed(2)}%`;
    }
    // Take Profit 1 Hit
    else if (isBuy ? currentPrice >= signal.takeProfit1 : currentPrice <= signal.takeProfit1) {
      // Check if we already created a TP1 notification for this signal to avoid spamming
      const existingAlert = await prisma.alert.findFirst({
        where: {
          symbol,
          type: "SIGNAL_TP1_HIT",
          value: signal.takeProfit1,
          isTriggered: true,
        },
      });

      if (!existingAlert) {
        triggered = true;
        // Keep the signal OPEN for TP2 target, but log the TP1 hit
        nextStatus = SignalStatus.OPEN;
        outcome = SignalOutcome.PENDING;
        pnlPercent = isBuy
          ? ((signal.takeProfit1 - signal.entryPrice) / signal.entryPrice) * 100
          : ((signal.entryPrice - signal.takeProfit1) / signal.entryPrice) * 100;
        title = `Take Profit 1 Reached`;
        message = `Take Profit 1 hit for ${symbol} ${signal.type} at price $${currentPrice.toFixed(2)}. Entry: $${signal.entryPrice}. PnL: ${pnlPercent.toFixed(2)}%`;

        // Create a record in user alerts to mark this TP1 as sent
        try {
          const defaultUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
          if (defaultUser) {
            await prisma.alert.create({
              data: {
                userId: defaultUser.id,
                symbol,
                type: "SIGNAL_TP1_HIT",
                condition: "HIT",
                value: signal.takeProfit1,
                isTriggered: true,
                isSent: true,
                channels: ["IN_APP"],
              },
            });
          }
        } catch (dbErr) {
          console.error("Failed to log TP1 hit alert: ", dbErr);
        }
      }
    }

    if (triggered) {
      // If closing signal, update the database
      if (nextStatus === SignalStatus.CLOSED) {
        await prisma.signal.update({
          where: { id: signal.id },
          data: {
            status: nextStatus,
            outcome,
            profitLossPercent: pnlPercent,
          },
        });

        // Close virtual/live trades linked to this signal
        const activeTrades = await prisma.trade.findMany({
          where: { signalId: signal.id, status: "OPEN" },
        });

        for (const trade of activeTrades) {
          const profitLoss = trade.amount * trade.entryPrice * (pnlPercent / 100);

          // Execute exit order on Binance if it was placed live
          if (trade.binanceOrderId) {
            try {
              const closeSide = signal.type === "BUY" ? "SELL" : "BUY";
              console.log(`[PROFIT BOOKING] Closing Binance position for ${trade.symbol}. Side: ${closeSide}, Amount: ${trade.amount}`);
              await placeLiveBinanceOrder(
                trade.symbol,
                closeSide,
                "MARKET",
                trade.amount
              );
            } catch (err) {
              console.error(`[PROFIT BOOKING] Failed to close Binance position for trade ${trade.id}:`, err);
            }
          }

          await prisma.trade.update({
            where: { id: trade.id },
            data: {
              status: "CLOSED",
              exitPrice: currentPrice,
              profitLoss,
            },
          });
        }
      }

      // Dispatch alert to in-app/Telegram/email channels
      await sendAlertNotification({
        title,
        message,
        symbol,
        price: currentPrice,
        confidence: signal.confidenceScore,
      });
    }
  }
}

// User-defined custom price alert monitor
export async function checkCustomPriceAlerts(symbol: string, currentPrice: number): Promise<void> {
  const alerts = await prisma.alert.findMany({
    where: {
      symbol,
      isTriggered: false,
      type: "PRICE",
    },
  });

  for (const alert of alerts) {
    let triggered = false;

    if (alert.condition === "ABOVE" && currentPrice >= alert.value) {
      triggered = true;
    } else if (alert.condition === "BELOW" && currentPrice <= alert.value) {
      triggered = true;
    }

    if (triggered) {
      // Update DB
      await prisma.alert.update({
        where: { id: alert.id },
        data: {
          isTriggered: true,
          isSent: true,
        },
      });

      // Dispatch notifications
      await sendAlertNotification({
        title: `Price Alert Triggered`,
        message: `Alert condition met: ${symbol} is now ${alert.condition.toLowerCase()} ${alert.value}. Current price: $${currentPrice.toFixed(2)}.`,
        symbol,
        price: currentPrice,
      });
    }
  }
}
