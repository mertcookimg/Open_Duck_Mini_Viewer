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
import { ColorPanel } from "./components/ColorPanel";

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

  // Appearance (color overrides) — lifted here so the AppearancePanel can
  // live outside the viewer and be toggled by PanelVisibilityPicker.
  const [linkNames, setLinkNames] = useState<string[]>([]);
  const [linkDefaults, setLinkDefaults] = useState<Record<string, string>>({});
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [colorOverrides, setColorOverrides] = useColorOverrides();
  const handleLinkNames = useCallback((names: string[]) => setLinkNames(names), []);
  const handleLinkDefaults = useCallback(
    (defaults: Record<string, string>) => setLinkDefaults(defaults),
    [],
  );
  const handleSetColor = useCallback(
    (link: string, hex: string) =>
      setColorOverrides((prev) => ({ ...prev, [link]: hex })),
    [],
  );
  const handleResetLink = useCallback(
    (link: string) =>
      setColorOverrides((prev) => {
        if (!(link in prev)) return prev;
        const next = { ...prev };
        delete next[link];
        return next;
      }),
    [],
  );
  const handleResetAll = useCallback(() => setColorOverrides({}), []);
  const handleSetAllColor = useCallback(
    (hex: string) =>
      setColorOverrides(() =>
        Object.fromEntries(linkNames.map((n) => [n, hex])),
      ),
    [linkNames],
  );

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
          <main className="col-span-6 bg-slate-900 rounded-lg overflow-hidden">
            <DuckViewer
              joints={effectiveTele?.joints ?? []}
              imu={effectiveTele?.imu}
              colorOverrides={colorOverrides}
              onLinkNames={handleLinkNames}
              onLinkDefaults={handleLinkDefaults}
            />
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
