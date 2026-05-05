// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

export function PanelHiddenHint({ label }: { label: string }) {
  return (
    <div className="bg-slate-900 rounded-lg p-4 text-xs text-slate-500 text-center">
      {label} panels are hidden.
    </div>
  );
}
