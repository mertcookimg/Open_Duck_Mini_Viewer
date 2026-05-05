// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

const STORAGE_KEY = "open-duck-mini-viewer.color-overrides";
const HEX_RE = /^#[0-9a-f]{6}$/i;

type Overrides = Record<string, string>;

export function useColorOverrides(): [
  Overrides,
  React.Dispatch<React.SetStateAction<Overrides>>,
] {
  const [overrides, setOverrides] = useState<Overrides>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      // Validate every entry — corrupt or attacker-supplied storage shouldn't
      // get spliced into the picker.
      const next: Overrides = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "string" && HEX_RE.test(v)) next[k] = v;
      }
      if (Object.keys(next).length > 0) setOverrides(next);
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides]);

  return [overrides, setOverrides];
}
