// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";
import { sendCommand } from "../robot";
import { Joystick } from "./Joystick";

const MOTIONS = ["stand", "home", "bow", "wave", "headbang"] as const;

export function ControlPanel({ estopOn }: { estopOn: boolean }) {
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
      if (e.repeat) return;
      keys.current.add(e.key.toLowerCase());
      recompute();
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
      recompute();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const onMove = useCallback((x: number, y: number) => {
    setVel((v) => ({ ...v, vx: y, vy: x }));
  }, []);
  const onTurn = useCallback((x: number, _y: number) => {
    setVel((v) => ({ ...v, wz: x }));
  }, []);

  return (
    <div className="bg-slate-900 rounded-lg p-3 space-y-3">
      <div className="text-xs uppercase text-slate-400">Control</div>

      <div className="flex flex-wrap gap-4 justify-around">
        <Joystick label="MOVE (W/A/S/D)" onChange={onMove} />
        <Joystick label="TURN (Q/E)" onChange={onTurn} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MOTIONS.map((name) => (
          <button
            key={name}
            disabled={estopOn}
            onClick={() => void sendCommand({ kind: "motion", name })}
            className="py-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-sm capitalize"
          >
            {name}
          </button>
        ))}
      </div>

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
