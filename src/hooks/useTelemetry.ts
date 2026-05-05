// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
import type { Telemetry } from "../types";
import { robot } from "../robot";

const HISTORY_LIMIT = 180;
const TICK_HZ = 30;
type JointPoint = { t: number; angleDeg: number };
type JointHistory = Record<string, JointPoint[]>;

export function useTelemetry(): {
  tele: Telemetry | null;
  jointHistory: JointHistory;
} {
  const [tele, setTele] = useState<Telemetry | null>(null);
  const [jointHistory, setJointHistory] = useState<JointHistory>({});

  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = robot.readTelemetry();
      setTele(next);
      setJointHistory((prev) => {
        const out: JointHistory = {};
        const seen = new Set<string>();
        for (const j of next.joints) {
          seen.add(j.name);
          const hist = prev[j.name] ?? [];
          const withNew = [...hist, { t: next.t, angleDeg: j.angle_deg }];
          out[j.name] =
            withNew.length > HISTORY_LIMIT
              ? withNew.slice(withNew.length - HISTORY_LIMIT)
              : withNew;
        }
        for (const [name, hist] of Object.entries(prev)) {
          if (!seen.has(name) && hist.length > 0) {
            out[name] = hist.slice(Math.max(0, hist.length - 30));
          }
        }
        return out;
      });
    }, 1000 / TICK_HZ);

    return () => window.clearInterval(interval);
  }, []);

  return { tele, jointHistory };
}
