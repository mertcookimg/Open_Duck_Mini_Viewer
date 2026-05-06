// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

export type PanelKey =
  | "battery"
  | "imu"
  | "jointTrends"
  | "jointTable"
  | "poseEditor"
  | "viewer"
  | "operator"
  | "color"
  | "help";

export type PanelVisibility = Record<PanelKey, boolean>;

export const PANEL_LABELS: Record<PanelKey, string> = {
  battery: "Battery",
  imu: "IMU",
  jointTrends: "Joint Trends",
  jointTable: "Joint Table",
  poseEditor: "Pose Editor",
  viewer: "3D Viewer",
  operator: "Operator",
  color: "Color",
  help: "Help",
};

export const DEFAULT_PANELS: PanelVisibility = {
  battery: false,
  imu: false,
  jointTrends: false,
  jointTable: false,
  poseEditor: true,
  viewer: true,
  operator: true,
  color: true,
  help: true,
};

export const PANEL_PRESETS: Record<string, PanelVisibility> = {
  "All panels": { ...DEFAULT_PANELS },
  "Trends + 3D": {
    battery: false,
    imu: false,
    jointTrends: true,
    jointTable: false,
    poseEditor: true,
    viewer: true,
    operator: false,
    color: false,
    help: false,
  },
  "Telemetry only": {
    battery: true,
    imu: true,
    jointTrends: true,
    jointTable: true,
    poseEditor: true,
    viewer: false,
    operator: false,
    color: false,
    help: false,
  },
  "Operate + 3D": {
    battery: true,
    imu: false,
    jointTrends: false,
    jointTable: false,
    poseEditor: false,
    viewer: true,
    operator: true,
    color: false,
    help: true,
  },
};

interface Props {
  panels: PanelVisibility;
  onToggle: (key: PanelKey) => void;
  onSetAll: (value: boolean) => void;
  onApplyPreset: (preset: PanelVisibility) => void;
}

export function PanelVisibilityPicker({ panels, onToggle, onSetAll, onApplyPreset }: Props) {
  const [open, setOpen] = useState(false);
  const [activePresetName, setActivePresetName] = useState("All panels");
  const visibleCount = Object.values(panels).filter(Boolean).length;
  const total = Object.keys(panels).length;

  const btn =
    "px-2 py-1 rounded text-[10px] border bg-slate-800 border-slate-700 " +
    "text-slate-300 hover:bg-slate-700";
  const active = "px-2 py-1 rounded text-[10px] border bg-duck-600 border-duck-500 text-white";

  return (
    <div className="px-3 pt-2">
      <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase text-slate-400">Visible panels</span>
          <span className="text-[10px] text-slate-500">
            {visibleCount}/{total}
          </span>
          <button type="button" onClick={() => setOpen((v) => !v)} className={`ml-auto ${btn}`}>
            {open ? "Hide" : "Show"}
          </button>
        </div>
        {open && (
          <>
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-slate-500 mr-1">Presets</span>
              {Object.entries(PANEL_PRESETS).map(([name, preset]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onApplyPreset(preset);
                    setActivePresetName(name);
                  }}
                  className={activePresetName === name ? active : btn}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {(Object.keys(PANEL_LABELS) as PanelKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onToggle(key);
                    setActivePresetName("Custom");
                  }}
                  className={panels[key] ? active : btn}
                >
                  {PANEL_LABELS[key]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onSetAll(true);
                  setActivePresetName("All panels");
                }}
                className={btn}
              >
                All on
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetAll(false);
                  setActivePresetName("Custom");
                }}
                className={btn}
              >
                All off
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
