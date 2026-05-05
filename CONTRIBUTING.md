# Contributing

Issues and pull requests are welcome. The project is small and pure
client-side, so the contribution loop is short.

## 1. Fork & clone

```bash
# On GitHub: click "Fork" on https://github.com/mertcookimg/Open_Duck_Mini_Viewer
git clone https://github.com/<your-user>/Open_Duck_Mini_Viewer.git
cd Open_Duck_Mini_Viewer
```

## 2. Set up & run locally

See [Quick start](README.md#quick-start) in the README. In short:

```bash
./scripts/start-all.sh         # Linux / macOS / WSL
# or
.\scripts\start-all.ps1        # Windows PowerShell
```

This installs dependencies and opens the dev server on
http://localhost:5173 with hot reload.

## 3. Make your change

- Branch off `main`: `git checkout -b feat/my-thing` (or `fix/...`,
  `docs/...`).
- Keep edits focused — one logical change per PR.
- See the [Want to extend it?](README.md#want-to-extend-it) table in the
  README for common edits.

## 4. Verify before pushing

```bash
npm run typecheck     # TypeScript must pass
npm run build         # production build must succeed
```

If your change is visual or interactive, exercise it in the browser
(joystick, motions, pose editor, viewer modes) and verify nothing else
regressed.

## 5. Open a Pull Request

- Target the `main` branch.
- In the PR description, explain **what** changed and **why**, and
  attach a screenshot or short clip for any UI change.
- Reference the related issue (`Closes #123`) if there is one.
- The GitHub Pages deploy workflow runs on merge to `main`; PR builds
  do not auto-deploy.

## Reporting bugs / requesting features

Open an [issue](https://github.com/mertcookimg/Open_Duck_Mini_Viewer/issues)
with:

- Browser & OS
- Steps to reproduce (or a brief description for a feature request)
- Console errors / screenshots if applicable

## Licensing of contributions

By submitting a contribution you agree to license it under the project's
[Apache-2.0](LICENSE) terms (the standard inbound = outbound model — no
separate CLA required).
