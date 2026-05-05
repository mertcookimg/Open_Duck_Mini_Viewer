// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import type * as THREE from "three";
import type { InspectMode, MeshInfo } from "./types";
import { RENDER_ORDER_XRAY } from "./config";

export function applyMaterialMode(infos: MeshInfo[], mode: InspectMode): void {
  for (const info of infos) {
    const orig = info.origMaterial;
    const mats = Array.isArray(info.mesh.material) ? info.mesh.material : [info.mesh.material];
    for (const raw of mats) {
      const mat = raw as THREE.Material & {
        wireframe?: boolean;
        opacity?: number;
      };
      switch (mode) {
        case "solid":
          mat.opacity = orig.opacity;
          mat.transparent = orig.transparent;
          mat.wireframe = false;
          mat.depthTest = orig.depthTest;
          mat.depthWrite = orig.depthWrite;
          break;
        case "transparent":
          mat.opacity = 0.3;
          mat.transparent = true;
          mat.wireframe = false;
          mat.depthTest = orig.depthTest;
          mat.depthWrite = false;
          break;
        case "wireframe":
          mat.opacity = orig.opacity;
          mat.transparent = orig.transparent;
          mat.wireframe = true;
          mat.depthTest = orig.depthTest;
          mat.depthWrite = orig.depthWrite;
          break;
        case "xray":
          mat.opacity = 0.4;
          mat.transparent = true;
          mat.wireframe = false;
          mat.depthTest = false;
          mat.depthWrite = false;
          break;
      }
      mat.needsUpdate = true;
    }
    info.mesh.renderOrder = mode === "xray" ? RENDER_ORDER_XRAY : orig.renderOrder;
  }
}
