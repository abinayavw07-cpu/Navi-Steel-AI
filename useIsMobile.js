/**
 * useIsMobile — reactive hook that returns true when the viewport
 * width is below the "md" Tailwind breakpoint (768 px).
 *
 * Updates instantly on window resize and on device orientation change,
 * so the layout switches live without a page reload.
 */
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768; // matches Tailwind `md:`

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handler = (e) => setIsMobile(e.matches);

    // Modern API
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
    } else {
      // Safari < 14 fallback
      mq.addListener(handler);
    }

    // Sync on mount in case SSR mismatch
    setIsMobile(mq.matches);

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, []);

  return isMobile;
}
