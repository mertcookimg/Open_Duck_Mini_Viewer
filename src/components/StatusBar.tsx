// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import type { Battery, RobotMode } from "../types";

const COLOR: Record<RobotMode, string> = {
  idle: "bg-slate-500",
  standing: "bg-sky-500",
  walking: "bg-emerald-500",
  error: "bg-rose-500",
  estop: "bg-red-600 animate-pulse",
};

interface Props {
  mode: RobotMode | undefined;
  battery?: Battery | null;
  /** Extra controls rendered on the right, before the GitHub link. */
  children?: ReactNode;
}

export function StatusBar({ mode, battery, children }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border-b border-slate-800">
      <div className="text-duck-400 font-bold tracking-wide truncate min-w-0">
        🤖 Open Duck Mini Viewer
      </div>

      {mode &&
        (mode === "estop" ? (
          <span className="shrink-0 px-2 py-0.5 rounded bg-red-600/20 border border-red-500 text-red-300 text-xs font-bold tracking-wide animate-pulse">
            E-STOP
          </span>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${COLOR[mode]}`} />
            <span className="text-sm">{mode}</span>
          </div>
        ))}

      {battery && <BatteryPill battery={battery} />}

      <div className="ml-auto flex items-center gap-3 shrink-0">
        {children}
        <a
          href="https://github.com/mertcookimg/Open_Duck_Mini_Viewer"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Star this project on GitHub"
          title="Star this project on GitHub"
          className="inline-flex items-center gap-1.5 shrink-0 text-xs text-slate-500 hover:text-slate-200 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.43 7.43 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span className="hidden sm:inline">⭐ Star</span>
        </a>
      </div>
    </div>
  );
}

// Compact battery readout, always visible even when the Battery panel is
// hidden. Colour tracks the same thresholds as BatteryGauge.
function BatteryPill({ battery }: { battery: Battery }) {
  const pct = Math.max(0, Math.min(100, battery.percent));
  const colour = pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-500" : "bg-rose-500";
  const text = pct > 20 ? "text-slate-300" : "text-rose-300";
  return (
    <div
      className="flex items-center gap-1.5 shrink-0"
      title={`Battery ${pct.toFixed(0)}% · ${battery.voltage_v.toFixed(2)} V`}
    >
      <span className="relative w-6 h-3 rounded-sm border border-slate-600 overflow-hidden">
        <span className={`absolute inset-y-0 left-0 ${colour}`} style={{ width: `${pct}%` }} />
      </span>
      <span className={`text-xs tabular-nums ${text}`}>{pct.toFixed(0)}%</span>
    </div>
  );
}
