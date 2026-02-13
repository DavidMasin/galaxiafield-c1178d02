import { useCallback, useEffect, useRef } from "react";
import { useMatchStore } from "@/store/matchStore";

const PI_IP = "10.59.87.50";
const WS_PORT = "5805";
const RECONNECT_DELAY_MS = 1000;

function getWsUrl() {
  // You’re running Vite locally over HTTP → use ws://
  // If you later put the site behind HTTPS and proxy WSS, you can switch this logic.
  const isHttps = window.location.protocol === "https:";
  if (isHttps) return `wss://${PI_IP}/ws`;
  return `ws://${PI_IP}:${WS_PORT}`;
}

export function useWebSocketInternal() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  const setConnectionStatus = useMatchStore((s) => s.setConnectionStatus);
  const applyPiStatus = useMatchStore((s) => s.applyPiStatus);
  const applyPiScore = useMatchStore((s) => s.applyPiScore);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = getWsUrl();
    setConnectionStatus("reconnecting");

    const ws = new WebSocket(url);

    ws.onopen = () => {
      setConnectionStatus("connected");
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg?.type === "status") {
          applyPiStatus(msg);
        } else if (msg?.type === "score") {
          applyPiScore(msg);
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      wsRef.current = null;
      reconnectTimer.current = window.setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      try { ws.close(); } catch {}
    };

    wsRef.current = ws;
  }, [setConnectionStatus, applyPiStatus, applyPiScore]);

  const send = useCallback((msg: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

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
