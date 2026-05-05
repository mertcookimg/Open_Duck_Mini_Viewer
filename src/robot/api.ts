// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import type { Command, JointConfig } from "../types";
import { robot } from "./Robot";
import { JOINTS } from "./joints";

export async function sendCommand(cmd: Command): Promise<void> {
  robot.applyCommand(cmd);
}

export async function fetchJointConfigs(): Promise<JointConfig[]> {
  return JOINTS.map((j) => ({
    name: j.name,
    min_deg: j.min_deg,
    max_deg: j.max_deg,
    zero_offset_deg: j.zero_offset_deg,
    in_urdf: j.in_urdf,
  }));
}
