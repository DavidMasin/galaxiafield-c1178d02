import React, { createContext, useContext, useMemo, useEffect } from "react";
import { useWebSocketInternal } from "@/ws/useWebSocketInternal";

declare global {
  interface Window {
    __PI_SEND__?: (msg: Record<string, unknown>) => void;
  }
}

type PiWsContextValue = {
  send: (msg: Record<string, unknown>) => void;
};

const PiWsContext = createContext<PiWsContextValue | null>(null);

export function PiWsProvider({ children }: { children: React.ReactNode }) {
  const { send } = useWebSocketInternal();

  // Bridge so legacy store actions can still send commands
  useEffect(() => {
    window.__PI_SEND__ = send;
    return () => {
      if (window.__PI_SEND__ === send) delete window.__PI_SEND__;
    };
  }, [send]);

  const value = useMemo(() => ({ send }), [send]);
  return <PiWsContext.Provider value={value}>{children}</PiWsContext.Provider>;
}

export function usePiWs() {
  const ctx = useContext(PiWsContext);
  if (!ctx) throw new Error("usePiWs must be used inside <PiWsProvider>");
  return ctx;
}
