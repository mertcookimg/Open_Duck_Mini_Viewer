// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";

const SCROLLING_FADE_MS = 700;

export function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let scrollingTimer: number | undefined;

    const update = () => {
      const overflow = el.scrollHeight - el.clientHeight > 1;
      const atTop = el.scrollTop <= 1;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      if (overflow) el.dataset.overflow = "1";
      else delete el.dataset.overflow;
      if (atTop) el.dataset.scrollTop = "1";
      else delete el.dataset.scrollTop;
      if (atBottom) el.dataset.scrollBottom = "1";
      else delete el.dataset.scrollBottom;
    };

    const onScroll = () => {
      el.dataset.scrolling = "1";
      window.clearTimeout(scrollingTimer);
      scrollingTimer = window.setTimeout(() => {
        delete el.dataset.scrolling;
      }, SCROLLING_FADE_MS);
      update();
    };

    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.clearTimeout(scrollingTimer);
    };
  }, []);

  return ref;
}
