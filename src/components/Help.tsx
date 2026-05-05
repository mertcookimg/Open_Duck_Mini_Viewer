// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

export function Help() {
  const kbd = "px-1 bg-slate-800 rounded";
  return (
    <div className="bg-slate-900 rounded-lg p-3 text-xs text-slate-400 space-y-1">
      <div className="text-slate-300 uppercase text-[10px]">Robot</div>
      <div>
        <kbd className={kbd}>W A S D</kbd> move · <kbd className={kbd}>Q E</kbd> turn
      </div>
      <div className="text-slate-300 uppercase text-[10px] pt-2">3D view</div>
      <div>
        <kbd className={kbd}>← ↑ → ↓</kbd> rotate (Shift = faster)
      </div>
      <div>
        <kbd className={kbd}>+ −</kbd> zoom · <kbd className={kbd}>0</kbd> reset
      </div>
      <div>
        <kbd className={kbd}>1 / 3 / 7 / 5</kbd> front / side / top / iso
      </div>
      <div className="pt-2 text-slate-500">
        On-screen buttons in the 3D pane work for touch / no-mouse use.
      </div>
    </div>
  );
}
