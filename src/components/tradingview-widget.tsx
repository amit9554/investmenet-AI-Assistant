"use client";

import React, { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  symbol: string;
}

export default function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const containerId = useRef<string>(`tradingview_${Math.random().toString(36).substring(2, 9)}`);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const scriptId = "tradingview-widget-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initWidget = () => {
      if ((window as any).TradingView) {
        widgetRef.current = new (window as any).TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: "60",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: containerId.current,
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }

    return () => {
      // Cleanup widget container
      if (widgetRef.current) {
        widgetRef.current = null;
      }
    };
  }, [symbol]);

  return (
    <div className="h-full w-full rounded-2xl border border-gray-900 overflow-hidden bg-[#0d111b] p-1">
      <div id={containerId.current} className="h-[550px] w-full" />
    </div>
  );
}
