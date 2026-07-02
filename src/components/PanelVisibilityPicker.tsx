// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";

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

/**
 * "Panels" button + dropdown. Lives in the status bar so panel management
 * costs zero vertical space when closed. Closes on outside-click or Esc.
 */
export function PanelVisibilityPicker({ panels, onToggle, onSetAll, onApplyPreset }: Props) {
  const [open, setOpen] = useState(false);
  const [activePresetName, setActivePresetName] = useState("All panels");
  const rootRef = useRef<HTMLDivElement>(null);
  const visibleCount = Object.values(panels).filter(Boolean).length;
  const total = Object.keys(panels).length;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const btn =
    "px-2 py-1 rounded text-[10px] border bg-slate-800 border-slate-700 " +
    "text-slate-300 hover:bg-slate-700";
  const active = "px-2 py-1 rounded text-[10px] border bg-duck-600 border-duck-500 text-white";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Show / hide panels"
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors ${
          open
            ? "bg-slate-700 border-slate-600 text-slate-100"
            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
        }`}
      >
        <span aria-hidden="true">▦</span>
        <span>Panels</span>
        <span className="text-slate-500 tabular-nums">
          {visibleCount}/{total}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-1.5rem)] bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg shadow-xl p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-slate-500 mr-1 w-full">Presets</span>
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
            <span className="text-[10px] text-slate-500 mr-1 w-full">Panels</span>
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
          <div className="flex items-center gap-1 pt-1 border-t border-slate-800">
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
        </div>
      )}
    </div>
  );
}
