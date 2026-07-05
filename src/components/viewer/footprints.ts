// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import * as THREE from "three";

const MAX_PRINTS = 48;
const FADE_S = 7;
const BASE_OPACITY = 0.45;
const RADIUS_M = 0.02;

interface Print {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  bornS: number;
}

/**
 * Fixed-size pool of fading floor decals marking where the duck's feet
 * struck. Prints live in world space (not the robot's odometry frame) so
 * they stay behind as the duck walks away.
 */
export class FootprintTrail {
  private group = new THREE.Group();
  // Slightly elongated along local x — after the YXZ rotation below, local x
  // points along the duck's heading, so prints read as directional steps.
  private geom = new THREE.CircleGeometry(RADIUS_M, 12);
  private prints: Print[] = [];
  private cursor = 0;

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
  }

  /** Stamp a print at scene-space (x, z), oriented to the given heading. */
  drop(x: number, z: number, yawRad: number, nowS: number): void {
    let p: Print;
    if (this.prints.length < MAX_PRINTS) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: BASE_OPACITY,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(this.geom, mat);
      mesh.rotation.order = "YXZ"; // yaw about world-up applied after the lay-flat tilt
      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.set(1.5, 1, 1);
      this.group.add(mesh);
      p = { mesh, mat, bornS: nowS };
      this.prints.push(p);
    } else {
      // Pool full — recycle the oldest print.
      p = this.prints[this.cursor];
      this.cursor = (this.cursor + 1) % MAX_PRINTS;
    }
    p.bornS = nowS;
    p.mesh.visible = true;
    // Hover a hair above the floor to dodge z-fighting with the grid.
    p.mesh.position.set(x, 0.002, z);
    p.mesh.rotation.y = yawRad;
    p.mat.opacity = BASE_OPACITY;
  }

  /** Advance fades; call once per render frame. */
  update(nowS: number): void {
    for (const p of this.prints) {
      if (!p.mesh.visible) continue;
      const age = nowS - p.bornS;
      if (age >= FADE_S) {
        p.mesh.visible = false;
        continue;
      }
      p.mat.opacity = BASE_OPACITY * (1 - age / FADE_S);
    }
  }

  dispose(): void {
    this.group.parent?.remove(this.group);
    this.geom.dispose();
    for (const p of this.prints) p.mat.dispose();
    this.prints = [];
  }
}
