// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Fully client-side deployment. `base: "./"` makes the built bundle work no
// matter what subpath GitHub Pages serves it under (project pages live at
// `/<repo>/`, user pages at `/`). The robot model runs in-process; no proxy
// or backend.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
  },
});
