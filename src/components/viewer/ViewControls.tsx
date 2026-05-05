// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

interface Props {
  onRotate: (azim: number, elev: number) => void;
  onZoom: (factor: number) => void;
  onReset: () => void;
  onPreset: (p: "front" | "side" | "top" | "iso") => void;
}

const STEP_DEG = 10;
const BTN =
  "w-8 h-8 rounded bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 " +
  "text-slate-200 text-sm select-none flex items-center justify-center";

export function ViewControls({ onRotate, onZoom, onReset, onPreset }: Props) {
  return (
    <>
      <div className="absolute bottom-3 left-3 grid grid-cols-3 grid-rows-3 gap-1 p-2 bg-slate-900/80 rounded-lg backdrop-blur z-10">
        <span />
        <button className={BTN} onClick={() => onRotate(0, -STEP_DEG)} aria-label="rotate up">
          ↑
        </button>
        <span />
        <button className={BTN} onClick={() => onRotate(-STEP_DEG, 0)} aria-label="rotate left">
          ←
        </button>
        <button className={BTN} onClick={onReset} aria-label="reset">
          ⌂
        </button>
        <button className={BTN} onClick={() => onRotate(STEP_DEG, 0)} aria-label="rotate right">
          →
        </button>
        <span />
        <button className={BTN} onClick={() => onRotate(0, STEP_DEG)} aria-label="rotate down">
          ↓
        </button>
        <span />
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1 p-2 bg-slate-900/80 rounded-lg backdrop-blur z-10">
        <button className={BTN} onClick={() => onZoom(0.85)} aria-label="zoom in">
          +
        </button>
        <button className={BTN} onClick={() => onZoom(1.15)} aria-label="zoom out">
          −
        </button>
        <div className="h-px bg-slate-700 my-1" />
        <button className={BTN} onClick={() => onPreset("front")} title="front (1)">
          F
        </button>
        <button className={BTN} onClick={() => onPreset("side")} title="side (3)">
          S
        </button>
        <button className={BTN} onClick={() => onPreset("top")} title="top (7)">
          T
        </button>
        <button className={BTN} onClick={() => onPreset("iso")} title="iso (5)">
          I
        </button>
      </div>
    </>
  );
}
