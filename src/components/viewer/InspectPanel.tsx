// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { InspectMode } from "./types";

interface Props {
  viewMode: InspectMode;
  setViewMode: Dispatch<SetStateAction<InspectMode>>;
  explode: number;
  setExplode: Dispatch<SetStateAction<number>>;
  lockPose: boolean;
  setLockPose: Dispatch<SetStateAction<boolean>>;
  animate: boolean;
  setAnimate: Dispatch<SetStateAction<boolean>>;
}

const MODES: InspectMode[] = ["solid", "transparent", "wireframe", "xray"];

/** Top-right overlay: rendering mode + explode slider + animation/lock toggles. */
export function InspectPanel({
  viewMode,
  setViewMode,
  explode,
  setExplode,
  lockPose,
  setLockPose,
  animate,
  setAnimate,
}: Props) {
  const [open, setOpen] = useState(false);
  const row = "flex items-center gap-1.5 cursor-pointer select-none";

  return (
    <div
      className={
        "absolute top-3 right-3 flex flex-col gap-2 p-2 bg-slate-900/80 rounded-lg backdrop-blur z-10 text-xs text-slate-200 " +
        (open ? "w-44" : "")
      }
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-semibold text-slate-300 select-none cursor-pointer"
      >
        <span className="w-3 inline-block">{open ? "▾" : "▸"}</span>
        Inspect
      </button>
      {open && (
        <>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as InspectMode)}
            className="bg-slate-800 rounded px-1.5 py-1 text-xs"
          >
            {MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Explode</span>
              <span>{Math.round(explode * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={explode}
              disabled={animate}
              onChange={(e) => setExplode(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <label className={row}>
            <input
              type="checkbox"
              checked={animate}
              onChange={(e) => setAnimate(e.target.checked)}
            />
            Animate (4s loop)
          </label>
          <label className={row}>
            <input
              type="checkbox"
              checked={lockPose}
              onChange={(e) => setLockPose(e.target.checked)}
            />
            Lock pose while exploded
          </label>
        </>
      )}
    </div>
  );
}
