// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import type { JointState } from "../types";

interface Props {
  joints: JointState[];
}

export function JointTable({ joints }: Props) {
  return (
    <div className="bg-slate-900 rounded-lg p-3">
      <div className="text-xs uppercase text-slate-400 mb-2">Joints</div>
      <div className="space-y-1">
        {joints.map((j) => (
          <JointRow key={j.name} joint={j} />
        ))}
      </div>
    </div>
  );
}

function JointRow({ joint }: { joint: JointState }) {
  // Visualise -90..+90 deg as a centred bar; clamp for display only.
  const clamped = Math.max(-90, Math.min(90, joint.angle_deg));
  const pct = (clamped + 90) / 180; // 0..1
  return (
    <div className="grid grid-cols-[minmax(0,10rem)_minmax(3rem,1fr)_3.5rem] gap-2 items-center text-xs">
      <span className="text-slate-300 truncate min-w-0">{joint.name}</span>
      <div className="relative h-2 bg-slate-800 rounded-full">
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-600" />
        <div
          className="absolute inset-y-0 bg-duck-500 rounded-full"
          style={{
            left: `${Math.min(50, pct * 100)}%`,
            width: `${Math.abs(pct * 100 - 50)}%`,
          }}
        />
      </div>
      <span className="text-right tabular-nums text-slate-200">{joint.angle_deg.toFixed(1)}°</span>
    </div>
  );
}
