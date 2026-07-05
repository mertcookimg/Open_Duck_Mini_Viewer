// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import URDFLoader, { URDFRobot } from "urdf-loader";
import type { JointState, Imu, Odom } from "../../types";
import { D2R, EXPLODE_SCALE, PACKAGE_BASE, RENDER_ORDER_HELPER, URDF_URL } from "./config";
import type { AxesState, InspectMode, MeshInfo } from "./types";
import { applyMaterialMode } from "./applyMaterialMode";
import { applyColorOverrides } from "./applyColorOverrides";
import { captureNewMeshes } from "./meshCapture";
import { FootprintTrail } from "./footprints";
import { AxesPanel } from "./AxesPanel";
import { InspectPanel } from "./InspectPanel";
import { ViewControls } from "./ViewControls";

interface Props {
  joints: JointState[];
  imu: Imu | undefined;
  /** Walked-to body pose — moves the whole robot across the grid. */
  odom?: Odom | null;
  /** Foot-contact flags; rising edges stamp footprints while driving. */
  feet?: [boolean, boolean] | null;
  colorOverrides?: Record<string, string>;
  onLinkNames?: (names: string[]) => void;
  onLinkDefaults?: (defaults: Record<string, string>) => void;
  paintMode?: boolean;
  selectedLink?: string | null;
  onSelectLink?: (name: string | null) => void;
  /** Gaze-follow: while true, pointer moves report a head look target. */
  lookMode?: boolean;
  onLook?: (target: { yaw_deg: number; pitch_deg: number }) => void;
}

interface ViewApi {
  rotate: (azimuthDeg: number, elevationDeg: number) => void;
  zoom: (factor: number) => void;
  reset: () => void;
  view: (preset: "front" | "side" | "top" | "iso") => void;
}

interface HeadRig {
  link: THREE.Object3D;
  restQuat: THREE.Quaternion;
}

export function DuckViewer({
  joints,
  imu,
  odom,
  feet,
  colorOverrides,
  onLinkNames,
  onLinkDefaults,
  paintMode = false,
  selectedLink = null,
  onSelectLink,
  lookMode = false,
  onLook,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<URDFRobot | null>(null);
  const headRigRef = useRef<HeadRig | null>(null);
  const useSyntheticHeadRigRef = useRef(false);
  const tiltGroupRef = useRef<THREE.Group | null>(null);
  const latestRef = useRef<Props>({ joints, imu });
  const apiRef = useRef<ViewApi | null>(null);
  const worldAxesRef = useRef<THREE.Object3D | null>(null);
  const bodyAxesRef = useRef<THREE.Object3D | null>(null);
  const jointAxisArrowsRef = useRef<THREE.Object3D[]>([]);
  const meshInfosRef = useRef<MeshInfo[]>([]);
  const explodeRef = useRef(0);
  const lockPoseRef = useRef(true);
  const animateRef = useRef(false);
  const animateStartRef = useRef(0);
  const viewModeRef = useRef<InspectMode>("solid");
  const colorOverridesRef = useRef<Record<string, string>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [axes, setAxes] = useState<AxesState>({ world: false, body: false, joint: false });
  const [explode, setExplode] = useState(0);
  const [viewMode, setViewMode] = useState<InspectMode>("solid");
  const [lockPose, setLockPose] = useState(true);
  const [animate, setAnimate] = useState(false);
  const knownLinkNamesRef = useRef<string[]>([]);
  const onLinkNamesRef = useRef(onLinkNames);
  const onLinkDefaultsRef = useRef(onLinkDefaults);
  const paintModeRef = useRef(paintMode);
  const selectedLinkRef = useRef<string | null>(selectedLink);
  const hoverLinkRef = useRef<string | null>(null);
  const onSelectLinkRef = useRef(onSelectLink);
  const lookModeRef = useRef(lookMode);
  const onLookRef = useRef(onLook);
  const outlinesByLinkRef = useRef<Map<string, THREE.LineSegments[]>>(new Map());
  const refreshOutlinesRef = useRef<() => void>(() => {});
  const rendererDomRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    onLinkNamesRef.current = onLinkNames;
  }, [onLinkNames]);
  useEffect(() => {
    onLinkDefaultsRef.current = onLinkDefaults;
  }, [onLinkDefaults]);
  useEffect(() => {
    onSelectLinkRef.current = onSelectLink;
  }, [onSelectLink]);
  useEffect(() => {
    lookModeRef.current = lookMode;
  }, [lookMode]);
  useEffect(() => {
    onLookRef.current = onLook;
  }, [onLook]);

  useEffect(() => {
    latestRef.current = { joints, imu, odom, feet };
  }, [joints, imu, odom, feet]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ---- scene / camera / renderer ----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1220);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);
    camera.position.set(1, 0.7, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.outline = "none";
    rendererDomRef.current = renderer.domElement;

    // Damping OFF: programmatic camera moves apply instantly without
    // OrbitControls smoothing the change away.
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.target.set(0, 0.1, 0);
    controls.update();

    // ---- lights / grid ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(3, 6, 4);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xfde68a, 0.25);
    fill.position.set(-3, 2, -2);
    scene.add(fill);
    // 4 m grid — the odometry arena (±1.8 m clamp in Robot.ts) fits inside.
    scene.add(new THREE.GridHelper(4, 40, 0x334155, 0x1e293b));

    // odomGroup carries the walked-to position/heading; tiltGroup gets IMU;
    // zUp converts URDF Z-up into our Y-up scene.
    const odomGroup = new THREE.Group();
    const tiltGroup = new THREE.Group();
    const zUp = new THREE.Group();
    zUp.rotation.x = -Math.PI / 2;
    tiltGroup.add(zUp);
    odomGroup.add(tiltGroup);
    scene.add(odomGroup);
    tiltGroupRef.current = tiltGroup;

    // Footprint decals live in world space so they stay put as the duck walks.
    const footTrail = new FootprintTrail(scene);

    // World axes anchor outside tiltGroup so they stay aligned with the grid
    // even when the IMU pitches/rolls the robot frame.
    const worldZUp = new THREE.Group();
    worldZUp.rotation.x = -Math.PI / 2;
    const worldAxes = new THREE.AxesHelper(0.25);
    (worldAxes.material as THREE.Material).depthTest = false;
    worldAxes.renderOrder = RENDER_ORDER_HELPER;
    worldAxes.visible = false;
    worldZUp.add(worldAxes);
    scene.add(worldZUp);
    worldAxesRef.current = worldAxes;

    // ---- imperative view API (used by keyboard + buttons + initial fit) ----
    const api: ViewApi = {
      rotate(azimDeg, elevDeg) {
        const offset = camera.position.clone().sub(controls.target);
        const sph = new THREE.Spherical().setFromVector3(offset);
        sph.theta -= azimDeg * D2R;
        sph.phi -= elevDeg * D2R;
        sph.phi = Math.max(0.05, Math.min(Math.PI - 0.05, sph.phi));
        offset.setFromSpherical(sph);
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
      zoom(factor) {
        const offset = camera.position.clone().sub(controls.target);
        offset.multiplyScalar(factor);
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
      reset() {
        controls.reset();
      },
      view(preset) {
        const dist = camera.position.distanceTo(controls.target);
        const c = controls.target;
        const positions: Record<typeof preset, [number, number, number]> = {
          front: [c.x, c.y, c.z + dist],
          side: [c.x + dist, c.y, c.z],
          top: [c.x, c.y + dist, c.z + dist * 0.001],
          iso: [c.x + dist * 0.7, c.y + dist * 0.5, c.z + dist * 0.7],
        };
        const [x, y, z] = positions[preset];
        camera.position.set(x, y, z);
        controls.update();
      },
    };
    apiRef.current = api;

    // ---- URDF loading ----
    // Mobile browsers settle the layout (address bar collapse, safe-area
    // insets, orientation flip) AFTER the URDF has loaded, so a one-shot
    // fit on load can run against a stale canvas size and end up
    // zoomed-in. Keep re-fitting on every layout change UNTIL the user
    // grabs the camera; once they orbit / zoom, lock in their view.
    let droppedToFloor = false;
    let userHasInteracted = false;
    controls.addEventListener("start", () => {
      userHasInteracted = true;
    });

    const fitToRobot = () => {
      const robot = robotRef.current;
      if (!robot) return;

      const robotBox = new THREE.Box3().setFromObject(robot);
      if (!isFinite(robotBox.min.z) || robotBox.isEmpty()) return; // try again later

      // Wait for a non-zero canvas. On mobile the mount can briefly be
      // 0×0 while React/Vite are settling layout — fitting against that
      // produces NaN aspect / zero distance.
      const cw = mount.clientWidth;
      const ch = mount.clientHeight;
      if (cw <= 0 || ch <= 0) return;

      // One-shot floor drop — only the first successful fit moves the
      // robot; subsequent re-fits just retarget the camera.
      if (!droppedToFloor) {
        robot.position.z -= robotBox.min.z;
        droppedToFloor = true;
      }

      const worldBox = new THREE.Box3().setFromObject(tiltGroup);
      const size = worldBox.getSize(new THREE.Vector3());
      const center = worldBox.getCenter(new THREE.Vector3());
      // Fit the robot in BOTH axes by picking the smaller of the
      // vertical / horizontal FOV. Using only the vertical FOV (the
      // previous behaviour) makes the robot spill horizontally and
      // appear "zoomed in" on narrow windows. Multiply by FRAMING so
      // the robot has comfortable breathing room rather than filling
      // edge-to-edge.
      const radius = Math.max(size.x, size.y, size.z, 0.05);
      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const fitFov = Math.min(vFov, hFov);
      const FRAMING = 1.2;
      const distance = (radius / Math.sin(fitFov / 2)) * FRAMING;

      const dir = new THREE.Vector3(0.7, 0.4, 0.7).normalize();
      controls.target.copy(center);
      camera.position.copy(center).addScaledVector(dir, distance);
      camera.near = Math.max(0.001, distance / 200);
      camera.far = distance * 200;
      camera.updateProjectionMatrix();
      controls.update();
      controls.saveState(); // .reset() returns to the most recent fit

      setStatus((prev) => (prev === "ready" ? prev : "ready"));
    };

    // Re-fit on layout changes until the user interacts. Used by the
    // ResizeObserver below.
    const refitIfStillAuto = () => {
      if (!userHasInteracted) fitToRobot();
    };

    const manager = new THREE.LoadingManager();
    // onLoad set BEFORE loader.load so we never miss the completion event
    // (set-after-the-fact is a known footgun with LoadingManager).
    manager.onLoad = fitToRobot;

    const loader = new URDFLoader(manager);
    loader.packages = PACKAGE_BASE;
    loader.load(
      URDF_URL,
      (robot) => {
        zUp.add(robot);
        robotRef.current = robot;

        // Body axes (toggled by AxesPanel).
        const bodyAxes = new THREE.AxesHelper(0.12);
        (bodyAxes.material as THREE.Material).depthTest = false;
        bodyAxes.renderOrder = RENDER_ORDER_HELPER;
        bodyAxes.visible = false;
        robot.add(bodyAxes);
        bodyAxesRef.current = bodyAxes;

        // Per-joint axis arrows. Rotation around an axis leaves the axis
        // invariant, so parenting the arrow to the joint (rather than its
        // parent link) is fine — the visible direction does not change as the
        // joint rotates.
        const jointArrows: THREE.Object3D[] = [];
        for (const name of Object.keys(robot.joints)) {
          const joint = robot.joints[name];
          const type = (joint as { jointType?: string }).jointType;
          if (type !== "revolute" && type !== "continuous") continue;
          const axis = (joint as { axis?: THREE.Vector3 }).axis;
          if (!axis) continue;
          const arrow = new THREE.ArrowHelper(
            axis.clone().normalize(),
            new THREE.Vector3(),
            0.05,
            0xfbbf24,
            0.018,
            0.014,
          );
          (arrow.line.material as THREE.Material).depthTest = false;
          (arrow.cone.material as THREE.Material).depthTest = false;
          arrow.renderOrder = RENDER_ORDER_HELPER;
          arrow.visible = false;
          joint.add(arrow);
          jointArrows.push(arrow);
        }
        jointAxisArrowsRef.current = jointArrows;

        // Synthetic head rig — composes the 4 MJCF head joints when the URDF
        // doesn't expose them as revolute.
        const hasNativeHeadJoints =
          !!robot.joints?.neck_pitch &&
          !!robot.joints?.head_pitch &&
          !!robot.joints?.head_yaw &&
          !!robot.joints?.head_roll;
        useSyntheticHeadRigRef.current = !hasNativeHeadJoints;
        if (useSyntheticHeadRigRef.current) {
          const neckLink = robot.links?.["neck_pitch_assembly"];
          if (neckLink) {
            headRigRef.current = {
              link: neckLink,
              restQuat: neckLink.quaternion.clone(),
            };
          } else {
            console.warn("neck_pitch_assembly link not found; head will be static");
          }
        }
        fitToRobot();
      },
      undefined,
      (err) => {
        console.error("URDF load failed", err);
        setStatus("missing");
      },
    );

    // ---- keyboard shortcuts ----
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const step = e.shiftKey ? 15 : 5;
      switch (e.key) {
        case "ArrowLeft":
          api.rotate(-step, 0);
          e.preventDefault();
          break;
        case "ArrowRight":
          api.rotate(step, 0);
          e.preventDefault();
          break;
        case "ArrowUp":
          api.rotate(0, -step);
          e.preventDefault();
          break;
        case "ArrowDown":
          api.rotate(0, step);
          e.preventDefault();
          break;
        case "+":
        case "=":
          api.zoom(0.9);
          break;
        case "-":
        case "_":
          api.zoom(1.1);
          break;
        case "0":
        case "Home":
          api.reset();
          break;
        case "1":
          api.view("front");
          break;
        case "3":
          api.view("side");
          break;
        case "5":
          api.view("iso");
          break;
        case "7":
          api.view("top");
          break;
      }
    };
    window.addEventListener("keydown", onKey);

    // ---- paint mode: edge-outline highlight + click-to-pick + hover preview ----
    // Outlines render on top (depthTest=false) so they stay visible even
    // through occluding geometry. Each outline gets its own material clone
    // so we can drive selected vs hover with independent colour/opacity.
    // Both states use white at different opacities — a chromatic outline
    // would clash with whatever paint colour the user is editing.
    const SELECTED_OPACITY = 0.35;
    const HOVER_OPACITY = 0.15;

    const refreshOutlineVisibility = () => {
      const sel = paintModeRef.current ? selectedLinkRef.current : null;
      const hov = paintModeRef.current ? hoverLinkRef.current : null;
      for (const [link, lines] of outlinesByLinkRef.current.entries()) {
        const isSel = link === sel;
        const isHov = !isSel && link === hov;
        const visible = isSel || isHov;
        for (const l of lines) {
          l.visible = visible;
          if (visible) {
            const mat = l.material as THREE.LineBasicMaterial;
            mat.opacity = isSel ? SELECTED_OPACITY : HOVER_OPACITY;
            mat.needsUpdate = true;
          }
        }
      }
    };
    refreshOutlinesRef.current = refreshOutlineVisibility;

    const ndc = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    // Fat-ray picking. Thin geometry (the legs especially) is hard to hit
    // dead-centre; if the centre ray misses we sample a small ring of
    // neighbour offsets and take the closest hit. The centre-first
    // fast-path means common clicks pay no extra cost.
    const NEIGHBOR_OFFSETS_PX: ReadonlyArray<readonly [number, number]> = [
      [-4, 0],
      [4, 0],
      [0, -4],
      [0, 4],
      [-4, -4],
      [4, -4],
      [-4, 4],
      [4, 4],
    ];
    const pickLinkAt = (clientX: number, clientY: number): string | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      const meshes = meshInfosRef.current.map((i) => i.mesh);
      const intersectAt = (px: number, py: number) => {
        ndc.set(((px - rect.left) / rect.width) * 2 - 1, -((py - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        return raycaster.intersectObjects(meshes, false);
      };
      const linkOfMesh = (mesh: THREE.Object3D) =>
        meshInfosRef.current.find((i) => i.mesh === mesh)?.linkName ?? null;

      const centre = intersectAt(clientX, clientY);
      if (centre.length > 0) return linkOfMesh(centre[0].object);

      let best: { dist: number; mesh: THREE.Object3D } | null = null;
      for (const [dx, dy] of NEIGHBOR_OFFSETS_PX) {
        const hits = intersectAt(clientX + dx, clientY + dy);
        if (hits.length === 0) continue;
        if (!best || hits[0].distance < best.dist) {
          best = { dist: hits[0].distance, mesh: hits[0].object };
        }
      }
      return best ? linkOfMesh(best.mesh) : null;
    };

    const downPos = { x: 0, y: 0, t: 0, valid: false };
    const onPointerDown = (e: PointerEvent) => {
      if (!paintModeRef.current) return;
      downPos.x = e.clientX;
      downPos.y = e.clientY;
      downPos.t = performance.now();
      downPos.valid = true;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!paintModeRef.current || !downPos.valid) return;
      downPos.valid = false;
      // Movement / time budget for "this was a click, not a camera-orbit
      // drag." 8px lets a normal mouse hand tremor or a touchpad tap pass;
      // 600ms covers a slow click + the OS click-delay on touch devices.
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 8) return;
      if (performance.now() - downPos.t > 600) return;
      onSelectLinkRef.current?.(pickLinkAt(e.clientX, e.clientY));
    };

    // Gaze-follow: project the cursor onto the plane at head depth and
    // express the direction from the head to that point as yaw/pitch in the
    // robot's frame. The URDF is x-forward / z-up; after the zUp conversion
    // the robot faces scene +x and positive head yaw swings +x toward -z.
    // Working in world space keeps this correct from any camera angle.
    const headWorld = new THREE.Vector3();
    const lookVec = new THREE.Vector3();
    const computeLookTarget = (
      clientX: number,
      clientY: number,
    ): { yaw_deg: number; pitch_deg: number } | null => {
      const robot = robotRef.current;
      if (!robot) return null;
      const headObj = headRigRef.current?.link ?? robot.links?.["head"] ?? robot;
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      headObj.getWorldPosition(headWorld);
      const dist = camera.position.distanceTo(headWorld);
      lookVec
        .copy(raycaster.ray.direction)
        .multiplyScalar(dist)
        .add(raycaster.ray.origin)
        .sub(headWorld);
      // Cursor hovering on the head itself → degenerate direction. Look at
      // the camera instead: pointing at the duck means "look at me".
      if (lookVec.length() < 0.08) lookVec.copy(camera.position).sub(headWorld);
      const yaw = (Math.atan2(-lookVec.z, lookVec.x) * 180) / Math.PI;
      const pitch = (Math.atan2(lookVec.y, Math.hypot(lookVec.x, lookVec.z)) * 180) / Math.PI;
      return { yaw_deg: yaw, pitch_deg: pitch };
    };

    // Hover preview + gaze: re-evaluate on every pointermove (rAF-throttled)
    // so paint mode shows exactly which part will be picked and look mode
    // tracks the cursor without flooding the robot with commands.
    let pendingMove: { x: number; y: number } | null = null;
    let moveRaf = 0;
    const flushHover = () => {
      moveRaf = 0;
      if (!pendingMove) return;
      const { x, y } = pendingMove;
      pendingMove = null;
      if (paintModeRef.current) {
        const link = pickLinkAt(x, y);
        if (hoverLinkRef.current !== link) {
          hoverLinkRef.current = link;
          refreshOutlineVisibility();
        }
      }
      if (lookModeRef.current) {
        const target = computeLookTarget(x, y);
        if (target) onLookRef.current?.(target);
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!paintModeRef.current && !lookModeRef.current) return;
      pendingMove = { x: e.clientX, y: e.clientY };
      if (!moveRaf) moveRaf = requestAnimationFrame(flushHover);
    };
    const onPointerLeave = () => {
      if (hoverLinkRef.current !== null) {
        hoverLinkRef.current = null;
        refreshOutlineVisibility();
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    // ---- resize ----
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w <= 0 || h <= 0) return;
      // `true` (the default) lets three.js sync canvas.style.width/height
      // to the CSS pixel size. Passing `false` here meant the canvas's
      // CSS size kept growing to the drawing-buffer size — fine on
      // pixelRatio=1 desktops, but on a pixelRatio=2/3 phone the canvas
      // rendered at 2-3× the mount and only the top-left corner was
      // visible (the robot looked stuck in the upper-left).
      renderer.setSize(w, h, true);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Mobile layouts often settle after the initial render (URL bar
      // collapse, orientation change, safe-area). Re-fit until the user
      // grabs the camera.
      refitIfStillAuto();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---- render loop ----
    // Reused per-frame to keep tick allocation-free.
    const headEuler = new THREE.Euler(0, 0, 0, "ZYX");
    const headDelta = new THREE.Quaternion();
    const floorBox = new THREE.Box3();
    const explodeQ = new THREE.Quaternion();
    const explodeDir = new THREE.Vector3();
    // Follow-cam + footprint state. followPrev tracks the robot's scene
    // position so the camera pans by exactly the frame-to-frame delta —
    // orbiting/zooming still belongs to the user.
    const followPrev = new THREE.Vector3();
    const followDelta = new THREE.Vector3();
    let prevFeet: [boolean, boolean] = [true, true];
    const FOOT_LATERAL_M = 0.045;

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const { joints: js, imu: im, odom: od, feet: ft } = latestRef.current;
      const robot = robotRef.current;

      // Resolve current explode factor (animated cycle overrides the slider).
      let factor = explodeRef.current;
      if (animateRef.current) {
        const dt = (performance.now() - animateStartRef.current) / 1000;
        factor = 0.5 - 0.5 * Math.cos((dt * Math.PI) / 2); // 4-second period
      }
      const inspecting = factor > 0 && lockPoseRef.current;

      // urdf-loader streams STL meshes in async. Poll for new ones each frame
      // — `captureNewMeshes` returns [] once everything's stable.
      if (robot) {
        const fresh = captureNewMeshes(robot, meshInfosRef.current);
        if (fresh.length > 0) {
          meshInfosRef.current = [...meshInfosRef.current, ...fresh];
          applyMaterialMode(meshInfosRef.current, viewModeRef.current);
          applyColorOverrides(meshInfosRef.current, colorOverridesRef.current);
          // Build edge outlines for newly streamed meshes. They live as
          // children of the mesh so they ride along with joint motion and
          // explode offsets for free. Material is cloned per outline so
          // each one's opacity can be tweened independently between the
          // selected and hover states.
          for (const info of fresh) {
            if (!info.linkName) continue;
            const geom = info.mesh.geometry as THREE.BufferGeometry | undefined;
            if (!geom) continue;
            const edges = new THREE.EdgesGeometry(geom, 30);
            const mat = new THREE.LineBasicMaterial({
              color: 0xffffff,
              depthTest: false,
              transparent: true,
              opacity: HOVER_OPACITY,
            });
            const line = new THREE.LineSegments(edges, mat);
            line.renderOrder = RENDER_ORDER_HELPER + 1;
            line.visible = false;
            info.mesh.add(line);
            const arr = outlinesByLinkRef.current.get(info.linkName) ?? [];
            arr.push(line);
            outlinesByLinkRef.current.set(info.linkName, arr);
          }
          refreshOutlineVisibility();
          const names = Array.from(
            new Set(meshInfosRef.current.map((i) => i.linkName).filter((n): n is string => !!n)),
          ).sort();
          const prev = knownLinkNamesRef.current;
          if (prev.length !== names.length || !prev.every((n, i) => n === names[i])) {
            knownLinkNamesRef.current = names;
            onLinkNamesRef.current?.(names);
            const defaults: Record<string, string> = {};
            for (const info of meshInfosRef.current) {
              if (!info.linkName || defaults[info.linkName]) continue;
              const c = info.origMaterial.color;
              if (c) defaults[info.linkName] = "#" + c.getHexString();
            }
            onLinkDefaultsRef.current?.(defaults);
          }
        }
      }

      if (robot) {
        if (inspecting) {
          // Freeze every revolute joint at its URDF rest pose for a clean,
          // symmetric explosion.
          for (const name of Object.keys(robot.joints)) {
            robot.joints[name].setJointValue(0);
          }
        } else {
          for (const j of js) {
            const handle = robot.joints[j.name];
            if (handle) handle.setJointValue(j.angle_deg * D2R);
          }
        }

        // Synthetic head rig.
        const rig = headRigRef.current;
        if (useSyntheticHeadRigRef.current && rig) {
          if (inspecting) {
            rig.link.quaternion.copy(rig.restQuat);
          } else {
            let np = 0,
              hp = 0,
              hy = 0,
              hr = 0;
            for (const j of js) {
              switch (j.name) {
                case "neck_pitch":
                  np = j.angle_deg;
                  break;
                case "head_pitch":
                  hp = j.angle_deg;
                  break;
                case "head_yaw":
                  hy = j.angle_deg;
                  break;
                case "head_roll":
                  hr = j.angle_deg;
                  break;
              }
            }
            headEuler.set(hr * D2R, (np + hp) * D2R, hy * D2R, "ZYX");
            headDelta.setFromEuler(headEuler);
            rig.link.quaternion.copy(rig.restQuat).multiply(headDelta);
          }
        }

        // Apply the radial explode offset. We rotate `outwardWorld` into the
        // parent's local frame *every* frame so the explosion stays radial
        // even when joints have moved between capture and now.
        if (meshInfosRef.current.length > 0) {
          const off = factor * EXPLODE_SCALE;
          for (const info of meshInfosRef.current) {
            info.mesh.position.copy(info.restPos);
            if (off !== 0 && info.mesh.parent) {
              info.mesh.parent.getWorldQuaternion(explodeQ);
              explodeQ.invert();
              explodeDir.copy(info.outwardWorld).applyQuaternion(explodeQ);
              info.mesh.position.addScaledVector(explodeDir, off);
            }
          }
        }

        // Skip floor snap while inspecting so the explosion stays centred on
        // the body rather than dragging the whole rig upward.
        if (droppedToFloor && !inspecting) {
          floorBox.setFromObject(robot);
          if (isFinite(floorBox.min.y) && !floorBox.isEmpty()) {
            robot.position.z -= floorBox.min.y;
          }
        }
      }
      if (tiltGroupRef.current) {
        if (inspecting || !im) {
          tiltGroupRef.current.rotation.x = 0;
          tiltGroupRef.current.rotation.z = 0;
        } else {
          tiltGroupRef.current.rotation.x = im.pitch_deg * D2R * 0.3;
          tiltGroupRef.current.rotation.z = im.roll_deg * D2R * 0.3;
        }
      }

      // ---- odometry: place the robot, pan the camera, stamp footprints ----
      const nowS = performance.now() / 1000;
      if (od) {
        // URDF world (x fwd, y left, z up) → scene (x, −y horizontal, y up);
        // yaw about URDF z becomes rotation about scene y.
        const sceneX = od.x_m;
        const sceneZ = -od.y_m;
        const yawRad = od.yaw_deg * D2R;
        odomGroup.position.set(sceneX, 0, sceneZ);
        odomGroup.rotation.y = yawRad;

        followDelta.set(sceneX - followPrev.x, 0, sceneZ - followPrev.z);
        const moved = followDelta.lengthSq() > 1e-10;
        if (moved) {
          camera.position.add(followDelta);
          controls.target.add(followDelta);
          controls.update();
          followPrev.set(sceneX, 0, sceneZ);
        }

        // Stamp a print when a foot lands while the body is displacing.
        if (ft && moved) {
          for (let i = 0; i < 2; i++) {
            if (!ft[i] || prevFeet[i]) continue;
            const side = i === 0 ? 1 : -1; // [left, right] → ± lateral offset
            const lx = -Math.sin(yawRad) * side * FOOT_LATERAL_M;
            const lz = -Math.cos(yawRad) * side * FOOT_LATERAL_M;
            footTrail.drop(sceneX + lx, sceneZ + lz, yawRad, nowS);
          }
        }
        if (ft) prevFeet = ft;
      }
      footTrail.update(nowS);

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      if (moveRaf) cancelAnimationFrame(moveRaf);
      window.removeEventListener("keydown", onKey);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      ro.disconnect();
      footTrail.dispose();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
      apiRef.current = null;
      headRigRef.current = null;
      worldAxesRef.current = null;
      bodyAxesRef.current = null;
      jointAxisArrowsRef.current = [];
      meshInfosRef.current = [];
      outlinesByLinkRef.current.clear();
      rendererDomRef.current = null;
    };
  }, []);

  // ---- ref-syncing effects ----
  useEffect(() => {
    if (worldAxesRef.current) worldAxesRef.current.visible = axes.world;
    if (bodyAxesRef.current) bodyAxesRef.current.visible = axes.body;
    for (const a of jointAxisArrowsRef.current) a.visible = axes.joint;
  }, [axes, status]);

  useEffect(() => {
    explodeRef.current = explode;
  }, [explode]);
  useEffect(() => {
    lockPoseRef.current = lockPose;
  }, [lockPose]);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);
  useEffect(() => {
    if (animate && !animateRef.current) animateStartRef.current = performance.now();
    animateRef.current = animate;
  }, [animate]);
  useEffect(() => {
    applyMaterialMode(meshInfosRef.current, viewMode);
    applyColorOverrides(meshInfosRef.current, colorOverridesRef.current);
  }, [viewMode, status]);
  useEffect(() => {
    const next = colorOverrides ?? {};
    colorOverridesRef.current = next;
    applyColorOverrides(meshInfosRef.current, next);
  }, [colorOverrides]);

  useEffect(() => {
    paintModeRef.current = paintMode;
    selectedLinkRef.current = selectedLink;
    if (!paintMode) hoverLinkRef.current = null;
    refreshOutlinesRef.current();
    const dom = rendererDomRef.current;
    if (dom) dom.style.cursor = paintMode ? "crosshair" : "";
  }, [paintMode, selectedLink]);

  // ---- on-screen camera buttons ----
  const call = useCallback(
    <K extends keyof ViewApi>(method: K, ...args: Parameters<ViewApi[K]>) => {
      const api = apiRef.current;
      if (!api) return;
      (api[method] as (...a: Parameters<ViewApi[K]>) => void)(...args);
    },
    [],
  );

  return (
    <div className="relative w-full h-full min-h-[320px]">
      <div ref={mountRef} className="w-full h-full" />

      <ViewControls
        onRotate={(a, e) => call("rotate", a, e)}
        onZoom={(f) => call("zoom", f)}
        onReset={() => call("reset")}
        onPreset={(p) => call("view", p)}
      />

      <AxesPanel axes={axes} setAxes={setAxes} />

      <InspectPanel
        viewMode={viewMode}
        setViewMode={setViewMode}
        explode={explode}
        setExplode={setExplode}
        lockPose={lockPose}
        setLockPose={setLockPose}
        animate={animate}
        setAnimate={setAnimate}
      />

      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-center p-4 pointer-events-none">
          {status === "loading" ? (
            <div className="text-slate-400">Loading robot.urdf…</div>
          ) : (
            <div className="text-rose-300 max-w-sm text-sm">
              <div className="font-semibold mb-1">CAD assets not found</div>
              <div className="text-slate-400">
                Expected URDF + STL files under{" "}
                <code className="bg-slate-800 px-1 rounded">public/assets/open_duck_mini_v2/</code>.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
