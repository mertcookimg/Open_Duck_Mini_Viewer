// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

export type RobotMode = "idle" | "standing" | "walking" | "error" | "estop";

export interface JointState {
  name: string;
  angle_deg: number;
  target_deg?: number | null;
  temperature_c?: number | null;
}

export interface Imu {
  roll_deg: number;
  pitch_deg: number;
  yaw_deg: number;
  accel_g: [number, number, number];
  gyro_dps: [number, number, number];
}

export interface Battery {
  voltage_v: number;
  percent: number;
  current_a: number;
}

export interface SystemStat {
  cpu_percent: number;
  mem_percent: number;
  temp_c: number;
}

export interface Telemetry {
  t: number;
  mode: RobotMode;
  joints: JointState[];
  imu: Imu;
  battery?: Battery | null;
  system?: SystemStat | null;
  feet?: [boolean, boolean] | null;
  /** Name of the motion currently driving the pose, if any. */
  motion?: string | null;
}

export interface JointConfig {
  name: string;
  min_deg: number;
  max_deg: number;
  zero_offset_deg: number;
  in_urdf: boolean;
}

export type Command =
  | { kind: "velocity"; vx: number; vy: number; wz: number }
  | { kind: "motion"; name: "stand" | "home" | "bow" | "wave" | "headbang" | "dance" }
  // Gaze target in the robot's frame; null releases the gaze and lets the
  // gait / motion drive the head again.
  | { kind: "look"; target: { yaw_deg: number; pitch_deg: number } | null }
  | { kind: "estop"; engage: boolean };
