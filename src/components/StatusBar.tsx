// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import type { RobotMode } from "../types";

const COLOR: Record<RobotMode, string> = {
  idle: "bg-slate-500",
  standing: "bg-sky-500",
  walking: "bg-emerald-500",
  error: "bg-rose-500",
  estop: "bg-red-600 animate-pulse",
};

interface Props {
  mode: RobotMode | undefined;
  t: number | undefined;
}

export function StatusBar({ mode, t }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900 border-b border-slate-800">
      <div className="text-duck-400 font-bold tracking-wide">🤖 Open Duck Mini Viewer</div>

      {mode && (
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${COLOR[mode]}`} />
          <span className="text-sm">{mode}</span>
        </div>
      )}

      {t !== undefined && (
        <div className="text-xs text-slate-500 ml-auto">t = {t.toFixed(1)} s</div>
      )}
    </div>
  );
}
