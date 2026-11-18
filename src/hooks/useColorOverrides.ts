// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useLocalStorageState } from "./useLocalStorageState";

const STORAGE_KEY = "open-duck-mini-viewer.color-overrides";
const HEX_RE = /^#[0-9a-f]{6}$/i;

type Overrides = Record<string, string>;

// Validate every entry — corrupt or attacker-supplied storage shouldn't
// get spliced into the picker.
function parseOverrides(raw: unknown): Overrides | null {
  if (!raw || typeof raw !== "object") return null;
  const next: Overrides = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && HEX_RE.test(v)) next[k] = v;
  }
  return next;
}

export function useColorOverrides(): [Overrides, React.Dispatch<React.SetStateAction<Overrides>>] {
  return useLocalStorageState<Overrides>(STORAGE_KEY, {}, parseOverrides);
}
