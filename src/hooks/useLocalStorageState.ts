// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

/**
 * `useState` persisted to localStorage under `key`.
 *
 * - The stored value is read synchronously on first render (lazy init), so
 *   saved layouts appear immediately instead of flashing the defaults.
 * - `parse` receives the JSON-decoded value and returns a sanitised `T`, or
 *   `null` to fall back to `initial` — corrupt or hand-edited storage never
 *   reaches the UI.
 * - Every storage access is guarded: when storage is unavailable or full
 *   (private browsing, disabled site data, quota), the state still works
 *   in-memory for the session instead of crashing the app.
 */
export function useLocalStorageState<T>(
  key: string,
  initial: T,
  parse: (raw: unknown) => T | null,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initial;
      return parse(JSON.parse(raw)) ?? initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — keep the in-memory value */
    }
  }, [key, value]);

  return [value, setValue];
}
