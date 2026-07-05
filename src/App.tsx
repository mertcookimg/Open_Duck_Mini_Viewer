// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTelemetry } from "./hooks/useTelemetry";
import { usePoseOverrides } from "./hooks/usePoseOverrides";
import { usePanelVisibility } from "./hooks/usePanelVisibility";
import { useColorOverrides } from "./hooks/useColorOverrides";
import { MAX_SIDE_WIDTH, MIN_SIDE_WIDTH, useColumnWidths } from "./hooks/useColumnWidths";
import { MAX_ROW_HEIGHT, MIN_ROW_HEIGHT, useRowHeights } from "./hooks/useRowHeights";
import { useScrollEdges } from "./hooks/useScrollEdges";
import { fetchJointConfigs, sendCommand } from "./robot";
import type { JointConfig } from "./types";
import { StatusBar } from "./components/StatusBar";
import { JointTable } from "./components/JointTable";
import { JointTrendPanel } from "./components/JointTrendPanel";
import { ImuPanel } from "./components/ImuPanel";
import { BatteryGauge } from "./components/BatteryGauge";
import { ControlPanel } from "./components/ControlPanel";
import { DuckViewer } from "./components/viewer";
import { PoseEditorPanel } from "./components/PoseEditorPanel";
import { Loading } from "./components/Loading";
import { Help } from "./components/Help";
import { PanelVisibilityPicker } from "./components/PanelVisibilityPicker";
import { PaintToolbar } from "./components/PaintToolbar";
import { ColorPanel } from "./components/ColorPanel";
import { Resizer } from "./components/Resizer";

// Hue across the full circle, kept in a saturation/lightness band that
// reads as "colourful but not muddy or washed out" — used by the
// randomise-all-parts action.
function randomVibrantHex(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 65 + Math.random() * 20; // 65–85 %
  const l = 50 + Math.random() * 15; // 50–65 %
  const sN = s / 100;
  const lN = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => {
    const c = lN - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function App() {
  const { tele, jointHistory } = useTelemetry();
  const [panels, setPanels] = usePanelVisibility();
  const pose = usePoseOverrides(tele);

  const [jointConfigs, setJointConfigs] = useState<JointConfig[]>([]);
  useEffect(() => {
    fetchJointConfigs()
      .then(setJointConfigs)
      .catch(() => {
        /* ignore */
      });
  }, []);

  const effectiveTele = useMemo(() => pose.apply(tele), [pose, tele]);
  const estopOn = effectiveTele?.mode === "estop";

  // Appearance (color overrides) — kept in App so both the on-viewer paint
  // mode and the legacy ColorPanel can drive the same override map.
  const [linkNames, setLinkNames] = useState<string[]>([]);
  const [linkDefaults, setLinkDefaults] = useState<Record<string, string>>({});
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [paintMode, setPaintMode] = useState(false);
  // Active paint colour. Click on a part → that part is painted with this
  // colour; dragging the picker afterwards live-updates whatever was last
  // painted. Default is the duck-yellow brand accent.
  const [paintColor, setPaintColor] = useState("#facc15");
  const [colorOverrides, setColorOverrides] = useColorOverrides();
  const [columnWidths, setColumnWidths] = useColumnWidths();
  // Track viewport width so we can shrink the side columns on small
  // screens even if the saved widths would otherwise crowd the viewer
  // out. Without this, a saved 280 + 280 layout becomes unusable on a
  // 400 px phone.
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800,
  );
  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const NARROW_BREAKPOINT_PX = 640;
  const isNarrow = viewportWidth < NARROW_BREAKPOINT_PX;
  const adjustLeftWidth = useCallback(
    (dx: number) =>
      setColumnWidths((w) => ({
        ...w,
        left: Math.max(MIN_SIDE_WIDTH, Math.min(MAX_SIDE_WIDTH, w.left + dx)),
      })),
    [setColumnWidths],
  );
  const adjustRightWidth = useCallback(
    (dx: number) =>
      setColumnWidths((w) => ({
        ...w,
        right: Math.max(MIN_SIDE_WIDTH, Math.min(MAX_SIDE_WIDTH, w.right - dx)),
      })),
    [setColumnWidths],
  );
  const [rowHeights, setRowHeights] = useRowHeights();
  const adjustTopHeight = useCallback(
    (dy: number) =>
      setRowHeights((h) => ({
        ...h,
        top: Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, h.top + dy)),
      })),
    [setRowHeights],
  );
  const adjustBottomHeight = useCallback(
    (dy: number) =>
      setRowHeights((h) => ({
        ...h,
        // Resizer below the viewer: dragging down shrinks the bottom
        // section (more viewer), so subtract dy.
        bottom: Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, h.bottom - dy)),
      })),
    [setRowHeights],
  );
  const handleLinkNames = useCallback((names: string[]) => setLinkNames(names), []);
  const handleLinkDefaults = useCallback(
    (defaults: Record<string, string>) => setLinkDefaults(defaults),
    [],
  );

  const handlePickPart = useCallback(
    (link: string | null) => {
      setSelectedLink(link);
      if (link) setColorOverrides((prev) => ({ ...prev, [link]: paintColor }));
    },
    [paintColor, setColorOverrides],
  );
  // ColorPanel handlers — kept around for the right-column panel.
  const handleSetColor = useCallback(
    (link: string, hex: string) => setColorOverrides((prev) => ({ ...prev, [link]: hex })),
    [setColorOverrides],
  );
  const handleResetLink = useCallback(
    (link: string) =>
      setColorOverrides((prev) => {
        if (!(link in prev)) return prev;
        const next = { ...prev };
        delete next[link];
        return next;
      }),
    [setColorOverrides],
  );
  const handleSetAllColor = useCallback(
    (hex: string) => setColorOverrides(() => Object.fromEntries(linkNames.map((n) => [n, hex]))),
    [linkNames, setColorOverrides],
  );
  const handleRandomizeAll = useCallback(() => {
    setColorOverrides(() => Object.fromEntries(linkNames.map((n) => [n, randomVibrantHex()])));
  }, [linkNames, setColorOverrides]);
  // Picker / preset / hex changes: update paintColor and live-repaint the
  // last-clicked part so the user sees the colour change immediately.
  const handlePaintColorChange = useCallback(
    (hex: string) => {
      setPaintColor(hex);
      if (selectedLink) {
        setColorOverrides((prev) => ({ ...prev, [selectedLink]: hex }));
      }
    },
    [selectedLink, setColorOverrides],
  );
  const handleResetSelected = useCallback(() => {
    if (!selectedLink) return;
    setColorOverrides((prev) => {
      if (!(selectedLink in prev)) return prev;
      const next = { ...prev };
      delete next[selectedLink];
      return next;
    });
  }, [selectedLink, setColorOverrides]);
  const handleResetAll = useCallback(() => setColorOverrides({}), [setColorOverrides]);
  const exitPaint = useCallback(() => {
    setPaintMode(false);
    setSelectedLink(null);
  }, []);

  // Esc leaves paint mode — matches the "Esc cancels the current mode"
  // convention and saves a trip to the toolbar's Done button.
  useEffect(() => {
    if (!paintMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitPaint();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paintMode, exitPaint]);

  // Gaze-follow ("Look") mode — the viewer reports where the cursor points
  // in the robot's frame; the robot turns its head to follow. Releasing the
  // mode hands the head back to the gait / motions.
  const [lookMode, setLookMode] = useState(false);
  const handleLook = useCallback((target: { yaw_deg: number; pitch_deg: number }) => {
    void sendCommand({ kind: "look", target });
  }, []);
  useEffect(() => {
    if (!lookMode) void sendCommand({ kind: "look", target: null });
  }, [lookMode]);

  // When the viewer is shown, each side column uses the resizable fixed
  // width — but on small viewports we shrink them proportionally so the
  // viewer keeps at least VIEWER_MIN_PX. Saved preferences stay intact
  // and pop back when the window is enlarged. When the viewer is
  // hidden, both sides flex-1 to share the row 50/50.
  const VIEWER_MIN_PX = 240;
  const LAYOUT_OVERHEAD_PX = 32; // root padding + gaps + 2 resizer handles
  const SHRINK_FLOOR_PX = 120; // never shrink an aside below this on phones
  const effective = useMemo(() => {
    const desired = columnWidths.left + columnWidths.right;
    const budget = Math.max(
      2 * SHRINK_FLOOR_PX,
      viewportWidth - VIEWER_MIN_PX - LAYOUT_OVERHEAD_PX,
    );
    const scale = desired > budget ? budget / desired : 1;
    return {
      left: Math.max(SHRINK_FLOOR_PX, Math.round(columnWidths.left * scale)),
      right: Math.max(SHRINK_FLOOR_PX, Math.round(columnWidths.right * scale)),
    };
  }, [columnWidths, viewportWidth]);

  const VIEWER_MIN_VERT_PX = 200;
  const LAYOUT_OVERHEAD_VERT_PX = 80; // status bar + paddings + 2 resizers
  const ROW_FLOOR_PX = 80;
  const effectiveRows = useMemo(() => {
    const desired = rowHeights.top + rowHeights.bottom;
    const budget = Math.max(
      2 * ROW_FLOOR_PX,
      viewportHeight - VIEWER_MIN_VERT_PX - LAYOUT_OVERHEAD_VERT_PX,
    );
    const scale = desired > budget ? budget / desired : 1;
    return {
      top: Math.max(ROW_FLOOR_PX, Math.round(rowHeights.top * scale)),
      bottom: Math.max(ROW_FLOOR_PX, Math.round(rowHeights.bottom * scale)),
    };
  }, [rowHeights, viewportHeight]);
  const leftAsideRef = useScrollEdges<HTMLElement>();
  const rightAsideRef = useScrollEdges<HTMLElement>();
  const sideColClass = "scroll-edges flex flex-col gap-3 overflow-y-auto";
  const leftStyle = panels.viewer ? { width: effective.left, flexShrink: 0 } : undefined;
  const rightStyle = panels.viewer ? { width: effective.right, flexShrink: 0 } : undefined;
  const sideExtraClass = panels.viewer ? "" : "flex-1 basis-0 min-w-0";
  const hasLeftContent = panels.battery || panels.imu || panels.jointTrends || panels.jointTable;
  const hasRightContent = panels.poseEditor || panels.operator || panels.color || panels.help;

  const leftPanels = effectiveTele ? (
    <>
      {panels.battery && (effectiveTele.battery || effectiveTele.system) && (
        <BatteryGauge battery={effectiveTele.battery} system={effectiveTele.system} />
      )}
      {panels.imu && <ImuPanel imu={effectiveTele.imu} feet={effectiveTele.feet} />}
      {panels.jointTrends && (
        <JointTrendPanel joints={effectiveTele.joints} history={jointHistory} />
      )}
      {panels.jointTable && <JointTable joints={effectiveTele.joints} />}
    </>
  ) : (
    <Loading />
  );

  const rightPanels = (
    <>
      {panels.poseEditor && effectiveTele && (
        <PoseEditorPanel
          joints={effectiveTele.joints}
          jointConfigs={jointConfigs}
          enabled={pose.enabled}
          onEnabledChange={pose.setEnabled}
          overrides={pose.overrides}
          onSetOverride={pose.setOverride}
          onClearOverrides={pose.clear}
        />
      )}
      {panels.operator && (
        <ControlPanel estopOn={estopOn} activeMotion={effectiveTele?.motion ?? null} />
      )}
      {panels.color && (
        <ColorPanel
          linkNames={linkNames}
          linkDefaults={linkDefaults}
          selectedLink={selectedLink}
          onSelectLink={setSelectedLink}
          colorOverrides={colorOverrides}
          onSetColor={handleSetColor}
          onResetLink={handleResetLink}
          onResetAll={handleResetAll}
          onSetAllColor={handleSetAllColor}
        />
      )}
      {panels.help && <Help />}
    </>
  );

  // 3D viewer + paint controls. Shared between desktop and narrow stack
  // layouts so the same DuckViewer instance hosts paint mode either way.
  // Always-visible "reset pose" affordance on the viewer so users can
  // drop back to live telemetry without locating the Pose Editor panel.
  // Disabled (rather than hidden) when there's nothing to reset, so the
  // button location is consistent and discoverable.
  const hasPoseChanges = pose.enabled || Object.keys(pose.overrides).length > 0;
  // "Center" only lights up once the duck has actually wandered off origin.
  const odom = effectiveTele?.odom;
  const hasWandered =
    !!odom &&
    (Math.abs(odom.x_m) > 0.01 || Math.abs(odom.y_m) > 0.01 || Math.abs(odom.yaw_deg) > 1);
  const viewerInner = (
    <>
      <DuckViewer
        joints={effectiveTele?.joints ?? []}
        imu={effectiveTele?.imu}
        odom={effectiveTele?.odom}
        feet={effectiveTele?.feet}
        colorOverrides={colorOverrides}
        onLinkNames={handleLinkNames}
        onLinkDefaults={handleLinkDefaults}
        paintMode={paintMode}
        selectedLink={selectedLink}
        onSelectLink={paintMode ? handlePickPart : setSelectedLink}
        lookMode={lookMode}
        onLook={handleLook}
      />
      <button
        type="button"
        onClick={pose.clear}
        disabled={!hasPoseChanges}
        // Sits between the AxesPanel (top-left) and InspectPanel
        // (top-right). `left/right [4.5rem]` reserves enough room for
        // both panels collapsed; `mx-auto` keeps the button itself
        // centred in whatever band remains.
        className="absolute top-3 left-[4.5rem] right-[4.5rem] mx-auto z-20 w-fit px-2 py-1 rounded text-[11px] bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-200 hover:bg-slate-800 shadow disabled:opacity-40 disabled:hover:bg-slate-900/80 disabled:cursor-not-allowed"
        title="Reset pose — clear overrides and resume live telemetry"
      >
        ↺ Home
      </button>
      {paintMode ? (
        <PaintToolbar
          paintColor={paintColor}
          selectedLink={selectedLink}
          overrides={colorOverrides}
          onPaintColorChange={handlePaintColorChange}
          onRandomizeAll={handleRandomizeAll}
          onResetSelected={handleResetSelected}
          onResetAll={handleResetAll}
          onClose={exitPaint}
        />
      ) : (
        <div className="absolute bottom-3 left-[9rem] right-[4.5rem] mx-auto z-20 w-fit flex gap-2">
          <button
            type="button"
            onClick={() => setLookMode((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs backdrop-blur border shadow ${
              lookMode
                ? "bg-duck-600 hover:bg-duck-500 border-duck-500 text-white"
                : "bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200"
            }`}
            title="Look mode — the duck's head follows your cursor"
          >
            👀 Look
          </button>
          <button
            type="button"
            onClick={() => setPaintMode(true)}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-200 hover:bg-slate-800 shadow"
            title="Enter paint mode — click parts to recolour them"
          >
            🎨 Paint
          </button>
          <button
            type="button"
            onClick={() => void sendCommand({ kind: "reset_odom" })}
            disabled={!hasWandered}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-200 hover:bg-slate-800 shadow disabled:opacity-40 disabled:hover:bg-slate-900/80 disabled:cursor-not-allowed"
            title="Center — bring the duck back to the middle of the grid"
          >
            🎯 Center
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="h-screen flex flex-col">
      <StatusBar mode={effectiveTele?.mode} battery={effectiveTele?.battery}>
        <PanelVisibilityPicker
          panels={panels}
          onToggle={(key) => setPanels((prev) => ({ ...prev, [key]: !prev[key] }))}
          onSetAll={(value) =>
            setPanels(
              (prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, value])) as typeof prev,
            )
          }
          onApplyPreset={(preset) => setPanels(preset)}
        />
      </StatusBar>

      {isNarrow ? (
        <div className="flex-1 flex flex-col gap-2 p-3 overflow-hidden">
          {hasLeftContent && (
            <section
              ref={leftAsideRef}
              className="scroll-edges shrink-0 flex flex-col gap-3 overflow-y-auto"
              style={{ height: effectiveRows.top }}
            >
              {leftPanels}
            </section>
          )}
          {hasLeftContent && panels.viewer && (
            <Resizer orientation="horizontal" onDelta={adjustTopHeight} />
          )}
          {panels.viewer && (
            <main className="flex-1 min-h-0 bg-slate-900 rounded-lg overflow-hidden relative">
              {viewerInner}
            </main>
          )}
          {hasRightContent && panels.viewer && (
            <Resizer orientation="horizontal" onDelta={adjustBottomHeight} />
          )}
          {hasRightContent && (
            <section
              ref={rightAsideRef}
              className="scroll-edges shrink-0 flex flex-col gap-3 overflow-y-auto"
              style={{ height: effectiveRows.bottom }}
            >
              {rightPanels}
            </section>
          )}
        </div>
      ) : (
        <div className="flex-1 flex gap-2 p-3 overflow-hidden">
          {/* Left column — telemetry */}
          {hasLeftContent && (
            <aside
              ref={leftAsideRef}
              className={`${sideColClass} ${sideExtraClass}`}
              style={leftStyle}
            >
              {leftPanels}
            </aside>
          )}

          {hasLeftContent && panels.viewer && <Resizer onDelta={adjustLeftWidth} />}

          {/* Centre — 3D viewer */}
          {panels.viewer && (
            <main className="flex-1 min-w-0 bg-slate-900 rounded-lg overflow-hidden relative">
              {viewerInner}
            </main>
          )}

          {hasRightContent && panels.viewer && <Resizer onDelta={adjustRightWidth} />}

          {/* Right column — controls */}
          {hasRightContent && (
            <aside
              ref={rightAsideRef}
              className={`${sideColClass} ${sideExtraClass}`}
              style={rightStyle}
            >
              {rightPanels}
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
