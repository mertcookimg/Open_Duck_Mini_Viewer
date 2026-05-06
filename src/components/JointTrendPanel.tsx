// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useMemo, useRef, useState } from "react";
import type { JointState } from "../types";

type JointPoint = { t: number; angleDeg: number };
type JointHistory = Record<string, JointPoint[]>;

interface Props {
  joints: JointState[];
  history: JointHistory;
}

const ANGLE_RANGES = [45, 90, 180] as const;

export function JointTrendPanel({ joints, history }: Props) {
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [rangeDeg, setRangeDeg] = useState<(typeof ANGLE_RANGES)[number]>(90);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const initializedSelectionRef = useRef(false);

  useEffect(() => {
    if (joints.length === 0) return;
    setSelectedNames((prev) => {
      if (prev.length === 0) {
        if (!initializedSelectionRef.current) {
          initializedSelectionRef.current = true;
          return joints.map((joint) => joint.name);
        }
        return prev;
      }
      const valid = new Set(joints.map((joint) => joint.name));
      const kept = prev.filter((name) => valid.has(name));
      if (kept.length > 0) return kept;
      return joints.map((joint) => joint.name);
    });
  }, [joints]);

  const visibleJoints = useMemo(() => {
    const selected = new Set(selectedNames);
    return joints.filter((joint) => selected.has(joint.name));
  }, [joints, selectedNames]);

  const majorNames = useMemo(
    () => joints.filter((joint) => isMajorJoint(joint.name)).map((joint) => joint.name),
    [joints],
  );
  const filteredJoints = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return joints;
    return joints.filter((joint) => joint.name.toLowerCase().includes(q));
  }, [joints, query]);
  const selectedPreview = useMemo(() => selectedNames.slice(0, 3), [selectedNames]);

  return (
    <div className="bg-slate-900 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs uppercase text-slate-400">Joint Trends (last ~6s)</div>
        <div className="flex gap-1">
          {ANGLE_RANGES.map((value) => (
            <ToggleButton
              key={value}
              active={rangeDeg === value}
              onClick={() => setRangeDeg(value)}
            >
              {`±${value}`}
            </ToggleButton>
          ))}
        </div>
      </div>
      <div className="mb-3 p-2 rounded bg-slate-800/70 border border-slate-700 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-300">
            Showing {visibleJoints.length} / {joints.length}
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="px-2 py-1 rounded text-[10px] border border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-700"
          >
            {pickerOpen ? "Hide selector" : "Select joints"}
          </button>
        </div>
        <div className="text-[10px] text-slate-400">
          {selectedNames.length === 0
            ? "No joints selected"
            : `Selected: ${selectedPreview.join(", ")}${
                selectedNames.length > selectedPreview.length
                  ? ` +${selectedNames.length - selectedPreview.length}`
                  : ""
              }`}
        </div>
        {pickerOpen && (
          <>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search joints..."
              className="w-full px-2 py-1 rounded text-xs bg-slate-900 border border-slate-600 text-slate-200 placeholder:text-slate-500"
            />
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="text-[11px] text-slate-400">Filtered: {filteredJoints.length}</div>
              <div className="flex gap-1">
                <ToggleButton
                  active={visibleJoints.length === joints.length}
                  onClick={() => setSelectedNames(joints.map((joint) => joint.name))}
                >
                  All
                </ToggleButton>
                <ToggleButton
                  active={
                    visibleJoints.length > 0 &&
                    visibleJoints.every((joint) => majorNames.includes(joint.name))
                  }
                  onClick={() =>
                    setSelectedNames(
                      majorNames.length > 0
                        ? majorNames
                        : joints.slice(0, 8).map((joint) => joint.name),
                    )
                  }
                >
                  Major
                </ToggleButton>
                <ToggleButton
                  active={visibleJoints.length === 0}
                  onClick={() => setSelectedNames([])}
                >
                  Clear
                </ToggleButton>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
              {filteredJoints.map((joint) => {
                const active = selectedNames.includes(joint.name);
                return (
                  <button
                    key={joint.name}
                    type="button"
                    onClick={() =>
                      setSelectedNames((prev) =>
                        prev.includes(joint.name)
                          ? prev.filter((name) => name !== joint.name)
                          : [...prev, joint.name],
                      )
                    }
                    className={`px-2 py-1 rounded text-[10px] border ${
                      active
                        ? "bg-duck-600 border-duck-500 text-white"
                        : "bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {joint.name}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
      <div className="space-y-2">
        {visibleJoints.map((joint) => (
          <JointSparkline
            key={joint.name}
            name={joint.name}
            current={joint.angle_deg}
            points={history[joint.name] ?? []}
            rangeDeg={rangeDeg}
          />
        ))}
        {visibleJoints.length === 0 && (
          <div className="text-xs text-slate-400 text-center py-4">No joints selected.</div>
        )}
      </div>
    </div>
  );
}

function JointSparkline({
  name,
  current,
  points,
  rangeDeg,
}: {
  name: string;
  current: number;
  points: JointPoint[];
  rangeDeg: number;
}) {
  const width = 180;
  const height = 32;
  const centerY = height / 2;
  const path = buildPath(points, width, height, rangeDeg);

  return (
    <div className="grid grid-cols-[minmax(0,9rem)_minmax(3rem,1fr)_3.5rem] gap-2 items-center text-xs">
      <span className="text-slate-300 truncate min-w-0">{name}</span>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-8 rounded bg-slate-800"
        role="img"
        aria-label={`${name} angle history`}
      >
        <line x1="0" y1={centerY} x2={width} y2={centerY} className="stroke-slate-600" />
        {path && <path d={path} fill="none" className="stroke-duck-500" strokeWidth="1.8" />}
      </svg>
      <span className="text-right tabular-nums text-slate-200">{current.toFixed(1)}°</span>
    </div>
  );
}

function buildPath(points: JointPoint[], width: number, height: number, rangeDeg: number): string {
  if (points.length < 2) return "";
  const minT = points[0]?.t ?? 0;
  const maxT = points[points.length - 1]?.t ?? minT + 1;
  const spanT = Math.max(maxT - minT, 1e-6);
  const centerY = height / 2;
  const scaleY = centerY / rangeDeg;

  let d = "";
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    const x = ((p.t - minT) / spanT) * width;
    const clamped = Math.max(-rangeDeg, Math.min(rangeDeg, p.angleDeg));
    const y = centerY - clamped * scaleY;
    d += `${i === 0 ? "M" : " L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

function isMajorJoint(name: string): boolean {
  return /(hip|knee|ankle|shoulder|elbow|waist|neck|head)/i.test(name);
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded text-[10px] border transition-colors ${
        active
          ? "bg-duck-600 border-duck-500 text-white"
          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
