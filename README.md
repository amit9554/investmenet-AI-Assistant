# AI Crypto Trading Assistant SaaS

A complete production-ready, high-performance, and visually stunning AI-powered Crypto Trading Assistant SaaS. The application parses real-time spot market feeds from Binance, runs automated multi-factor technical indicators, generates risk-managed trading signals, dispatches custom alerts (Telegram/In-App/Email), backtests strategies against historical candles, and hosts control consoles.

---

## 🌟 Key Features

1. **Live Market Overview**: Live mini-ticker price feeds for BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT, and XRPUSDT synced via Binance WebSockets.
2. **Technical TA Engine**: Pure TypeScript implementation of standard indicators: EMA (20/50/200), RSI, MACD, ATR, Bollinger Bands, and VWAP.
3. **AI Signal Generator**: Multi-factor quantitative signals including:
   - Volume spikes (relative to 20-day moving average).
   - Trend crossover momentum verification.
   - Breakouts, support/resistance bounce, and rejection structures.
   - Target price sizing: Entry price, Stop Loss (using ATR/Support zones), Take Profit 1 (1.5R), and Take Profit 2 (3R).
4. **Weighted Confidence Engine**: Aggregated score (0-100%) checking ADX trend alignment, RSI momentum, and volume.
5. **Backtesting Simulator Sandbox**: Runs customizable strategy simulations on historical DB candles, outputting ROI, Win Rate, Profit Factor, Max Drawdown, and detailed transaction logs.
6. **Multi-Channel Alerting**: Instant dispatches to Dashboard In-App feeds, active Telegram Channels, and SMTP Email interfaces.
7. **Role-Based Auth (NextAuth)**: Email/Password login and Google Sign-in flow protecting private paths through router middleware.
8. **Admin Dashboard Control**: System health diagnostic metrics (DB response speeds, API latencies, CPU loads) and forced manual signal scan controls.

---

## 📂 Project Structure

```text
/
├── prisma/
│   ├── schema.prisma       # Prisma PostgreSQL schema models
│   └── seed.ts             # Database seeding script for mock users & historical candles
├── src/
│   ├── app/                # Next.js App Router endpoints & page nodes
│   │   ├── api/            # API Route Handlers (Auth, Market, Signals, Backtest, etc.)
│   │   ├── admin/          # Admin Dashboard view
│   │   ├── alerts/         # Custom Alerts Manager view
│   │   ├── backtest/       # Backtesting Sandbox view
│   │   ├── dashboard/      # Main overview console
│   │   ├── login/          # Auth Login Form
│   │   ├── market/         # Live charts & indicators panel
│   │   ├── profile/        # Profile & subscription options
│   │   ├── register/       # User Signup Form
│   │   ├── globals.css     # CSS dark theme definitions
│   │   ├── layout.tsx      # Core shell page structure
│   │   └── page.tsx        # App Landing Hero view
│   ├── components/         # Shared UI components
│   │   ├── navigation.tsx  # Sidebar & Mobile header frame
│   │   ├── providers.tsx   # Client session auth wrapper
│   │   └── tradingview-widget.tsx # Script-injected dark charts
│   ├── hooks/
│   │   └── use-store.ts    # Zustand global state store & WebSocket listeners
│   ├── lib/                # Core engines
│   │   ├── alerts.ts       # Alert dispatchers
│   │   ├── auth.ts         # NextAuth configuration
│   │   ├── backtesting.ts  # Backtest strategy simulator
│   │   ├── binance.ts      # Binance API data streams
│   │   ├── db.ts           # Prisma Client singleton
│   │   ├── profitBooking.ts# Trade TP/SL target checks
│   │   ├── signalEngine.ts # Quantitative signal generator
│   │   └── ta.ts           # Indicator math functions
│   └── middleware.ts       # Route guards matching protected directories
├── Dockerfile              # Multi-stage production container build
├── docker-compose.yml      # Multi-container orchestrator (App + Postgres)
├── package.json            # Node project configuration
└── tsconfig.json           # TypeScript configuration
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Create user and free subscription.

### Market Data
- `GET /api/market` - Fetch current live prices.
- `GET /api/market/[symbol]?timeframe=1h` - Fetch historical candle arrays.

### Signal Engine
- `GET /api/signals` - Fetch lists of active and closed signals.
- `POST /api/signals/generate` - Force manual sweep (scans indicators, executes active SL/TP checks).

### Backtester
- `GET /api/backtest` - Retrieve previous backtest run logs.
- `POST /api/backtest/run` - Runs strategy simulations (takes `symbol`, `timeframe`, `startDate`, `endDate`).

### Alerts
- `GET /api/alerts` - Fetch alerts configurations log.
- `POST /api/alerts` - Create a custom price threshold trigger.
- `POST /api/alerts/send` - Send manual push notifications for channel testing.

### Market Sentiment
- `GET /api/sentiment` - Retrieve Crypto Fear & Greed Index score and news distribution stats.

---

## 🔒 Disclaimers & Disclosures

- **No Guaranteed Returns**: We do not claim guaranteed profits or 100% accuracy.
- **Risk Disclosures**: Cryptocurrencies are highly volatile assets. Trading carries high risk. This software is a quantitative simulation utility. Never trade with money you cannot afford to lose.
