import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const defaultUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!defaultUser) {
      return NextResponse.json({ alerts: [] });
    }

    const alerts = await prisma.alert.findMany({
      where: { userId: defaultUser.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error("Fetch alerts error:", error);
    return NextResponse.json({ error: "Failed to retrieve alert configs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { symbol, type, condition, value, channels } = await req.json();

    if (!symbol || !type || !condition || value === undefined) {
      return NextResponse.json(
        { error: "Symbol, type, condition, and target value are required." },
        { status: 400 }
      );
    }

    const defaultUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!defaultUser) {
      return NextResponse.json({ error: "No user found to assign alert." }, { status: 404 });
    }

    const newAlert = await prisma.alert.create({
      data: {
        userId: defaultUser.id,
        symbol: symbol.toUpperCase(),
        type,
        condition,
        value: parseFloat(value),
        isTriggered: false,
        isSent: false,
        channels: channels || ["IN_APP"],
      },
    });

    return NextResponse.json(newAlert, { status: 201 });
  } catch (error: any) {
    console.error("Create alert error:", error);
    return NextResponse.json({ error: "Failed to create custom alert" }, { status: 500 });
  }
}
