import { create } from "zustand";

interface AppState {
  prices: Record<string, number>;
  priceChanges: Record<string, "up" | "down" | "neutral">;
  wsStatus: "connected" | "disconnected" | "connecting";
  activeTab: string;
  theme: "dark" | "light";
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  setActiveTab: (tab: string) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const SYMBOLS = ["btcusdt", "ethusdt", "solusdt", "bnbusdt", "xrpusdt"];
const INDIAN_SYMBOLS = ["NIFTY", "SENSEX", "RELIANCE", "TCS", "INFY"];

export const useStore = create<AppState>((set, get) => {
  let socket: WebSocket | null = null;
  let indianMarketInterval: NodeJS.Timeout | null = null;

  return {
    prices: {
      BTCUSDT: 68500,
      ETHUSDT: 3500,
      SOLUSDT: 160,
      BNBUSDT: 590,
      XRPUSDT: 0.65,
      // Indian Market Assets
      NIFTY: 23520,
      SENSEX: 77250,
      RELIANCE: 2950,
      TCS: 3820,
      INFY: 1530,
    },
    priceChanges: {},
    wsStatus: "disconnected",
    activeTab: "dashboard",
    theme: "dark",

    setActiveTab: (tab) => set({ activeTab: tab }),

    initTheme: () => {
      if (typeof window !== "undefined") {
        const savedTheme = localStorage.getItem("webnex-theme") as "dark" | "light" | null;
        const root = document.documentElement;
        if (savedTheme === "light") {
          root.classList.add("light");
          set({ theme: "light" });
        } else {
          root.classList.remove("light");
          set({ theme: "dark" });
        }
      }
    },

    toggleTheme: () => {
      const currentTheme = get().theme;
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      const root = document.documentElement;

      if (typeof window !== "undefined") {
        localStorage.setItem("webnex-theme", newTheme);
        if (newTheme === "light") {
          root.classList.add("light");
        } else {
          root.classList.remove("light");
        }
      }

      set({ theme: newTheme });
    },

    connectWebSocket: () => {
      if (socket) return;

      set({ wsStatus: "connecting" });
      
      const streams = SYMBOLS.map((s) => `${s}@miniTicker`).join("/");
      const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

      try {
        socket = new WebSocket(url);

        socket.onopen = () => {
          set({ wsStatus: "connected" });
          console.log("Binance WebSocket stream connected.");
        };

        socket.onmessage = (event) => {
          const payload = JSON.parse(event.data);
          if (payload?.data) {
            const ticker = payload.data;
            const symbol = ticker.s;
            const price = parseFloat(ticker.c);

            const prevPrices = get().prices;
            const prevPrice = prevPrices[symbol] || price;
            
            let change: "up" | "down" | "neutral" = "neutral";
            if (price > prevPrice) change = "up";
            else if (price < prevPrice) change = "down";

            set((state) => ({
              prices: { ...state.prices, [symbol]: price },
              priceChanges: { ...state.priceChanges, [symbol]: change },
            }));

            setTimeout(() => {
              set((state) => ({
                priceChanges: { ...state.priceChanges, [symbol]: "neutral" },
              }));
            }, 800);
          }
        };

        socket.onclose = () => {
          set({ wsStatus: "disconnected" });
          socket = null;
          console.log("Binance WebSocket stream closed. Reconnecting in 5s...");
          setTimeout(() => get().connectWebSocket(), 5000);
        };

        socket.onerror = (err) => {
          console.error("Binance WebSocket error:", err);
          set({ wsStatus: "disconnected" });
          socket?.close();
        };

        // Initialize Indian Market Price Tick Simulator (flucuates stock prices slightly)
        if (!indianMarketInterval) {
          indianMarketInterval = setInterval(() => {
            const currentPrices = get().prices;
            const newPrices = { ...currentPrices };
            const newChanges = { ...get().priceChanges };

            for (const sym of INDIAN_SYMBOLS) {
              const prevPrice = currentPrices[sym];
              const driftPercent = (Math.random() - 0.5) * 0.001; // tiny fluctuate
              const newPrice = prevPrice * (1 + driftPercent);
              
              newPrices[sym] = Number(newPrice.toFixed(2));
              newChanges[sym] = newPrice > prevPrice ? "up" : newPrice < prevPrice ? "down" : "neutral";
            }

            set({ prices: newPrices, priceChanges: newChanges });

            // Clear color ticks
            setTimeout(() => {
              const resetChanges = { ...get().priceChanges };
              for (const sym of INDIAN_SYMBOLS) {
                resetChanges[sym] = "neutral";
              }
              set({ priceChanges: resetChanges });
            }, 800);
          }, 3000);
        }

      } catch (e) {
        console.error("WebSocket initialization failed:", e);
        set({ wsStatus: "disconnected" });
      }
    },

    disconnectWebSocket: () => {
      if (socket) {
        socket.close();
        socket = null;
        set({ wsStatus: "disconnected" });
      }
      if (indianMarketInterval) {
        clearInterval(indianMarketInterval);
        indianMarketInterval = null;
      }
    },
  };
});
