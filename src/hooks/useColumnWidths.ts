// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useLocalStorageState } from "./useLocalStorageState";

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

const clamp = (v: number) => Math.max(MIN_SIDE_WIDTH, Math.min(MAX_SIDE_WIDTH, v));

function parseWidths(raw: unknown): ColumnWidths | null {
  if (!isValid(raw)) return null;
  return { left: clamp(raw.left), right: clamp(raw.right) };
}

export function useColumnWidths(): [
  ColumnWidths,
  React.Dispatch<React.SetStateAction<ColumnWidths>>,
] {
  return useLocalStorageState(STORAGE_KEY, DEFAULT_WIDTHS, parseWidths);
}
