// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { LinkPicker, Swatch } from "./LinkPicker";

interface Props {
  linkNames: string[];
  linkDefaults: Record<string, string>;
  selectedLink: string | null;
  onSelectLink: (link: string | null) => void;
  colorOverrides: Record<string, string>;
  onSetColor: (link: string, hex: string) => void;
  onResetLink: (link: string) => void;
  onResetAll: () => void;
  onSetAllColor: (hex: string) => void;
}

const DEFAULT_PICKER = "#94a3b8"; // slate-400 — neutral starting swatch

export function ColorPanel({
  linkNames,
  linkDefaults,
  selectedLink,
  onSelectLink,
  colorOverrides,
  onSetColor,
  onResetLink,
  onResetAll,
  onSetAllColor,
}: Props) {
  const overriddenColor = selectedLink ? colorOverrides[selectedLink] : undefined;
  const defaultColor = selectedLink ? linkDefaults[selectedLink] : undefined;
  // The picker should always mirror what the user sees in the 3D view —
  // override if any, otherwise the part's original colour.
  const displayedColor = overriddenColor ?? defaultColor;
  const overrideEntries = Object.entries(colorOverrides);
  const overrideCount = overrideEntries.length;
  const [bulkColor, setBulkColor] = useState(DEFAULT_PICKER);
  const [showOverrides, setShowOverrides] = useState(false);
  const btn =
    "px-2 py-1 rounded text-[11px] bg-slate-800 hover:bg-slate-700 " +
    "disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200";

  return (
    <div className="bg-slate-900 rounded-lg p-3 text-xs text-slate-300 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-300 uppercase text-[10px]">Color</span>
        {overrideCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowOverrides((v) => !v)}
            className="text-[10px] text-amber-300 hover:text-amber-200 cursor-pointer"
            title="Show / hide overridden parts"
          >
            {overrideCount} overridden {showOverrides ? "▴" : "▾"}
          </button>
        ) : (
          <span className="text-[10px] text-slate-500">default colors</span>
        )}
      </div>

      {showOverrides && overrideCount > 0 && (
        <div className="border border-slate-700 rounded p-1.5 space-y-1 max-h-40 overflow-y-auto">
          {overrideEntries.map(([link, hex]) => (
            <div key={link} className="flex items-center gap-2">
              <Swatch color={hex} />
              <button
                type="button"
                onClick={() => onSelectLink(link)}
                className={
                  "truncate flex-1 text-left text-[11px] hover:text-amber-300 " +
                  (selectedLink === link ? "text-amber-200" : "text-slate-300")
                }
                title={`Select ${link}`}
              >
                {link}
              </button>
              <span className="font-mono text-[10px] text-slate-500">{hex}</span>
              <button
                type="button"
                onClick={() => onResetLink(link)}
                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Reset this part"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="text-[10px] text-slate-400">Per part</div>
      <LinkPicker
        links={linkNames}
        defaults={linkDefaults}
        overrides={colorOverrides}
        selected={selectedLink}
        onSelect={onSelectLink}
      />

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={displayedColor ?? DEFAULT_PICKER}
          onInput={(e) =>
            selectedLink && onSetColor(selectedLink, (e.target as HTMLInputElement).value)
          }
          disabled={!selectedLink}
          className="w-8 h-7 bg-transparent border border-slate-700 rounded cursor-pointer disabled:opacity-40"
          title="Pick a color for the selected part"
        />
        <span
          className={
            "text-[11px] font-mono " + (overriddenColor ? "text-slate-200" : "text-slate-500")
          }
          title={overriddenColor ? "overridden" : "original"}
        >
          {displayedColor ?? "—"}
        </span>
        <button
          type="button"
          onClick={() => selectedLink && onResetLink(selectedLink)}
          disabled={!overriddenColor}
          className={btn + " ml-auto"}
          title="Restore the selected part to its original color"
        >
          Reset
        </button>
      </div>

      <div className="border-t border-slate-700 pt-2 mt-1 flex flex-col gap-1.5">
        <div className="text-[10px] text-slate-400">All parts</div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={bulkColor}
            onInput={(e) => setBulkColor((e.target as HTMLInputElement).value)}
            disabled={linkNames.length === 0}
            className="w-8 h-7 bg-transparent border border-slate-700 rounded cursor-pointer disabled:opacity-40"
            title="Pick a color to apply to every part"
          />
          <span className="text-[11px] text-slate-400 font-mono">{bulkColor}</span>
          <button
            type="button"
            onClick={() => onSetAllColor(bulkColor)}
            disabled={linkNames.length === 0}
            className={btn + " ml-auto"}
            title="Paint every part this color"
          >
            Apply to all
          </button>
          <button
            type="button"
            onClick={onResetAll}
            disabled={overrideCount === 0}
            className={btn}
            title="Restore every part to its original color"
          >
            Reset all
          </button>
        </div>
      </div>

      {linkNames.length === 0 && (
        <div className="text-[10px] text-slate-500 italic">
          Waiting for the URDF to finish loading…
        </div>
      )}
    </div>
  );
}
