import { create } from "zustand";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

export const CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 83.50,
  EUR: 0.92,
  GBP: 0.79,
};

interface AppState {
  prices: Record<string, number>;
  priceChanges: Record<string, "up" | "down" | "neutral">;
  wsStatus: "connected" | "disconnected" | "connecting";
  activeTab: string;
  theme: "dark" | "light";
  currency: "USD" | "INR" | "EUR" | "GBP";
  setCurrency: (c: "USD" | "INR" | "EUR" | "GBP") => void;
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
  let wsDomainIndex = 0;

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
    currency: "USD",

    setCurrency: (currency) => set({ currency }),

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
      
      const wsHosts = [
        `wss://stream.binance.com/stream?streams=${streams}`, // Port 443 (default, usually unblocked)
        `wss://stream.binance.com:9443/stream?streams=${streams}`, // Port 9443
        `wss://stream1.binance.com/stream?streams=${streams}`,
        `wss://stream2.binance.com/stream?streams=${streams}`,
        `wss://stream3.binance.com/stream?streams=${streams}`,
        `wss://stream4.binance.com/stream?streams=${streams}`,
      ];

      const currentHost = wsHosts[wsDomainIndex];
      console.log(`[WEBSOCKET] Attempting connection to ${currentHost.split("?")[0]} (Index: ${wsDomainIndex})`);

      try {
        socket = new WebSocket(currentHost);

        socket.onopen = () => {
          set({ wsStatus: "connected" });
          console.log(`[WEBSOCKET] Connected successfully to ${currentHost.split("?")[0]}`);
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
          
          // Cycle to the next host for the next connection attempt
          wsDomainIndex = (wsDomainIndex + 1) % wsHosts.length;
          
          console.log(`[WEBSOCKET] Connection closed. Retrying alternative host in 4s...`);
          setTimeout(() => get().connectWebSocket(), 4000);
        };

        socket.onerror = (err) => {
          console.error(`[WEBSOCKET] Error on host ${currentHost.split("?")[0]}:`, err);
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
