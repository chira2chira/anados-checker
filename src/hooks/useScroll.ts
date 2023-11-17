import { useCallback, useEffect, useRef, useState } from "react";
import throttle from "lodash.throttle";

export function useScroll() {
  const [scrolling, setScrolling] = useState(false);
  const timer = useRef<number | undefined>();

  const handleScroll = useCallback(() => {
    setScrolling(true);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setScrolling(false), 600);
  }, []);

  useEffect(() => {
    const throttledHandleScroll = throttle(handleScroll, 400);
    window.addEventListener("scroll", throttledHandleScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", throttledHandleScroll);
  }, [handleScroll]);

  return scrolling;
}
