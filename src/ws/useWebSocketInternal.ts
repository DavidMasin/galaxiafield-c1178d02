import { useCallback, useEffect, useRef } from "react";
import { useMatchStore } from "@/store/matchStore";

const PI_IP = "10.59.87.50";
const WS_PORT = "5805";
const RECONNECT_DELAY_MS = 800;

function getWsUrl() {
  const isHttps = window.location.protocol === "https:";
  if (isHttps) return `wss://${PI_IP}/ws`;
  return `ws://${PI_IP}:${WS_PORT}`;
}

export function useWebSocketInternal() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  // ✅ queue messages until open
  const pendingRef = useRef<string[]>([]);

  const setConnectionStatus = useMatchStore((s) => s.setConnectionStatus);
  const applyPiStatus = useMatchStore((s) => s.applyPiStatus);
  const applyPiScore = useMatchStore((s) => s.applyPiScore);

  const connect = useCallback(() => {
    const existing = wsRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = getWsUrl();
    console.log("[WS] connecting:", url);
    setConnectionStatus("reconnecting");

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("[WS] open");
      setConnectionStatus("connected");

      // flush queued messages
      const q = pendingRef.current;
      pendingRef.current = [];
      for (const s of q) {
        try { ws.send(s); } catch {}
      }

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg?.type === "status") applyPiStatus(msg);
        else if (msg?.type === "score") applyPiScore(msg);
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      console.log("[WS] closed");
      setConnectionStatus("disconnected");
      wsRef.current = null;
      reconnectTimer.current = window.setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      console.log("[WS] error");
      try { ws.close(); } catch {}
    };

    wsRef.current = ws;
  }, [setConnectionStatus, applyPiStatus, applyPiScore]);

  const send = useCallback((msg: Record<string, unknown>) => {
    const s = JSON.stringify(msg);
    const ws = wsRef.current;

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(s);
      console.log("[WS] tx:", msg);
      return;
    }

    // not open yet → queue and connect
    pendingRef.current.push(s);
    console.log("[WS] queued tx:", msg);
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
    };
  }, [connect]);

  return { send };
}
