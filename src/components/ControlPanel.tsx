// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { sendCommand } from "../robot";
import type { Velocity } from "../hooks/useVelocityControl";
import { Joystick } from "./Joystick";

const MOTIONS = ["stand", "home", "bow", "wave", "headbang", "dance"] as const;

export function ControlPanel({
  estopOn,
  activeMotion,
  vel,
  onMove,
  onTurn,
}: {
  estopOn: boolean;
  activeMotion?: string | null;
  /** Current commanded velocity (keyboard or joystick) — owned by useVelocityControl. */
  vel: Velocity;
  onMove: (x: number, y: number) => void;
  onTurn: (x: number, y: number) => void;
}) {
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
