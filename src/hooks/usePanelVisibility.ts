// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import {
  DEFAULT_PANELS,
  type PanelKey,
  type PanelVisibility,
} from "../components/PanelVisibilityPicker";
import { useLocalStorageState } from "./useLocalStorageState";

const STORAGE_KEY = "open-duck-mini-viewer.panel-visibility";

// Take known boolean keys from storage; anything missing or malformed falls
// back to the default, so newly added panels pick up their default state.
function parsePanels(raw: unknown): PanelVisibility | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<Record<PanelKey, unknown>>;
  return Object.fromEntries(
    (Object.keys(DEFAULT_PANELS) as PanelKey[]).map((k) => {
      const v = parsed[k];
      return [k, typeof v === "boolean" ? v : DEFAULT_PANELS[k]];
    }),
  ) as PanelVisibility;
}

export function usePanelVisibility(): [
  PanelVisibility,
  React.Dispatch<React.SetStateAction<PanelVisibility>>,
] {
  return useLocalStorageState(STORAGE_KEY, DEFAULT_PANELS, parsePanels);
}
