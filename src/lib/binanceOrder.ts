import crypto from "crypto";

const BINANCE_API_URL = process.env.BINANCE_API_URL || "https://api.binance.com";
const apiKey = process.env.BINANCE_API_KEY;
const apiSecret = process.env.BINANCE_API_SECRET;

const INDIAN_SYMBOLS = ["NIFTY", "SENSEX", "RELIANCE", "TCS", "INFY"];

function generateSignature(queryString: string): string {
  if (!apiSecret) return "";
  return crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex");
}

export async function getAccountSpotBalance(): Promise<number> {
  const defaultBalance = 1250.00;

  if (!apiKey || !apiSecret || apiKey === "mock_api_key" || apiSecret === "mock_api_secret") {
    return defaultBalance;
  }

  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}&recvWindow=6000`;
  const signature = generateSignature(queryString);

  const apiDomains = [
    process.env.BINANCE_API_URL || "https://api.binance.com",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com",
    "https://api4.binance.com"
  ];

  for (const domain of apiDomains) {
    const url = `${domain}/api/v3/account?${queryString}&signature=${signature}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "X-MBX-APIKEY": apiKey,
        },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const data = await res.json();
        const usdtAsset = data.balances?.find((b: any) => b.asset === "USDT");
        return usdtAsset ? parseFloat(usdtAsset.free) : 0;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn(`Failed to fetch Binance balance from ${domain}:`, err);
    }
  }

  console.warn("All Binance API endpoints failed to fetch balance, using mock default.");
  return defaultBalance;
}

export async function placeLiveBinanceOrder(
  symbol: string,
  side: "BUY" | "SELL",
  type: "LIMIT" | "MARKET",
  quantity: number,
  price?: number
): Promise<any> {
  const upperSymbol = symbol.toUpperCase();
  const isIndian = INDIAN_SYMBOLS.includes(upperSymbol);

  // Safeguard: Bypasses live API for simulated/Indian assets, or if credentials are set to mock
  if (isIndian || !apiKey || !apiSecret || apiKey.startsWith("mock") || apiSecret.startsWith("mock")) {
    console.log(`[VIRTUAL EXECUTION] ${side} ${type} order routed for ${upperSymbol}. Qty: ${quantity}`);
    return {
      orderId: Math.floor(100000 + Math.random() * 900000),
      symbol: upperSymbol,
      side,
      type,
      price: price || 0.0,
      origQty: quantity.toString(),
      status: "FILLED",
      transactTime: Date.now(),
      clientOrderId: `v_trade_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  const timestamp = Date.now();
  
  // Format quantity to safety decimal bounds
  const formattedQty = quantity.toFixed(5);
  let queryString = `symbol=${upperSymbol}&side=${side}&type=${type}&quantity=${formattedQty}`;

  if (type === "LIMIT" && price) {
    const formattedPrice = price.toFixed(2);
    queryString += `&price=${formattedPrice}&timeInForce=GTC`;
  }

  queryString += `&timestamp=${timestamp}&recvWindow=6000`;
  const signature = generateSignature(queryString);

  const apiDomains = [
    process.env.BINANCE_API_URL || "https://api.binance.com",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com",
    "https://api4.binance.com"
  ];

  for (const domain of apiDomains) {
    const url = `${domain}/api/v3/order`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-MBX-APIKEY": apiKey,
        },
        body: `${queryString}&signature=${signature}`,
        signal: AbortSignal.timeout(3000)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.msg || `Binance Order placement failed with HTTP ${res.status}`);
      }
      return data;
    } catch (err: any) {
      console.warn(`Live Order routing failed for ${upperSymbol} on ${domain}:`, err);
    }
  }

  throw new Error(`Live Order routing failed for ${upperSymbol} on all Binance API endpoints.`);
}
