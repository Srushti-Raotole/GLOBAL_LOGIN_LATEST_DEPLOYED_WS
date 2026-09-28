
import { useEffect, useRef, useCallback } from "react";

const IDLE_TIMEOUT_MS = 1 * 60 * 1000; 
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

export function useSessionTimeout(onTimeout: () => void, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onTimeout, IDLE_TIMEOUT_MS);
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    resetTimer();

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, resetTimer);
      }
    };
  }, [enabled, resetTimer]);
}
