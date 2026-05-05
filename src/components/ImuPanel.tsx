// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import type { Imu } from "../types";

interface Props {
  imu: Imu;
  feet?: [boolean, boolean] | null;
}

export function ImuPanel({ imu, feet }: Props) {
  return (
    <div className="bg-slate-900 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase text-slate-400">IMU</div>
        {feet && <FeetContacts feet={feet} />}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Reading label="Roll" value={imu.roll_deg} unit="°" />
        <Reading label="Pitch" value={imu.pitch_deg} unit="°" />
        <Reading label="Yaw" value={imu.yaw_deg} unit="°" />
      </div>
      <div className="mt-3 text-[10px] text-slate-500 grid grid-cols-2 gap-2">
        <div>accel g: [{imu.accel_g.map((v) => v.toFixed(2)).join(", ")}]</div>
        <div>gyro °/s: [{imu.gyro_dps.map((v) => v.toFixed(1)).join(", ")}]</div>
      </div>
      <AttitudeIndicator roll={imu.roll_deg} pitch={imu.pitch_deg} />
    </div>
  );
}

function Reading({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className="text-lg tabular-nums">
        {value.toFixed(1)}
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
    </div>
  );
}

function FeetContacts({ feet }: { feet: [boolean, boolean] }) {
  const dot = (on: boolean) => `w-2 h-2 rounded-full ${on ? "bg-emerald-400" : "bg-slate-700"}`;
  return (
    <div className="flex items-center gap-1.5 text-[10px] uppercase text-slate-500">
      <span>L</span>
      <span className={dot(feet[0])} />
      <span className={dot(feet[1])} />
      <span>R</span>
    </div>
  );
}

function AttitudeIndicator({ roll, pitch }: { roll: number; pitch: number }) {
  const size = 80;
  const horizonY = (pitch / 45) * (size / 2);
  return (
    <div className="mt-3 flex justify-center">
      <div
        className="relative rounded-full overflow-hidden border border-slate-700"
        style={{ width: size, height: size }}
      >
        <div className="absolute inset-0" style={{ transform: `rotate(${-roll}deg)` }}>
          <div
            className="absolute left-0 right-0 bg-sky-700"
            style={{ top: 0, bottom: `${50 - (horizonY / size) * 100}%` }}
          />
          <div
            className="absolute left-0 right-0 bg-amber-800"
            style={{ top: `${50 - (horizonY / size) * 100}%`, bottom: 0 }}
          />
          <div
            className="absolute left-0 right-0 h-px bg-white/70"
            style={{ top: `${50 - (horizonY / size) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
