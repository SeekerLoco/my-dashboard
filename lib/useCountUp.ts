// Animates a number from its previous value up to `target` (ease-out), always ending on the exact target.
// Skips the animation for users who prefer reduced motion.
'use client';

import { useEffect, useRef, useState } from 'react';

export function useCountUp(
  target: number | null,
  duration = 800,
): number | null {
  const [value, setValue] = useState<number | null>(target === null ? null : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (target === null) {
      setValue(null);
      return;
    }
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduce) {
      setValue(target);
      fromRef.current = target;
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      if (t < 1) {
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(from + (target - from) * eased);
        raf = requestAnimationFrame(tick);
      } else {
        // Land exactly on the real value
        setValue(target);
        fromRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
