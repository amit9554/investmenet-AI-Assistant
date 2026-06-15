import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { startBotExecutor, stopBotExecutor, getBotExecutorStatus } from "@/lib/botExecutor";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;

    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
      userId = defaultUser?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const botSetting = await prisma.setting.findUnique({
      where: {
        userId_key: {
          userId,
          key: "auto_trading_bot",
        },
      },
    });

    const isEnabled = botSetting?.value === "true";
    const status = getBotExecutorStatus();

    return NextResponse.json({
      enabled: isEnabled,
      running: status.running,
    });
  } catch (error: any) {
    console.error("Get bot settings error:", error);
    return NextResponse.json({ error: "Failed to fetch bot settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    let userId = (session?.user as any)?.id;

    if (!userId) {
      const defaultUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
      userId = defaultUser?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await req.json();

    if (enabled === undefined) {
      return NextResponse.json({ error: "Missing 'enabled' parameter" }, { status: 400 });
    }

    // Upsert the bot setting in the DB
    const settingValue = enabled ? "true" : "false";
    const updatedSetting = await prisma.setting.upsert({
      where: {
        userId_key: {
          userId,
          key: "auto_trading_bot",
        },
      },
      update: {
        value: settingValue,
      },
      create: {
        userId,
        key: "auto_trading_bot",
        value: settingValue,
      },
    });

    // Toggle the background loop process
    if (enabled) {
      startBotExecutor(60000); // Scan every 60 seconds
    } else {
      // Check if any other users still have the bot enabled before fully stopping
      const otherActiveBots = await prisma.setting.findMany({
        where: {
          key: "auto_trading_bot",
          value: "true",
          NOT: {
            userId: userId,
          },
        },
      });
      if (otherActiveBots.length === 0) {
        stopBotExecutor();
      }
    }

    const status = getBotExecutorStatus();

    return NextResponse.json({
      message: `Auto-trading bot ${enabled ? "enabled" : "disabled"} successfully`,
      enabled: updatedSetting.value === "true",
      running: status.running,
    });
  } catch (error: any) {
    console.error("Post bot settings error:", error);
    return NextResponse.json({ error: "Failed to update bot settings" }, { status: 500 });
  }
}
