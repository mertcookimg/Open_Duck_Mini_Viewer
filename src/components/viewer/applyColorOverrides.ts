// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import type * as THREE from "three";
import type { MeshInfo } from "./types";

type ColorOverrides = Record<string, string>;

type ColorMaterial = THREE.Material & {
  color?: THREE.Color;
  vertexColors?: boolean;
};

function eachMaterial(mesh: THREE.Mesh, fn: (mat: ColorMaterial) => void) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const raw of mats) fn(raw as ColorMaterial);
}

/**
 * Applies the active color overrides to every captured mesh. Idempotent —
 * safe to call after material-mode changes, after new meshes stream in, or
 * whenever overrides change. Does NOT touch the selection highlight; that
 * lives as a separate edge-outline overlay so the picked colour stays
 * visible while the user adjusts it.
 */
export function applyColorOverrides(infos: MeshInfo[], overrides: ColorOverrides): void {
  for (const info of infos) {
    const link = info.linkName;
    const override = link ? overrides[link] : undefined;

    eachMaterial(info.mesh, (mat) => {
      if (!mat.color) return;
      if (override) {
        mat.color.set(override);
        // Vertex-colored STLs would otherwise modulate our chosen color
        // toward the baked-in vertex tint; disable while an override is
        // active and restore on reset.
        if (mat.vertexColors) mat.vertexColors = false;
      } else {
        if (info.origMaterial.color) mat.color.copy(info.origMaterial.color);
        if (mat.vertexColors !== info.origMaterial.vertexColors) {
          mat.vertexColors = info.origMaterial.vertexColors;
        }
      }
      mat.needsUpdate = true;
    });
  }
}
