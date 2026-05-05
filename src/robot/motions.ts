// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { HOME_POSE } from "./joints";

export interface Keyframe {
  t: number; // seconds since motion start
  pose: Record<string, number>; // joint name → target angle (deg)
}

export interface Motion {
  name: string;
  keyframes: Keyframe[];
  loop: boolean;
  blend_in_s: number;
  duration: number;
  sample(t: number): Record<string, number>;
}

function makeMotion(opts: {
  name: string;
  keyframes: Keyframe[];
  loop?: boolean;
  blend_in_s?: number;
}): Motion {
  const { name, keyframes } = opts;
  const loop = opts.loop ?? false;
  const blend_in_s = opts.blend_in_s ?? 0.4;
  const duration = keyframes.length > 0 ? keyframes[keyframes.length - 1].t : 0;
  return {
    name,
    keyframes,
    loop,
    blend_in_s,
    duration,
    sample(t: number) {
      const kfs = keyframes;
      if (kfs.length === 0) return {};
      let tt = t;
      if (loop && duration > 0) tt = tt - Math.floor(tt / duration) * duration;
      if (tt <= kfs[0].t) return { ...kfs[0].pose };
      if (tt >= kfs[kfs.length - 1].t) return { ...kfs[kfs.length - 1].pose };
      for (let i = 0; i < kfs.length - 1; i++) {
        const a = kfs[i];
        const b = kfs[i + 1];
        if (a.t <= tt && tt <= b.t) {
          const seg = b.t - a.t;
          if (seg <= 0) return { ...a.pose };
          const u = (tt - a.t) / seg;
          const out: Record<string, number> = {};
          const names = new Set([...Object.keys(a.pose), ...Object.keys(b.pose)]);
          for (const n of names) {
            out[n] = (a.pose[n] ?? 0) * (1 - u) + (b.pose[n] ?? 0) * u;
          }
          return out;
        }
      }
      return { ...kfs[kfs.length - 1].pose };
    },
  };
}

// ---- Pose building blocks ------------------------------------------------

const _BOW: Record<string, number> = {
  ...HOME_POSE,
  neck_pitch: -10,
  head_pitch: -5,
};

const _STAND_STRAIGHT: Record<string, number> = {
  ...HOME_POSE,
  left_hip_pitch: 0,
  right_hip_pitch: 0,
  left_knee: 0,
  right_knee: 0,
  left_ankle: 0,
  right_ankle: 0,
};

const _BANG_DOWN: Record<string, number> = {
  ...HOME_POSE,
  neck_pitch: -18,
  head_pitch: -35,
};
const _BANG_UP: Record<string, number> = {
  ...HOME_POSE,
  neck_pitch: 10,
  head_pitch: 20,
};

const _WAVE_A: Record<string, number> = {
  ...HOME_POSE,
  head_yaw: 30,
  left_antenna: 60,
  right_antenna: -60,
};
const _WAVE_B: Record<string, number> = {
  ...HOME_POSE,
  head_yaw: -30,
  left_antenna: -60,
  right_antenna: 60,
};

export const MOTIONS: Record<string, Motion> = {
  home: makeMotion({
    name: "home",
    keyframes: [{ t: 0, pose: HOME_POSE }],
    blend_in_s: 1.5,
  }),
  stand: makeMotion({
    name: "stand",
    keyframes: [{ t: 0, pose: _STAND_STRAIGHT }],
    blend_in_s: 1.0,
  }),
  bow: makeMotion({
    name: "bow",
    keyframes: [
      { t: 0, pose: HOME_POSE },
      { t: 0.5, pose: _BOW },
      { t: 1.2, pose: _BOW },
      { t: 1.8, pose: HOME_POSE },
    ],
    blend_in_s: 0.3,
  }),
  headbang: makeMotion({
    name: "headbang",
    keyframes: [
      { t: 0, pose: _BANG_UP },
      { t: 0.2, pose: _BANG_DOWN },
      { t: 0.4, pose: _BANG_UP },
    ],
    loop: true,
    blend_in_s: 0.3,
  }),
  wave: makeMotion({
    name: "wave",
    keyframes: [
      { t: 0, pose: HOME_POSE },
      { t: 0.25, pose: _WAVE_A },
      { t: 0.5, pose: _WAVE_B },
      { t: 0.75, pose: _WAVE_A },
      { t: 1, pose: _WAVE_B },
      { t: 1.5, pose: HOME_POSE },
    ],
    blend_in_s: 0.25,
  }),
};
