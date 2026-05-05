// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import type { Battery, Command, Imu, JointState, RobotMode, SystemStat, Telemetry } from "../types";
import { HOME_POSE, JOINT_NAMES } from "./joints";
import { MOTIONS } from "./motions";

export class Robot {
  private t0 = performance.now() / 1000;
  private mode: RobotMode = "idle";
  private vx = 0;
  private vy = 0;
  private wz = 0;
  private estop = false;
  private batteryPct = 92;
  private motionName: string | null = null;
  private motionStart = 0;
  private lastOutput: Record<string, number> = Object.fromEntries(JOINT_NAMES.map((n) => [n, 0]));
  private motionBlendFrom: Record<string, number> = {};

  applyCommand(cmd: Command): void {
    if (cmd.kind === "estop") {
      this.estop = cmd.engage;
      if (cmd.engage) {
        this.mode = "estop";
        this.vx = this.vy = this.wz = 0;
        this.motionName = null;
      } else {
        this.mode = "idle";
      }
      return;
    }
    if (this.estop) return;

    if (cmd.kind === "velocity") {
      this.vx = cmd.vx;
      this.vy = cmd.vy;
      this.wz = cmd.wz;
      const moving = Math.abs(cmd.vx) + Math.abs(cmd.vy) + Math.abs(cmd.wz) > 0.05;
      this.mode = moving ? "walking" : "standing";
      this.motionName = null;
      return;
    }

    if (cmd.kind === "motion") {
      this.motionName = cmd.name;
      this.motionStart = performance.now() / 1000;
      this.motionBlendFrom = { ...this.lastOutput };
      this.mode = "standing";
      return;
    }
  }

  readTelemetry(): Telemetry {
    const now = performance.now() / 1000;
    const t = now - this.t0;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const walking = this.mode === "walking";
    const effort = Math.max(speed, Math.abs(this.wz));
    const gaitFreq = 1.0 + 1.5 * effort;
    const phase = 2 * Math.PI * gaitFreq * t;

    const motion = this.motionName && !walking ? MOTIONS[this.motionName] : undefined;
    let motionPose: Record<string, number> = {};
    let motionBlend = 0;
    if (motion) {
      const elapsed = now - this.motionStart;
      const blendIn = Math.max(motion.blend_in_s, 1e-3);
      motionBlend = Math.min(1, Math.max(0, elapsed / blendIn));
      motionPose = motion.sample(elapsed);
    }

    const joints: JointState[] = [];
    for (const name of JOINT_NAMES) {
      const gait = this.gaitAngle(name, phase, walking, t);
      let angle: number;
      if (motion) {
        const fromVal = this.motionBlendFrom[name] ?? gait;
        const target = motionPose[name] ?? 0;
        angle = fromVal * (1 - motionBlend) + target * motionBlend;
      } else {
        angle = gait;
      }
      this.lastOutput[name] = angle;
      joints.push({
        name,
        angle_deg: angle,
        target_deg: angle,
        temperature_c: 38 + (Math.random() - 0.5) * 0.8,
      });
    }

    const imu: Imu = {
      roll_deg: 2.0 * Math.sin(phase) * (walking ? 1 : 0) + (Math.random() - 0.5) * 0.4,
      pitch_deg: 1.5 * Math.cos(phase) * (walking ? 1 : 0) + (Math.random() - 0.5) * 0.4,
      yaw_deg: ((t * 30.0 * this.wz) % 360) - 180,
      accel_g: [
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        1.0 + (Math.random() - 0.5) * 0.04,
      ],
      gyro_dps: [
        walking ? 10 * Math.sin(phase) : (Math.random() - 0.5) * 1,
        walking ? 10 * Math.cos(phase) : (Math.random() - 0.5) * 1,
        30 * this.wz,
      ],
    };

    const drain = 0.05 + 0.15 * speed;
    this.batteryPct = Math.max(5, this.batteryPct - drain / 30);
    const battery: Battery = {
      voltage_v: 3.5 + 0.7 * (this.batteryPct / 100),
      percent: this.batteryPct,
      current_a: 0.4 + 0.6 * speed,
    };

    const system: SystemStat = {
      cpu_percent: 18 + 30 * speed + (Math.random() - 0.5) * 4,
      mem_percent: 42 + (Math.random() - 0.5) * 3,
      temp_c: 48 + 4 * speed + (Math.random() - 0.5) * 1,
    };

    const feet: [boolean, boolean] = walking
      ? [Math.sin(phase) <= 0, Math.sin(phase) > 0]
      : [true, true];

    return {
      t,
      mode: this.mode,
      joints,
      imu,
      battery,
      system,
      feet,
    };
  }

  // ---- internal -----------------------------------------------------------
  private gaitAngle(name: string, phase: number, walking: boolean, t: number): number {
    const home = HOME_POSE[name] ?? 0;
    const side = name.startsWith("right_") ? -1 : 1;

    if (!walking) {
      // Idle: just hold home, with a touch of antenna life.
      if (name.includes("antenna")) return home + side * 15 * Math.sin(2 * t);
      return home;
    }

    const sinP = Math.sin(phase);
    const vxAmp = this.vx * 25;
    const vyAmp = this.vy * 25;
    const wzAmp = this.wz * 25;
    // Step height / hip-roll baseline track the *total* effort so all three
    // axes (including pure rotation) lift the feet.
    const stepAmp = (Math.abs(this.vx) + Math.abs(this.vy) + Math.abs(this.wz)) * 25;

    if (name.endsWith("hip_pitch")) return home + side * vxAmp * sinP;
    if (name.endsWith("knee")) {
      // Knees only bend further from home — clamp the oscillation to ≥0 so
      // the leg never hyperextends past the standing posture.
      return home + Math.max(0, 1.4 * stepAmp * Math.sin(phase + (side * Math.PI) / 2));
    }
    if (name.endsWith("ankle")) return home + -0.5 * vxAmp * sinP;
    if (name.endsWith("hip_roll")) {
      // Lateral component: same direction for both feet (body sway). The
      // baseline `side * 0.2 * stepAmp` keeps the feet under the body
      // during stride.
      return home + side * 0.2 * stepAmp + vyAmp * sinP;
    }
    if (name.endsWith("hip_yaw")) return home + side * wzAmp * sinP;
    if (name.includes("antenna")) return home + side * 15 * Math.sin(2 * t);
    return home;
  }
}

/** Single shared robot instance. One owner of command + telemetry state. */
export const robot = new Robot();
