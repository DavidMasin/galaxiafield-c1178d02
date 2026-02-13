import React, { createContext, useContext, useMemo } from "react";
import { useWebSocketInternal } from "@/ws/useWebSocketInternal";

type PiWsContextValue = {
  send: (msg: Record<string, unknown>) => void;
};

const PiWsContext = createContext<PiWsContextValue | null>(null);

export function PiWsProvider({ children }: { children: React.ReactNode }) {
  const { send } = useWebSocketInternal();
  const value = useMemo(() => ({ send }), [send]);
  return <PiWsContext.Provider value={value}>{children}</PiWsContext.Provider>;
}

export function usePiWs() {
  const ctx = useContext(PiWsContext);
  if (!ctx) throw new Error("usePiWs must be used inside <PiWsProvider>");
  return ctx;
}
