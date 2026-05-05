// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useState } from "react";
import type { Telemetry } from "../types";

export interface PoseOverridesState {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  overrides: Record<string, number>;
  setOverride: (name: string, angleDeg: number) => void;
  clear: () => void;
  /** Apply the override map onto a telemetry frame, keeping shape intact. */
  apply: (tele: Telemetry | null) => Telemetry | null;
}

export function usePoseOverrides(tele: Telemetry | null): PoseOverridesState {
  const [enabled, setEnabled] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  // Drop overrides for joints no longer present in telemetry.
  useEffect(() => {
    if (!tele) return;
    const names = new Set(tele.joints.map((j) => j.name));
    setOverrides((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([name]) => names.has(name))),
    );
  }, [tele]);

  const apply = useMemo(
    () =>
      (frame: Telemetry | null): Telemetry | null => {
        if (!frame) return null;
        if (!enabled) return frame;
        return {
          ...frame,
          joints: frame.joints.map((j) =>
            Object.prototype.hasOwnProperty.call(overrides, j.name)
              ? { ...j, angle_deg: overrides[j.name] ?? j.angle_deg }
              : j,
          ),
        };
      },
    [enabled, overrides],
  );

  return {
    enabled,
    setEnabled,
    overrides,
    setOverride: (name, angleDeg) => setOverrides((prev) => ({ ...prev, [name]: angleDeg })),
    clear: () => {
      setOverrides({});
      setEnabled(false);
    },
    apply,
  };
}
