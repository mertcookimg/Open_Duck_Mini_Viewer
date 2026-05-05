// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

export interface JointDef {
  name: string;
  min_deg: number;
  max_deg: number;
  zero_offset_deg: number;
  in_urdf: boolean;
}

const def = (name: string, min_deg: number, max_deg: number, in_urdf = true): JointDef => ({
  name,
  min_deg,
  max_deg,
  zero_offset_deg: 0,
  in_urdf,
});

export const JOINTS: readonly JointDef[] = [
  def("left_hip_yaw", -30, 30),
  def("left_hip_roll", -25, 25),
  def("left_hip_pitch", -70, 30),
  def("left_knee", -90, 90),
  def("left_ankle", -90, 90),
  def("right_hip_yaw", -30, 30),
  def("right_hip_roll", -25, 25),
  def("right_hip_pitch", -30, 70),
  def("right_knee", -90, 90),
  def("right_ankle", -90, 90),
  def("neck_pitch", -20, 65, false),
  def("head_pitch", -45, 45, false),
  def("head_yaw", -160, 160, false),
  def("head_roll", -30, 30, false),
  def("left_antenna", -90, 90, false),
  def("right_antenna", -90, 90, false),
];

export const JOINT_NAMES: readonly string[] = JOINTS.map((j) => j.name);
export const JOINTS_BY_NAME: Record<string, JointDef> = Object.fromEntries(
  JOINTS.map((j) => [j.name, j]),
);

// Upstream-canonical home pose (degrees; rad source noted in comments).
export const HOME_POSE: Record<string, number> = {
  left_hip_yaw: 0.11, //  0.002 rad
  left_hip_roll: 3.04, //  0.053 rad
  left_hip_pitch: -36.09, // -0.630 rad
  left_knee: 78.38, //  1.368 rad
  left_ankle: -44.92, // -0.784 rad
  right_hip_yaw: -0.17, // -0.003 rad
  right_hip_roll: -3.72, // -0.065 rad
  right_hip_pitch: 36.38, //  0.635 rad
  right_knee: 79.01, //  1.379 rad
  right_ankle: -45.61, // -0.796 rad
  neck_pitch: 0.0,
  head_pitch: 0.0,
  head_yaw: 0.0,
  head_roll: 0.0,
  left_antenna: 0.0,
  right_antenna: 0.0,
};
