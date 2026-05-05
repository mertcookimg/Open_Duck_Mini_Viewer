// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import type * as THREE from "three";

export type InspectMode = "solid" | "transparent" | "wireframe" | "xray";

export interface AxesState {
  world: boolean;
  body: boolean;
  joint: boolean;
}

export interface MeshInfo {
  mesh: THREE.Mesh;
  linkName: string | null;

  restPos: THREE.Vector3;

  outwardWorld: THREE.Vector3;
  origMaterial: {
    opacity: number;
    transparent: boolean;
    wireframe: boolean;
    depthTest: boolean;
    depthWrite: boolean;
    renderOrder: number;
    color: THREE.Color | null;
    vertexColors: boolean;
  };
}
