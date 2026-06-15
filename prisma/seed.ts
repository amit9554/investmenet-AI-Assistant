import { PrismaClient, Role, SignalType, SignalStatus, SignalOutcome } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // 1. Clean existing records
  await prisma.setting.deleteMany({});
  await prisma.sentiment.deleteMany({});
  await prisma.backtest.deleteMany({});
  await prisma.marketCandle.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.trade.deleteMany({});
  await prisma.signal.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleared.");

  // 2. Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("adminpassword", salt);
  const userPasswordHash = await bcrypt.hash("userpassword", salt);

  const admin = await prisma.user.create({
    data: {
      email: "admin@tradingai.com",
      name: "Admin Assistant",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: "user@tradingai.com",
      name: "Pro Trader",
      passwordHash: userPasswordHash,
      role: Role.USER,
    },
  });

  console.log(`Users created: Admin (${admin.email}), User (${user.email})`);

  // 3. Create Subscriptions
  await prisma.subscription.create({
    data: {
      userId: user.id,
      tier: "PRO",
      status: "ACTIVE",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // 4. Create Settings
  await prisma.setting.createMany({
    data: [
      { userId: user.id, key: "telegram_notifications", value: "true" },
      { userId: user.id, key: "email_notifications", value: "true" },
      { userId: user.id, key: "telegram_chat_id", value: "123456789" },
      { userId: admin.id, key: "system_alert_level", value: "high" },
    ],
  });

  // 5. Create Sentiments
  await prisma.sentiment.createMany({
    data: [
      {
        fearGreedScore: 75,
        fearGreedValue: "Greed",
        bullishCount: 65,
        bearishCount: 15,
        neutralCount: 20,
        score: 75.0,
        source: "Alternative.me & News Aggregate",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        fearGreedScore: 78,
        fearGreedValue: "Greed",
        bullishCount: 72,
        bearishCount: 10,
        neutralCount: 18,
        score: 80.5,
        source: "Alternative.me & News Aggregate",
        timestamp: new Date(),
      },
    ],
  });

  console.log("Sentiment data seeded.");

  // 6. Generate Historical Candle Data (100 daily candles for BTC, ETH, SOL, BNB, XRP)
  const symbols = [
    { name: "BTCUSDT", basePrice: 68500 },
    { name: "ETHUSDT", basePrice: 3500 },
    { name: "SOLUSDT", basePrice: 160 },
    { name: "BNBUSDT", basePrice: 590 },
    { name: "XRPUSDT", basePrice: 0.65 },
    { name: "NIFTY", basePrice: 23520 },
    { name: "SENSEX", basePrice: 77250 },
    { name: "RELIANCE", basePrice: 2950 },
    { name: "TCS", basePrice: 3820 },
    { name: "INFY", basePrice: 1530 },
  ];

  const timeframes = ["1d", "1h", "15m"];
  const candleCount = 80;

  for (const symbol of symbols) {
    console.log(`Generating candles for ${symbol.name}...`);
    for (const tf of timeframes) {
      let currentPrice = symbol.basePrice;
      const intervalMs =
        tf === "1d"
          ? 24 * 60 * 60 * 1000
          : tf === "1h"
          ? 60 * 60 * 1000
          : 15 * 60 * 1000;

      const candlesData = [];
      const nowMs = Date.now();

      for (let i = candleCount; i >= 0; i--) {
        const timestamp = new Date(nowMs - i * intervalMs);
        const volatility = tf === "1d" ? 0.03 : tf === "1h" ? 0.008 : 0.003;
        
        // Random walk
        const changePercent = (Math.random() - 0.48) * volatility; // slight upward bias
        const open = currentPrice;
        const close = currentPrice * (1 + changePercent);
        const high = Math.max(open, close) * (1 + Math.random() * (volatility * 0.4));
        const low = Math.min(open, close) * (1 - Math.random() * (volatility * 0.4));
        const volume = (symbol.basePrice * 10) * (0.5 + Math.random() * 1.5);

        candlesData.push({
          symbol: symbol.name,
          timeframe: tf,
          open,
          high,
          low,
          close,
          volume,
          timestamp,
        });

        currentPrice = close;
      }

      await prisma.marketCandle.createMany({
        data: candlesData,
        skipDuplicates: true,
      });
    }
  }

  console.log("Historical candle data generated.");

  // 7. Create Mock Signals
  // Closed WIN
  const sig1 = await prisma.signal.create({
    data: {
      symbol: "BTCUSDT",
      type: SignalType.BUY,
      entryPrice: 65400.0,
      stopLoss: 64100.0,
      takeProfit1: 67200.0,
      takeProfit2: 69000.0,
      riskReward: 2.1,
      confidenceScore: 84.0,
      confidenceLevel: "High",
      status: SignalStatus.CLOSED,
      outcome: SignalOutcome.WIN,
      profitLossPercent: 5.5,
      signalTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Closed LOSS
  const sig2 = await prisma.signal.create({
    data: {
      symbol: "ETHUSDT",
      type: SignalType.SELL,
      entryPrice: 3620.0,
      stopLoss: 3710.0,
      takeProfit1: 3480.0,
      takeProfit2: 3350.0,
      riskReward: 1.8,
      confidenceScore: 68.0,
      confidenceLevel: "Medium",
      status: SignalStatus.CLOSED,
      outcome: SignalOutcome.LOSS,
      profitLossPercent: -2.48,
      signalTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Open Active Signals
  const sig3 = await prisma.signal.create({
    data: {
      symbol: "SOLUSDT",
      type: SignalType.BUY,
      entryPrice: 154.5,
      stopLoss: 149.0,
      takeProfit1: 162.0,
      takeProfit2: 170.0,
      riskReward: 2.5,
      confidenceScore: 78.0,
      confidenceLevel: "Medium",
      status: SignalStatus.OPEN,
      outcome: SignalOutcome.PENDING,
      signalTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  const sig4 = await prisma.signal.create({
    data: {
      symbol: "BTCUSDT",
      type: SignalType.BUY,
      entryPrice: 68200.0,
      stopLoss: 67100.0,
      takeProfit1: 69800.0,
      takeProfit2: 71500.0,
      riskReward: 2.3,
      confidenceScore: 88.0,
      confidenceLevel: "High",
      status: SignalStatus.OPEN,
      outcome: SignalOutcome.PENDING,
      signalTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  console.log("Mock signals seeded.");

  // 8. Create Mock Trades for the User
  await prisma.trade.create({
    data: {
      userId: user.id,
      signalId: sig1.id,
      symbol: "BTCUSDT",
      entryPrice: 65400.0,
      exitPrice: 69000.0,
      amount: 0.15,
      profitLoss: 540.0,
      status: "CLOSED",
    },
  });

  await prisma.trade.create({
    data: {
      userId: user.id,
      signalId: sig2.id,
      symbol: "ETHUSDT",
      entryPrice: 3620.0,
      exitPrice: 3710.0,
      amount: 1.5,
      profitLoss: -135.0,
      status: "CLOSED",
    },
  });

  await prisma.trade.create({
    data: {
      userId: user.id,
      signalId: sig3.id,
      symbol: "SOLUSDT",
      entryPrice: 154.5,
      amount: 10,
      status: "OPEN",
    },
  });

  console.log("Mock trades seeded.");

  // 9. Create User Custom Alerts
  await prisma.alert.createMany({
    data: [
      {
        userId: user.id,
        symbol: "BTCUSDT",
        type: "PRICE",
        condition: "ABOVE",
        value: 70000.0,
        isTriggered: false,
        channels: ["IN_APP", "TELEGRAM"],
      },
      {
        userId: user.id,
        symbol: "ETHUSDT",
        type: "PRICE",
        condition: "BELOW",
        value: 3400.0,
        isTriggered: true,
        isSent: true,
        channels: ["IN_APP", "EMAIL"],
      },
    ],
  });

  console.log("Mock alerts seeded.");
  console.log("Database seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
