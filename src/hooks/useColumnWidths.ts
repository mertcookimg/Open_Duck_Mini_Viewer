// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

const STORAGE_KEY = "open-duck-mini-viewer.column-widths";

export interface ColumnWidths {
  left: number;
  right: number;
}

const DEFAULT_WIDTHS: ColumnWidths = { left: 280, right: 280 };
export const MIN_SIDE_WIDTH = 192;
export const MAX_SIDE_WIDTH = 800;

function isValid(w: unknown): w is ColumnWidths {
  return (
    typeof w === "object" &&
    w !== null &&
    typeof (w as ColumnWidths).left === "number" &&
    typeof (w as ColumnWidths).right === "number" &&
    Number.isFinite((w as ColumnWidths).left) &&
    Number.isFinite((w as ColumnWidths).right)
  );
}

export function useColumnWidths(): [
  ColumnWidths,
  React.Dispatch<React.SetStateAction<ColumnWidths>>,
] {
  const [widths, setWidths] = useState<ColumnWidths>(DEFAULT_WIDTHS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!isValid(parsed)) return;
      setWidths({
        left: Math.max(MIN_SIDE_WIDTH, Math.min(MAX_SIDE_WIDTH, parsed.left)),
        right: Math.max(MIN_SIDE_WIDTH, Math.min(MAX_SIDE_WIDTH, parsed.right)),
      });
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
  }, [widths]);

  return [widths, setWidths];
}
