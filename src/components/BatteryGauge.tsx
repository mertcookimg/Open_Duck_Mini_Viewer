// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import type { Battery, SystemStat } from "../types";

interface Props {
  battery?: Battery | null;
  system?: SystemStat | null;
}

export function BatteryGauge({ battery, system }: Props) {
  return (
    <div className="bg-slate-900 rounded-lg p-3 space-y-3">
      {battery ? <BatterySection battery={battery} /> : null}
      {system ? <SystemSection system={system} /> : null}
    </div>
  );
}

function BatterySection({ battery }: { battery: Battery }) {
  const pct = Math.max(0, Math.min(100, battery.percent));
  const colour = pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase text-slate-400">Battery</span>
        <span className="text-sm tabular-nums">
          {battery.voltage_v.toFixed(2)} V · {battery.current_a.toFixed(2)} A
        </span>
      </div>
      <div className="mt-2 h-3 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right text-xs tabular-nums mt-1">{pct.toFixed(0)}%</div>
    </div>
  );
}

function SystemSection({ system }: { system: SystemStat }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      <Stat label="CPU" value={system.cpu_percent} unit="%" />
      <Stat label="MEM" value={system.mem_percent} unit="%" />
      <Stat label="TEMP" value={system.temp_c} unit="°C" />
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
      <div className="tabular-nums">
        {value.toFixed(0)}
        <span className="text-slate-400">{unit}</span>
      </div>
    </div>
  );
}
