import { useEffect, useRef } from 'react';
import { useMatchStore } from '@/store/matchStore';

/** Legacy simulation hook - kept for dashboard pages */
export function useSimulation() {
  // No-op: real scoring comes from WebSocket now
  // Timer is handled by useMatchTimer
}
