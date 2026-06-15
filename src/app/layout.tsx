import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import Navigation from "@/components/navigation";

export const metadata: Metadata = {
  title: "WebNex AI - Advanced Crypto Trading Assistant SaaS",
  description: "High-probability BUY/SELL signal generation, real-time market data analysis, backtesting simulation engine, and automated alerts for digital assets.",
  keywords: ["crypto trading", "bitcoin signal", "ethereum signal", "binance api", "crypto backtest", "trading analysis bot"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-[#090b0f] text-[#f3f4f6] antialiased select-none">
        <Providers>
          <Navigation>{children}</Navigation>
        </Providers>
      </body>
    </html>
  );
}
