import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { placeLiveBinanceOrder } from "@/lib/binanceOrder";
import { fetchLivePrices } from "@/lib/binance";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;

    if (!userId) {
      // Fallback to default seeded user if not logged in (e.g. for API testing)
      const defaultUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
      userId = defaultUser?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized / No user found" }, { status: 401 });
    }

    const body = await req.json();
    const { symbol, side, type, quantity, price, signalId } = body;

    if (!symbol || !side || !type || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: symbol, side, type, quantity" },
        { status: 400 }
      );
    }

    const upperSymbol = symbol.toUpperCase();
    
    // Resolve entry price if not provided (e.g. for Market orders)
    let entryPrice = price ? parseFloat(price) : 0;
    if (!entryPrice) {
      const prices = await fetchLivePrices();
      entryPrice = prices[upperSymbol] || 0.0;
    }

    console.log(`[API TRADE EXECUTE] Placing manual ${side} ${type} order for ${upperSymbol} Qty: ${quantity}`);

    const orderRes = await placeLiveBinanceOrder(
      upperSymbol,
      side,
      type,
      parseFloat(quantity),
      price ? parseFloat(price) : undefined
    );

    // Save to Trades log table
    const trade = await prisma.trade.create({
      data: {
        userId,
        signalId: signalId || null,
        symbol: upperSymbol,
        entryPrice,
        amount: parseFloat(quantity),
        status: "OPEN",
        binanceOrderId: orderRes ? String(orderRes.orderId) : `v_${Date.now()}`,
      },
    });

    return NextResponse.json({
      message: "Order executed successfully",
      trade,
      binanceOrderResponse: orderRes,
    });
  } catch (error: any) {
    console.error("Manual trade execution API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute trade" },
      { status: 500 }
    );
  }
}
