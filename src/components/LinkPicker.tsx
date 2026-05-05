// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";

interface Props {
  links: string[];
  defaults: Record<string, string>;
  overrides: Record<string, string>;
  selected: string | null;
  onSelect: (link: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Custom dropdown for picking a URDF link. Each row shows a colour swatch
 * (override or default) plus an "overridden" marker, and links are grouped
 * by their first underscore-prefix so the body / left / right / head halves
 * are easy to scan in long URDFs.
 */
export function LinkPicker({
  links,
  defaults,
  overrides,
  selected,
  onSelect,
  disabled,
  placeholder = "— select a part —",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedColor = selected ? (overrides[selected] ?? defaults[selected]) : undefined;
  const groups = groupLinks(links);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled || links.length === 0}
        className={
          "w-full bg-slate-800 hover:bg-slate-700 rounded px-2 py-1.5 text-xs text-left " +
          "flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        {selected ? (
          <>
            <Swatch color={selectedColor} />
            <span className="truncate flex-1 text-slate-200">{selected}</span>
            {selected in overrides && (
              <span className="text-amber-400 text-[10px]" title="overridden">
                ●
              </span>
            )}
          </>
        ) : (
          <span className="text-slate-500 flex-1">{placeholder}</span>
        )}
        <span className="text-slate-500 text-[10px]">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          className={
            "absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 " +
            "rounded shadow-lg max-h-72 overflow-y-auto"
          }
        >
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className="w-full text-left px-2 py-1 text-[11px] text-slate-500 italic hover:bg-slate-800"
          >
            {placeholder}
          </button>
          {groups.map(({ group, items }) => (
            <div key={group}>
              <div className="px-2 pt-2 pb-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                {group}
              </div>
              {items.map((name) => {
                const color = overrides[name] ?? defaults[name];
                const isSelected = name === selected;
                const isOverridden = name in overrides;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onSelect(name);
                      setOpen(false);
                    }}
                    className={
                      "w-full flex items-center gap-2 px-2 py-1 text-xs text-left " +
                      "hover:bg-slate-800 " +
                      (isSelected ? "bg-slate-800 text-amber-200" : "text-slate-200")
                    }
                  >
                    <Swatch color={color} />
                    <span className="truncate flex-1">{name}</span>
                    {isOverridden && (
                      <span className="text-amber-400 text-[10px]" title="overridden">
                        ●
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Swatch({ color }: { color?: string }) {
  return (
    <span
      className="inline-block w-3.5 h-3.5 rounded-sm border border-slate-700 flex-shrink-0"
      style={{ background: color ?? "transparent" }}
    />
  );
}

// Bucket links by their first underscore-prefix. Singletons drop into "Other"
// so the dropdown isn't littered with one-item groups.
function groupLinks(names: string[]): Array<{ group: string; items: string[] }> {
  const prefixCount = new Map<string, number>();
  for (const n of names) {
    const idx = n.indexOf("_");
    if (idx > 0) {
      const p = n.slice(0, idx);
      prefixCount.set(p, (prefixCount.get(p) ?? 0) + 1);
    }
  }
  const groups = new Map<string, string[]>();
  for (const n of names) {
    const idx = n.indexOf("_");
    const prefix = idx > 0 ? n.slice(0, idx) : "";
    const useGroup = !!prefix && (prefixCount.get(prefix) ?? 0) >= 2;
    const label = useGroup ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : "Other";
    const arr = groups.get(label);
    if (arr) arr.push(n);
    else groups.set(label, [n]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      return a.localeCompare(b);
    })
    .map(([group, items]) => ({ group, items: [...items].sort() }));
}
