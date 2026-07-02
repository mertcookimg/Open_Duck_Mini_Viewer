// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";
import { sendCommand } from "../robot";
import { Joystick } from "./Joystick";

const MOTIONS = ["stand", "home", "bow", "wave", "headbang", "dance"] as const;

// True when the key event originated in a text-entry element — WASD typed
// into the paint hex field (or any future input) must not drive the robot.
function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return (
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" ||
    t.isContentEditable
  );
}

export function ControlPanel({
  estopOn,
  activeMotion,
}: {
  estopOn: boolean;
  activeMotion?: string | null;
}) {
  const [vel, setVel] = useState({ vx: 0, vy: 0, wz: 0 });
  const lastSent = useRef({ vx: 0, vy: 0, wz: 0 });
  const sendTimer = useRef<number | null>(null);
  const keys = useRef(new Set<string>());

  useEffect(() => {
    if (sendTimer.current) return;
    sendTimer.current = window.setInterval(() => {
      const cur = lastSent.current;
      if (cur.vx === vel.vx && cur.vy === vel.vy && cur.wz === vel.wz) return;
      lastSent.current = vel;
      void sendCommand({ kind: "velocity", ...vel });
    }, 50);
    return () => {
      if (sendTimer.current) clearInterval(sendTimer.current);
      sendTimer.current = null;
    };
  }, [vel]);

  useEffect(() => {
    const recompute = () => {
      const k = keys.current;
      const vx = (k.has("w") ? 1 : 0) + (k.has("s") ? -1 : 0);
      const vy = (k.has("a") ? -1 : 0) + (k.has("d") ? 1 : 0);
      const wz = (k.has("q") ? -1 : 0) + (k.has("e") ? 1 : 0);
      setVel({ vx, vy, wz });
    };
    const down = (e: KeyboardEvent) => {
      if (e.repeat || isTypingTarget(e)) return;
      keys.current.add(e.key.toLowerCase());
      recompute();
    };
    // keyup is never filtered: if focus moved into an input mid-press, the
    // release must still be seen or the robot walks forever.
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
      recompute();
    };
    // Alt-tab away swallows the keyup — treat losing focus as all-keys-up.
    const releaseAll = () => {
      if (keys.current.size === 0) return;
      keys.current.clear();
      recompute();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", releaseAll);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", releaseAll);
    };
  }, []);

  const onMove = useCallback((x: number, y: number) => {
    setVel((v) => ({ ...v, vx: y, vy: x }));
  }, []);
  const onTurn = useCallback((x: number, _y: number) => {
    setVel((v) => ({ ...v, wz: x }));
  }, []);

  const motionBtn = "py-2 rounded text-sm capitalize disabled:opacity-40 ";
  return (
    <div className="bg-slate-900 rounded-lg p-3 space-y-3">
      <div className="text-xs uppercase text-slate-400">Control</div>

      <div className="flex flex-wrap gap-4 justify-around">
        <Joystick
          label="MOVE (W/A/S/D)"
          onChange={onMove}
          value={{ x: vel.vy, y: vel.vx }}
          disabled={estopOn}
        />
        <Joystick
          label="TURN (Q/E)"
          onChange={onTurn}
          value={{ x: vel.wz, y: 0 }}
          disabled={estopOn}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MOTIONS.map((name) => (
          <button
            key={name}
            disabled={estopOn}
            onClick={() => void sendCommand({ kind: "motion", name })}
            className={
              motionBtn +
              (activeMotion === name && !estopOn
                ? "bg-duck-600 hover:bg-duck-500 text-white"
                : "bg-slate-800 hover:bg-slate-700")
            }
          >
            {name}
          </button>
        ))}
      </div>

      {estopOn && (
        <div className="text-[11px] text-amber-400/90 text-center">
          E-stop engaged — movement and motions are ignored until released.
        </div>
      )}

      <button
        onClick={() => void sendCommand({ kind: "estop", engage: !estopOn })}
        className={`w-full py-3 rounded font-bold tracking-wide ${
          estopOn
            ? "bg-amber-500 hover:bg-amber-400 text-slate-900"
            : "bg-rose-600 hover:bg-rose-500"
        }`}
      >
        {estopOn ? "RELEASE E-STOP" : "EMERGENCY STOP"}
      </button>
    </div>
  );
}
