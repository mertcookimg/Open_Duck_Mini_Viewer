# Open_Duck_Mini_Viewer 🤖

[![Author](https://img.shields.io/badge/author-%40mertcookimg-blue?logo=github)](https://github.com/mertcookimg)
[![License](https://img.shields.io/badge/license-Apache--2.0-green)](LICENSE)
[![CI](https://github.com/mertcookimg/Open_Duck_Mini_Viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/mertcookimg/Open_Duck_Mini_Viewer/actions/workflows/ci.yml)

A **browser-only** GUI for the [Open Duck Mini V2](https://github.com/apirrone/Open_Duck_Mini)
bipedal duck robot. Walk, pose, and inspect the duck in 3D — all in the
browser, no Python, no hardware required.

https://github.com/user-attachments/assets/1ceee8f6-930f-4648-9927-6d90fd00f1fb

https://github.com/user-attachments/assets/8fe16ce6-7d57-42ec-8255-6f62c4f19b17

> 🌐 **Live demo:** https://mertcookimg.github.io/Open_Duck_Mini_Viewer/
> _(after you push; auto-deployed by GitHub Actions on every push to `main`)_

---

## What you can do

- 🕹 **Drive it** with a virtual joystick or `WASD` / `QE`
- 🎬 **Trigger motions** — `home`, `stand`, `bow`, `wave`, `headbang`
- 🎚 **Pose-edit any joint** with sliders, grouped by body part — just
  drag and the override mode flips on automatically
- 🎨 **Paint any part** in 3D — click parts on the model to recolour
  them, or hit `🎲 Random` for a colourful palette in one click
- 🔍 **Inspect the CAD** — explode parts, wireframe, X-ray
- 📈 **Watch live joint angles** as scrolling sparklines
- 🚨 **E-stop** big red button
- 🛞 **Toggle axes** (world / body / per-joint) for debugging
- 🪟 **Resize the layout** by dragging the slim handles between columns —
  on narrow viewports the columns stack as a top → 3D → bottom layout
  with the same drag-to-resize handles between sections

The Open Duck Mini's gait, IMU, and battery values are simulated by an in-browser
`Robot` model so the GUI is fully self-contained — perfect for a static
GitHub Pages deployment.

---

## Quick start

You only need [Node.js](https://nodejs.org/) (LTS). One command:

### Windows (PowerShell)

```powershell
# First time only — allow scripts to run
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

.\scripts\start-all.ps1
```

### Linux / macOS / WSL

```bash
chmod +x scripts/*.sh        # first time only
./scripts/start-all.sh
```

Both scripts install dependencies on first run and open
http://localhost:5173 in your browser. Add `--no-browser` (`-NoBrowser` on
PowerShell) to skip the auto-open.

### Don't have Node.js?

Grab the LTS from [nodejs.org](https://nodejs.org/), or use your package
manager:

```bash
# Ubuntu / Debian / WSL
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash -
sudo apt-get install -y nodejs

# macOS (Homebrew)
brew install node

# Windows (winget)
winget install OpenJS.NodeJS.LTS
```

Then re-run the start script above. Verify with `node -v` and `npm -v`.

---

## Want to extend it?

Common edits:

| Goal                                    | Where to look                                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Add a new motion                        | [`src/robot/motions.ts`](src/robot/motions.ts) — add a `Motion` to the `MOTIONS` map                                                                                                 |
| Tune joint limits or home pose          | [`src/robot/joints.ts`](src/robot/joints.ts)                                                                                                                                         |
| Tweak the simulated gait                | [`src/robot/Robot.ts`](src/robot/Robot.ts) (`gaitAngle`, `readTelemetry`)                                                                                                            |
| Add a new GUI panel                     | Create `src/components/MyPanel.tsx`, register the key in [`PanelVisibilityPicker.tsx`](src/components/PanelVisibilityPicker.tsx), render it in [`App.tsx`](src/App.tsx)              |
| Change paint presets / random palette   | [`src/components/PaintToolbar.tsx`](src/components/PaintToolbar.tsx) (`PRESETS`) · [`src/App.tsx`](src/App.tsx) (`randomVibrantHex`)                                                 |
| Tune layout min/max sizes or breakpoint | [`src/hooks/useColumnWidths.ts`](src/hooks/useColumnWidths.ts) · [`src/hooks/useRowHeights.ts`](src/hooks/useRowHeights.ts) · `NARROW_BREAKPOINT_PX` in [`src/App.tsx`](src/App.tsx) |
| Change camera presets / view controls   | [`src/components/viewer/`](src/components/viewer/)                                                                                                                                   |

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [three.js](https://threejs.org/) + [urdf-loader](https://github.com/gkjohnson/urdf-loaders/tree/main/javascript) for the 3D viewer
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

## Repository layout

```
public/assets/open_duck_mini_v2/   URDF + STL meshes (Apache-2.0)
src/
├── App.tsx                       composition root
├── types.ts                      shared types
├── robot/                        in-browser robot model
│   ├── Robot.ts                  gait + IMU + motion blending
│   ├── joints.ts                 joint defs + home pose
│   ├── motions.ts                keyframe motion library
│   └── api.ts · index.ts         public surface
├── hooks/                        useTelemetry / usePoseOverrides / usePanelVisibility
│                                 useColorOverrides / useColumnWidths
│                                 useRowHeights / useScrollEdges
└── components/
    ├── viewer/                   three.js + URDF subsystem (raycaster pick + outline overlays)
    ├── ControlPanel · Joystick · PoseEditorPanel
    ├── JointTable · JointTrendPanel · ImuPanel · BatteryGauge
    ├── PaintToolbar · ColorPanel · LinkPicker
    ├── StatusBar · PanelVisibilityPicker · Resizer
    └── Help · Loading
scripts/                          setup / start-all / start-frontend (PS + Bash)
.github/workflows/deploy.yml      GitHub Pages auto-deploy
```

---

## Contributing

Issues and pull requests are welcome. The project is small and pure
client-side, so the contribution loop is short. The full guide is in
[CONTRIBUTING.md](CONTRIBUTING.md); a quick summary follows.

### 1. Fork & clone

```bash
# On GitHub: click "Fork" on https://github.com/mertcookimg/Open_Duck_Mini_Viewer
git clone https://github.com/<your-user>/Open_Duck_Mini_Viewer.git
cd Open_Duck_Mini_Viewer
```

### 2. Set up & run locally

See [Quick start](#quick-start) above. In short:

```bash
./scripts/start-all.sh         # Linux / macOS / WSL
# or
.\scripts\start-all.ps1        # Windows PowerShell
```

This installs dependencies and opens the dev server on
http://localhost:5173 with hot reload.

### 3. Make your change

- Branch off `main`: `git checkout -b feat/my-thing` (or `fix/...`,
  `docs/...`).
- Keep edits focused — one logical change per PR.
- See the [Want to extend it?](#want-to-extend-it) table for common edits.

### 4. Verify before pushing

```bash
npm run typecheck      # TypeScript must pass
npm run format:check   # Prettier formatting must be clean
                       #   (run `npm run format` to auto-fix)
npm run build          # production build must succeed
```

If your change is visual or interactive, exercise it in the browser
(joystick, motions, pose editor, paint mode, viewer modes) and verify
nothing else regressed.

### 5. Open a Pull Request

- Target the `main` branch.
- In the PR description, explain **what** changed and **why**, and
  attach a screenshot or short clip for any UI change.
- Reference the related issue (`Closes #123`) if there is one.
- The GitHub Pages deploy workflow runs on merge to `main`; PR builds
  do not auto-deploy.

### Reporting bugs / requesting features

Open an [issue](https://github.com/mertcookimg/Open_Duck_Mini_Viewer/issues)
with:

- Browser & OS
- Steps to reproduce (or a brief description for a feature request)
- Console errors / screenshots if applicable

---

## License

[Apache-2.0](LICENSE).

The bundled CAD assets under `public/assets/open_duck_mini_v2/` are
redistributed under their original Apache-2.0 license — see
[`public/assets/open_duck_mini_v2/LICENSE`](public/assets/open_duck_mini_v2/LICENSE)
and [`NOTICE`](NOTICE).

## Credits

- 🤖 **Robot CAD:** [apirrone/Open_Duck_Mini](https://github.com/apirrone/Open_Duck_Mini)
- ⚙️ **Joint limits / home pose:** [Open_Duck_Mini_Runtime](https://github.com/apirrone/Open_Duck_Mini_Runtime) and [Open_Duck_Playground](https://github.com/apirrone/Open_Duck_Playground)
