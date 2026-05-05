// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
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

const GROUP_ORDER = ["Left Leg", "Right Leg", "Head", "Antennas", "Other"] as const;
type GroupName = (typeof GROUP_ORDER)[number];

function groupOf(name: string): GroupName {
  if (name.startsWith("left_hip") || name === "left_knee" || name === "left_ankle")
    return "Left Leg";
  if (name.startsWith("right_hip") || name === "right_knee" || name === "right_ankle")
    return "Right Leg";
  if (name === "left_antenna" || name === "right_antenna") return "Antennas";
  if (name.startsWith("head_") || name === "neck_pitch") return "Head";
  return "Other";
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
  const configMap = useMemo(
    () => new Map(jointConfigs.map((cfg) => [cfg.name, cfg])),
    [jointConfigs],
  );
  const grouped = useMemo(() => {
    const map = new Map<GroupName, JointState[]>();
    for (const j of joints) {
      const g = groupOf(j.name);
      const list = map.get(g);
      if (list) list.push(j);
      else map.set(g, [j]);
    }
    return GROUP_ORDER.flatMap((g) => {
      const list = map.get(g);
      return list && list.length > 0 ? [{ name: g, joints: list }] : [];
    });
  }, [joints]);

  return (
    <div className="bg-slate-900 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase text-slate-400">Pose Editor</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearOverrides}
            className="px-2 py-1 rounded text-[10px] border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          >
            Reset
          </button>
          <label className="text-[11px] text-slate-300 inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
            />
            Enable
          </label>
        </div>
      </div>
      {!enabled && (
        <div className="text-[11px] text-slate-500">
          While off, live telemetry drives the joints. Enable to override them with the slider
          values below.
        </div>
      )}
      <div className="space-y-3">
        {grouped.map((group) => (
          <div key={group.name} className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{group.name}</div>
            {group.joints.map((joint) => {
              const cfg = configMap.get(joint.name);
              const min = cfg?.min_deg ?? -90;
              const max = cfg?.max_deg ?? 90;
              const value = overrides[joint.name] ?? joint.angle_deg;
              return (
                <div key={joint.name} className="space-y-0.5">
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
        ))}
      </div>
    </div>
  );
}
