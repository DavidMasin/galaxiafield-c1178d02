import { useEffect, useRef, useCallback } from "react";
import { useMatchStore } from "@/store/matchStore";

const PI_IP = "10.59.87.50";
const WS_PORT = "5805";
const RECONNECT_DELAY = 2000;

function getWebSocketUrl() {
  const isHttps = window.location.protocol === "https:";
  if (isHttps) return `wss://${PI_IP}/ws`;
  return `ws://${PI_IP}:${WS_PORT}`;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  const { setConnectionStatus, applyPiStatus, applyPiScore } = useMatchStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const WS_URL = getWebSocketUrl();
    setConnectionStatus("reconnecting");

    try {
      const ws = new WebSocket(WS_URL);

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

          if (msg.type === "score") {
            applyPiScore(msg);
          }

          if (msg.type === "status") {
            applyPiStatus(msg);
          }
        } catch (err) {
          console.warn("[WebSocket] Bad message:", err);
        }
      };

      ws.onclose = () => {
        setConnectionStatus("disconnected");
        wsRef.current = null;
        reconnectTimer.current = window.setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.warn("[WebSocket] Connection failed:", err);
      setConnectionStatus("disconnected");
    }
  }, [setConnectionStatus, applyPiScore, applyPiStatus]);

  const send = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { send };
}
