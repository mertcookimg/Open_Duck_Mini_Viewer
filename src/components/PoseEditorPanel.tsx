// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from "react";
import type { JointConfig, JointState } from "../types";

interface Props {
  joints: JointState[];
  jointConfigs: JointConfig[];
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  overrides: Record<string, number>;
  onSetOverride: (name: string, angleDeg: number) => void;
  onClearOverrides: () => void;
}

export function PoseEditorPanel({
  joints,
  jointConfigs,
  enabled,
  onEnabledChange,
  overrides,
  onSetOverride,
  onClearOverrides,
}: Props) {
  const [query, setQuery] = useState("");
  const configMap = useMemo(
    () => new Map(jointConfigs.map((cfg) => [cfg.name, cfg])),
    [jointConfigs],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return joints;
    return joints.filter((j) => j.name.toLowerCase().includes(q));
  }, [joints, query]);

  return (
    <div className="bg-slate-900 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase text-slate-400">Pose Editor</div>
        <label className="text-[11px] text-slate-300 inline-flex items-center gap-1">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
          Enable
        </label>
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search joints..."
          className="flex-1 px-2 py-1 rounded text-xs bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={onClearOverrides}
          className="px-2 py-1 rounded text-[10px] border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
        >
          Reset
        </button>
      </div>
      {!enabled && (
        <div className="text-[11px] text-slate-500">
          While off, live telemetry drives the joints. Enable to override them with the slider
          values below.
        </div>
      )}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {filtered.map((joint) => {
          const cfg = configMap.get(joint.name);
          const min = cfg?.min_deg ?? -90;
          const max = cfg?.max_deg ?? 90;
          const value = overrides[joint.name] ?? joint.angle_deg;
          return (
            <div key={joint.name} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 truncate">{joint.name}</span>
                <span className="tabular-nums text-slate-200">{value.toFixed(1)} deg</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={0.5}
                value={Math.max(min, Math.min(max, value))}
                onChange={(e) => onSetOverride(joint.name, Number(e.target.value))}
                className="w-full"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
