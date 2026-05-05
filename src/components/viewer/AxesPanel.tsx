// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { AxesState } from "./types";

interface Props {
  axes: AxesState;
  setAxes: Dispatch<SetStateAction<AxesState>>;
}

/** Top-left overlay: world / body / joint axis-helper toggles. */
export function AxesPanel({ axes, setAxes }: Props) {
  const [open, setOpen] = useState(false);
  const toggle = (key: keyof AxesState) => (e: ChangeEvent<HTMLInputElement>) =>
    setAxes((s) => ({ ...s, [key]: e.target.checked }));
  const row = "flex items-center gap-1.5 cursor-pointer select-none";

  return (
    <div className="absolute top-3 left-3 flex flex-col gap-1 p-2 bg-slate-900/80 rounded-lg backdrop-blur z-10 text-xs text-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-semibold text-slate-300 select-none cursor-pointer"
      >
        <span className="w-3 inline-block">{open ? "▾" : "▸"}</span>
        Axes
      </button>
      {open && (
        <>
          <label className={row}>
            <input type="checkbox" checked={axes.world} onChange={toggle("world")} />
            World
          </label>
          <label className={row}>
            <input type="checkbox" checked={axes.body} onChange={toggle("body")} />
            Body
          </label>
          <label className={row}>
            <input type="checkbox" checked={axes.joint} onChange={toggle("joint")} />
            Joints
          </label>
          <div className="flex gap-2 pt-1 mt-1 border-t border-slate-700 text-[10px]">
            <span className="text-red-400">X</span>
            <span className="text-green-400">Y</span>
            <span className="text-blue-400">Z</span>
          </div>
        </>
      )}
    </div>
  );
}
