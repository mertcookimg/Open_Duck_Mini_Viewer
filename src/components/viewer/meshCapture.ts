// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import type { MeshInfo } from "./types";

function isCadMesh(obj: THREE.Object3D): boolean {
  if (!(obj as { geometry?: unknown }).geometry) return false;
  if (!(obj as { material?: unknown }).material) return false;
  const parentType = (obj.parent as { type?: string } | null)?.type;
  if (parentType === "ArrowHelper" || parentType === "AxesHelper") return false;
  if (obj.type === "Line" || obj.type === "LineSegments") return false;
  return true;
}

function findLinkName(mesh: THREE.Object3D, robot: URDFRobot): string | null {
  let cur: THREE.Object3D | null = mesh.parent;
  while (cur) {
    const name = cur.name;
    if ((cur as { isURDFLink?: boolean }).isURDFLink && name) return name;
    if (name && robot.links?.[name] === cur) return name;
    if (cur === robot) {
      return robot.name || null;
    }
    cur = cur.parent;
  }
  return null;
}

export function captureNewMeshes(robot: URDFRobot, existing: MeshInfo[]): MeshInfo[] {
  const seen = new Set<THREE.Object3D>(existing.map((i) => i.mesh));
  const robotCenter = new THREE.Vector3();
  new THREE.Box3().setFromObject(robot).getCenter(robotCenter);
  const meshBox = new THREE.Box3();
  const meshCenter = new THREE.Vector3();
  const out: MeshInfo[] = [];

  robot.traverse((obj) => {
    if (!isCadMesh(obj)) return;
    if (seen.has(obj)) return;
    const mesh = obj as unknown as THREE.Mesh;

    meshBox.setFromObject(mesh);
    if (meshBox.isEmpty()) mesh.getWorldPosition(meshCenter);
    else meshBox.getCenter(meshCenter);

    const outward = meshCenter.clone().sub(robotCenter);
    if (outward.lengthSq() < 1e-10) outward.set(0, 1, 0);
    else outward.normalize();

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((mm) => mm.clone());
    } else if (mesh.material) {
      mesh.material = mesh.material.clone();
    }

    const m = (
      Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    ) as THREE.Material & {
      wireframe?: boolean;
      opacity?: number;
      color?: THREE.Color;
      vertexColors?: boolean;
    };
    out.push({
      mesh,
      linkName: findLinkName(mesh, robot),
      restPos: mesh.position.clone(),
      outwardWorld: outward,
      origMaterial: {
        opacity: m.opacity ?? 1,
        transparent: m.transparent ?? false,
        wireframe: m.wireframe ?? false,
        depthTest: m.depthTest ?? true,
        depthWrite: m.depthWrite ?? true,
        renderOrder: mesh.renderOrder,
        color: m.color ? m.color.clone() : null,
        vertexColors: m.vertexColors ?? false,
      },
    });
  });
  return out;
}
