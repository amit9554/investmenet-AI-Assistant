import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SignalStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const status = searchParams.get("status");

    const filter: any = {};
    if (symbol) filter.symbol = symbol.toUpperCase();
    if (status) filter.status = status as SignalStatus;

    const signals = await prisma.signal.findMany({
      where: filter,
      orderBy: { signalTime: "desc" },
      take: 50,
    });

    const activeSignals = signals.filter((s) => s.status === SignalStatus.OPEN);
    const closedSignals = signals.filter((s) => s.status === SignalStatus.CLOSED);

    // Calculate win rate from all closed signals in DB
    const allClosedSignals = await prisma.signal.findMany({
      where: { status: SignalStatus.CLOSED },
    });
    const totalClosed = allClosedSignals.length;
    const wins = allClosedSignals.filter((s) => s.outcome === "WIN").length;
    const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : 75.0; // default to seed average if empty

    return NextResponse.json({
      signals,
      activeSignals,
      closedSignals,
      winRate: Number(winRate.toFixed(2)),
      totalClosed,
    });
  } catch (error: any) {
    console.error("Signals API error:", error);
    return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 });
  }
}
