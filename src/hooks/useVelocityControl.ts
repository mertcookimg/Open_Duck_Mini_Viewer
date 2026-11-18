// Copyright 2026 Masato Kobayashi
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";
import { sendCommand } from "../robot";

export interface Velocity {
  vx: number;
  vy: number;
  wz: number;
}

const ZERO: Velocity = { vx: 0, vy: 0, wz: 0 };
const SEND_INTERVAL_MS = 50;

// True when the key event originated in a text-entry element — WASD typed
// into the paint hex field (or any future input) must not drive the robot.
function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return (
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" ||
    t.isContentEditable
  );
}

/**
 * Owns the operator's velocity command: WASD/QE keyboard input plus the
 * on-screen joysticks, rate-limited to one `velocity` command per 50 ms.
 *
 * Lives at the App level (not inside ControlPanel) so hiding or remounting
 * the operator panel can never strand the robot walking on a stale command.
 */
export function useVelocityControl(): {
  vel: Velocity;
  onMove: (x: number, y: number) => void;
  onTurn: (x: number, y: number) => void;
} {
  const [vel, setVel] = useState<Velocity>(ZERO);
  const velRef = useRef<Velocity>(ZERO);
  const keys = useRef(new Set<string>());

  useEffect(() => {
    velRef.current = vel;
  }, [vel]);

  // One long-lived sender. It reads the latest velocity from a ref, so
  // continuous joystick drags (a new value every pointermove) are throttled
  // to 20 Hz instead of starving the timer.
  useEffect(() => {
    let lastSent: Velocity = ZERO;
    const id = window.setInterval(() => {
      const cur = velRef.current;
      if (cur.vx === lastSent.vx && cur.vy === lastSent.vy && cur.wz === lastSent.wz) return;
      lastSent = cur;
      void sendCommand({ kind: "velocity", ...cur });
    }, SEND_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      // Soft-stop on teardown so the robot never keeps a stale command.
      void sendCommand({ kind: "velocity", ...ZERO });
    };
  }, []);

  useEffect(() => {
    const recompute = () => {
      const k = keys.current;
      const vx = (k.has("w") ? 1 : 0) + (k.has("s") ? -1 : 0);
      const vy = (k.has("a") ? -1 : 0) + (k.has("d") ? 1 : 0);
      const wz = (k.has("q") ? -1 : 0) + (k.has("e") ? 1 : 0);
      setVel({ vx, vy, wz });
    };
    const down = (e: KeyboardEvent) => {
      if (e.repeat || isTypingTarget(e)) return;
      keys.current.add(e.key.toLowerCase());
      recompute();
    };
    // keyup is never filtered: if focus moved into an input mid-press, the
    // release must still be seen or the robot walks forever.
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
      recompute();
    };
    // Alt-tab away swallows the keyup — treat losing focus as all-keys-up.
    const releaseAll = () => {
      if (keys.current.size === 0) return;
      keys.current.clear();
      recompute();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", releaseAll);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", releaseAll);
    };
  }, []);

  const onMove = useCallback((x: number, y: number) => {
    setVel((v) => ({ ...v, vx: y, vy: x }));
  }, []);
  const onTurn = useCallback((x: number, _y: number) => {
    setVel((v) => ({ ...v, wz: x }));
  }, []);

  return { vel, onMove, onTurn };
}
