// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTelemetry } from "./hooks/useTelemetry";
import { usePoseOverrides } from "./hooks/usePoseOverrides";
import { usePanelVisibility } from "./hooks/usePanelVisibility";
import { useColorOverrides } from "./hooks/useColorOverrides";
import { fetchJointConfigs } from "./robot";
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
import { PanelHiddenHint } from "./components/PanelHiddenHint";
import { Help } from "./components/Help";
import { PanelVisibilityPicker } from "./components/PanelVisibilityPicker";
import { PaintToolbar } from "./components/PaintToolbar";
import { ColorPanel } from "./components/ColorPanel";

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
  const handleLinkNames = useCallback((names: string[]) => setLinkNames(names), []);
  const handleLinkDefaults = useCallback(
    (defaults: Record<string, string>) => setLinkDefaults(defaults),
    [],
  );
  // Paint-mode (bucket): clicking the 3D model selects + paints in one
  // step. This handler is wired to DuckViewer's onSelectLink only when
  // paintMode is on; when off, ColorPanel manages selection on its own.
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

  const sideColClass = panels.viewer
    ? "col-span-3 flex flex-col gap-3 overflow-y-auto"
    : "col-span-6 flex flex-col gap-3 overflow-y-auto";

  return (
    <div className="h-screen flex flex-col">
      <StatusBar mode={effectiveTele?.mode} t={effectiveTele?.t} />

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

      <div className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left column — telemetry */}
        <aside className={sideColClass}>
          {effectiveTele ? (
            <>
              {panels.battery && (effectiveTele.battery || effectiveTele.system) && (
                <BatteryGauge battery={effectiveTele.battery} system={effectiveTele.system} />
              )}
              {panels.imu && <ImuPanel imu={effectiveTele.imu} feet={effectiveTele.feet} />}
              {panels.jointTrends && (
                <JointTrendPanel joints={effectiveTele.joints} history={jointHistory} />
              )}
              {panels.jointTable && <JointTable joints={effectiveTele.joints} />}
              {!panels.battery && !panels.imu && !panels.jointTrends && !panels.jointTable && (
                <PanelHiddenHint label="left telemetry" />
              )}
            </>
          ) : (
            <Loading />
          )}
        </aside>

        {/* Centre — 3D viewer */}
        {panels.viewer && (
          <main className="col-span-6 bg-slate-900 rounded-lg overflow-hidden relative">
            <DuckViewer
              joints={effectiveTele?.joints ?? []}
              imu={effectiveTele?.imu}
              colorOverrides={colorOverrides}
              onLinkNames={handleLinkNames}
              onLinkDefaults={handleLinkDefaults}
              paintMode={paintMode}
              selectedLink={selectedLink}
              onSelectLink={paintMode ? handlePickPart : setSelectedLink}
            />
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
              <button
                type="button"
                onClick={() => setPaintMode(true)}
                className="absolute bottom-3 left-[9rem] right-[4.5rem] mx-auto z-20 w-fit px-3 py-1.5 rounded-lg text-xs bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-200 hover:bg-slate-800 shadow"
                title="Enter paint mode — click parts to recolour them"
              >
                🎨 Paint
              </button>
            )}
          </main>
        )}

        {/* Right column — controls */}
        <aside className={sideColClass}>
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
          {panels.operator && <ControlPanel estopOn={estopOn} />}
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
          {!panels.poseEditor && !panels.operator && !panels.color && !panels.help && (
            <PanelHiddenHint label="right controls" />
          )}
        </aside>
      </div>
    </div>
  );
}
