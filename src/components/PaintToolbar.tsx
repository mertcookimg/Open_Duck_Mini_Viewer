// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

interface Props {
  paintColor: string;
  selectedLink: string | null;
  overrides: Record<string, string>;
  onPaintColorChange: (hex: string) => void;
  onRandomizeAll: () => void;
  onResetSelected: () => void;
  onResetAll: () => void;
  onClose: () => void;
}

const PRESETS = [
  "#ffffff",
  "#1f2937",
  "#ef4444",
  "#f59e0b",
  "#facc15",
  "#10b981",
  "#3b82f6",
  "#a855f7",
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Bottom-of-viewer paint controls. Bucket-tool model: clicking a part on
 * the 3D model paints it with `paintColor`; the picker / presets / hex
 * input edit `paintColor` and live-update whatever part was last clicked.
 * No "scope" toggle — keep the active operation single and obvious.
 */
export function PaintToolbar({
  paintColor,
  selectedLink,
  overrides,
  onPaintColorChange,
  onRandomizeAll,
  onResetSelected,
  onResetAll,
  onClose,
}: Props) {
  const overrideCount = Object.keys(overrides).length;
  const overrideForSelected = selectedLink ? overrides[selectedLink] : undefined;

  const [hexDraft, setHexDraft] = useState(paintColor);
  useEffect(() => {
    setHexDraft(paintColor);
  }, [paintColor]);

  const commitHex = (raw: string) => {
    const v = raw.startsWith("#") ? raw : "#" + raw;
    if (HEX_RE.test(v)) onPaintColorChange(v.toLowerCase());
    else setHexDraft(paintColor);
  };

  const toolBtn =
    "px-2 py-1 rounded text-[11px] bg-slate-800 hover:bg-slate-700 " +
    "disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200";

  return (
    <div
      className={
        // Sit between the two view-control panels (D-pad ~7.5rem on the left,
        // zoom column ~3rem on the right). `mx-auto` + `max-w` keeps the
        // toolbar centred on wide viewers; on narrow viewers it shrinks to
        // the available band and wraps to multiple rows instead of
        // overlapping the view controls.
        "absolute bottom-3 left-[9rem] right-[4.5rem] mx-auto z-20 " +
        "max-w-[44rem] bg-slate-900/90 backdrop-blur rounded-lg " +
        "border border-slate-700 shadow-lg p-2 flex flex-wrap " +
        "items-center justify-center gap-2 text-xs text-slate-200"
      }
    >
      <input
        type="color"
        value={paintColor}
        onInput={(e) => onPaintColorChange((e.target as HTMLInputElement).value)}
        className="w-8 h-7 shrink-0 bg-transparent border border-slate-700 rounded cursor-pointer"
        title="Pick a colour"
      />
      <input
        type="text"
        value={hexDraft}
        onChange={(e) => setHexDraft(e.target.value)}
        onBlur={(e) => commitHex(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitHex((e.target as HTMLInputElement).value);
        }}
        placeholder="#rrggbb"
        className="w-20 shrink-0 px-1.5 py-1 rounded text-[11px] bg-slate-800 border border-slate-700 font-mono text-slate-200 placeholder:text-slate-500"
      />
      {PRESETS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPaintColorChange(c)}
          title={c}
          className="w-5 h-5 shrink-0 rounded border border-slate-700 hover:scale-110 transition-transform"
          style={{ background: c }}
        />
      ))}
      <span className="text-[10px] text-slate-500 truncate max-w-[10rem]">
        {selectedLink ? (
          <>
            <span className="uppercase mr-1">Last</span>
            <span className="text-slate-300">{selectedLink}</span>
          </>
        ) : (
          <span className="italic">Click a part to paint it</span>
        )}
      </span>
      <button
        type="button"
        onClick={onRandomizeAll}
        className={toolBtn + " shrink-0"}
        title="Give every part a random colour"
      >
        🎲 Random
      </button>
      <button
        type="button"
        onClick={onResetSelected}
        disabled={!selectedLink || !overrideForSelected}
        className={toolBtn + " shrink-0"}
        title="Restore the last-clicked part to its original colour"
      >
        Reset
      </button>
      <button
        type="button"
        onClick={onResetAll}
        disabled={overrideCount === 0}
        className={toolBtn + " shrink-0"}
        title="Restore every part"
      >
        Reset all
      </button>
      <button
        type="button"
        onClick={onClose}
        className="px-3 py-1 shrink-0 rounded text-[11px] bg-duck-600 hover:bg-duck-500 text-white"
      >
        Done
      </button>
    </div>
  );
}
