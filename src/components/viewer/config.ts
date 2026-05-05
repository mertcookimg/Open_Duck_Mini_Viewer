// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

export const URDF_URL = "/assets/open_duck_mini_v2/robot.urdf";
export const PACKAGE_BASE = "/assets/open_duck_mini_v2";

export const D2R = Math.PI / 180;

/** Metres of outward displacement at explode factor = 1. Tuned for the duck. */
export const EXPLODE_SCALE = 0.18;

/** Render-order bumps used to push helper geometry on top of the duck mesh. */
export const RENDER_ORDER_HELPER = 999;
export const RENDER_ORDER_XRAY = 998;
