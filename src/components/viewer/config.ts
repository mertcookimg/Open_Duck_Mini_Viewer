// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

// Vite injects `import.meta.env.BASE_URL` from `vite.config.ts`'s `base`.
// Locally it's `/`, on GitHub Pages project sites it's `./` (resolves under
// `/<repo>/`). Always has a trailing slash, so concatenate without one.
export const URDF_URL = `${import.meta.env.BASE_URL}assets/open_duck_mini_v2/robot.urdf`;
export const PACKAGE_BASE = `${import.meta.env.BASE_URL}assets/open_duck_mini_v2`;

export const D2R = Math.PI / 180;

/** Metres of outward displacement at explode factor = 1. Tuned for the duck. */
export const EXPLODE_SCALE = 0.18;

/** Render-order bumps used to push helper geometry on top of the duck mesh. */
export const RENDER_ORDER_HELPER = 999;
export const RENDER_ORDER_XRAY = 998;
