// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useLocalStorageState } from "./useLocalStorageState";

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

const clamp = (v: number) => Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, v));

function parseHeights(raw: unknown): RowHeights | null {
  if (!isValid(raw)) return null;
  return { top: clamp(raw.top), bottom: clamp(raw.bottom) };
}

export function useRowHeights(): [RowHeights, React.Dispatch<React.SetStateAction<RowHeights>>] {
  return useLocalStorageState(STORAGE_KEY, DEFAULT_HEIGHTS, parseHeights);
}
