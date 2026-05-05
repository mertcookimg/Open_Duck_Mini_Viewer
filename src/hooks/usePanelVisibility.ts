// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
import {
  DEFAULT_PANELS,
  type PanelKey,
  type PanelVisibility,
} from "../components/PanelVisibilityPicker";

const STORAGE_KEY = "open-duck-mini-viewer.panel-visibility";

export function usePanelVisibility(): [
  PanelVisibility,
  React.Dispatch<React.SetStateAction<PanelVisibility>>,
] {
  const [panels, setPanels] = useState<PanelVisibility>(DEFAULT_PANELS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PanelVisibility>;
      setPanels((prev) => ({
        ...prev,
        ...Object.fromEntries(
          (Object.keys(DEFAULT_PANELS) as PanelKey[]).map((k) => [
            k,
            typeof parsed[k] === "boolean" ? parsed[k] : prev[k],
          ]),
        ),
      }));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
  }, [panels]);

  return [panels, setPanels];
}
