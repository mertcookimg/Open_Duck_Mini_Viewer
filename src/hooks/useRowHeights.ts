// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

const STORAGE_KEY = "open-duck-mini-viewer.row-heights";

export interface RowHeights {
  top: number;
  bottom: number;
}

const DEFAULT_HEIGHTS: RowHeights = { top: 220, bottom: 220 };
export const MIN_ROW_HEIGHT = 100;
export const MAX_ROW_HEIGHT = 800;

function isValid(h: unknown): h is RowHeights {
  return (
    typeof h === "object" &&
    h !== null &&
    typeof (h as RowHeights).top === "number" &&
    typeof (h as RowHeights).bottom === "number" &&
    Number.isFinite((h as RowHeights).top) &&
    Number.isFinite((h as RowHeights).bottom)
  );
}

export function useRowHeights(): [RowHeights, React.Dispatch<React.SetStateAction<RowHeights>>] {
  const [heights, setHeights] = useState<RowHeights>(DEFAULT_HEIGHTS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!isValid(parsed)) return;
      setHeights({
        top: Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, parsed.top)),
        bottom: Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, parsed.bottom)),
      });
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(heights));
  }, [heights]);

  return [heights, setHeights];
}
