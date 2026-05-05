// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";

interface Props {
  size?: number;
  onChange: (x: number, y: number) => void; // x,y in [-1,1]
  label?: string;
}

/** Touch / mouse joystick. (0,0) is centred; positive y is "up". */
export function Joystick({ size = 160, onChange, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);

  const radius = size / 2;
  const knobR = size * 0.18;

  useEffect(() => {
    onChange(pos.x, pos.y);
  }, [pos, onChange]);

  const updateFromEvent = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = clientX - (rect.left + radius);
    const dy = clientY - (rect.top + radius);
    const r = Math.min(Math.hypot(dx, dy), radius);
    const a = Math.atan2(dy, dx);
    const cx = (Math.cos(a) * r) / radius;
    const cy = (Math.sin(a) * r) / radius;
    setPos({ x: cx, y: -cy }); // invert so up is positive
  };

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {label && <div className="text-xs uppercase text-slate-400">{label}</div>}
      <div
        ref={ref}
        className="relative rounded-full bg-slate-800 border border-slate-700 touch-none"
        style={{ width: size, height: size }}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          updateFromEvent(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging.current) updateFromEvent(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          dragging.current = false;
          setPos({ x: 0, y: 0 });
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setPos({ x: 0, y: 0 });
        }}
      >
        <div className="absolute inset-1/2 w-px h-full -translate-x-1/2 -translate-y-1/2 bg-slate-700" />
        <div className="absolute inset-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-slate-700" />
        <div
          className="absolute rounded-full bg-duck-500 shadow-lg"
          style={{
            width: knobR * 2,
            height: knobR * 2,
            left: radius + pos.x * (radius - knobR) - knobR,
            top: radius - pos.y * (radius - knobR) - knobR,
            transition: dragging.current ? "none" : "all 0.15s ease-out",
          }}
        />
      </div>
      <div className="text-[10px] tabular-nums text-slate-500">
        {pos.x.toFixed(2)}, {pos.y.toFixed(2)}
      </div>
    </div>
  );
}
