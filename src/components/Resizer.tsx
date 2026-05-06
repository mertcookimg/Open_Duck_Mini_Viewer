// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";

interface Props {
  onDelta: (d: number) => void;
  orientation?: "vertical" | "horizontal";
}

/**
 * Slim drag handle that sits between two flex children. Uses pointer
 * capture so the drag continues even if the cursor leaves the handle.
 * Tints with the duck-yellow accent on hover/active so users discover
 * it's interactive.
 */
export function Resizer({ onDelta, orientation = "vertical" }: Props) {
  const activeRef = useRef(false);
  const isHorizontal = orientation === "horizontal";

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    activeRef.current = true;
    document.body.style.cursor = isHorizontal ? "row-resize" : "col-resize";
    // Disable text selection during the drag so dragging through the
    // viewer or panel labels doesn't accidentally select content.
    document.body.style.userSelect = "none";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeRef.current) return;
    const delta = isHorizontal ? e.movementY : e.movementX;
    if (delta !== 0) onDelta(delta);
  };

  const release = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeRef.current) return;
    activeRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  return (
    <div
      role="separator"
      aria-orientation={isHorizontal ? "horizontal" : "vertical"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
      className={
        (isHorizontal ? "h-1 cursor-row-resize" : "w-1 cursor-col-resize") +
        " shrink-0 bg-slate-800 hover:bg-duck-500/50 active:bg-duck-500/70 rounded transition-colors"
      }
    />
  );
}
