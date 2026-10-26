# Albatross

![Status](https://img.shields.io/badge/status-early%20alpha-red)

> [!WARNING]
> Albatross is in **early alpha**. Features are under active development, and the application may contain bugs or undergo significant changes. Feedback and issue reports are welcome.

A desktop application facilitating Adaptive Bayesian Clinical (ABC) Trial Design using Integrated Nested Laplace Approximations (INLA): ABC-INLA

![Electron](https://img.shields.io/badge/Electron-47848F.svg?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![R](https://img.shields.io/badge/R-276DC3?logo=r&logoColor=white)
![Docker](https://img.shields.io/badge/docker-supported-blue.svg)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-green.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Latest Release](https://img.shields.io/github/v/release/SK-EMBaRCLab/batss-app)](https://github.com/SK-EMBaRCLab/batss-app/releases/latest)

**[⬇ Download the latest release](https://github.com/SK-EMBaRCLab/batss-app/releases/latest)**

---

## Table of Contents

- [Albatross](#albatross)
  - [Table of Contents](#table-of-contents)
  - [About](#about)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Quick Start](#quick-start)
    - [Local Development](#local-development)
    - [Development with Docker](#development-with-docker)
  - [Available Scripts](#available-scripts)
  - [Testing](#testing)
  - [Project Structure](#project-structure)
  - [How It Works](#how-it-works)
  - [Troubleshooting](#troubleshooting)
    - [Error Log](#error-log)
  - [CI/CD](#cicd)
    - [Checks](#checks)
    - [Automatic Versioning](#automatic-versioning)
    - [Multi-Platform Releases](#multi-platform-releases)
    - [Release Security](#release-security)
  - [Contributing](#contributing)
  - [Creating a Release](#creating-a-release)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

---

## About

Albatross is a desktop application for designing and simulating **two-arm Bayesian adaptive clinical trials**, built around the [BATSS](https://batss-dev.github.io/BATSS/) R package (**B**ayesian **A**daptive **T**rial **S**imulator **S**oftware) and [INLA](https://www.r-inla.org/) (Integrated Nested Laplace Approximation) for fast Bayesian inference.

Rather than hand-writing simulation scripts in R, Albatross walks you through a guided wizard to configure a trial design — outcome type (binary or continuous), treatment effect assumptions, sample size and interim analysis schedule, and a decision rule — then runs the simulation locally using your machine's R installation. Results are presented as interactive tables and charts: simulated trial outcome probabilities under the null and target-effect scenarios, and sample size distributions across simulated trials.

Every design and its accumulated simulation runs are saved to a single `.design` file, so you can revisit, compare, and re-run a design without losing prior results. A batch-processing mode lets you run many designs from a CSV in one pass.

> ⚠️ Albatross is a research and trial-design exploration tool developed by the [Heath Lab](https://lab.research.sickkids.ca/heath/) at SickKids. It is intended to support methodological work and trial planning discussions, not to replace formal statistical review of a trial protocol.

---

## Features

- 🧙 **Guided design wizard** — step through outcome type, treatment effect, sample size, and decision rule configuration with inline guidance at every step
- 🧮 **Local BATSS/INLA simulation** — runs entirely on your machine via your local R installation; no data leaves your computer
- 📊 **Interactive results** — sortable/filterable simulation history table, outcome probability charts, and sample size distribution summaries
- 📁 **Batch processing** — upload a CSV of design variations and run them sequentially, with per-row results saved back into your study design
- 💾 **Save/load `.design` files** — a design and every simulation run against it live in one portable, versioned file, with unsaved-changes protection on exit
- ⏹️ **Cancellable runs** — stop a single simulation or an in-progress batch at any time
- 🔄 **Automatic R runtime setup** — BATSS, INLA, and their dependencies are detected and installed automatically on first launch, with live install progress
- ⌨️ **Command palette** — quick keyboard-driven navigation and actions (`⌘/Ctrl+K`)
- 🌗 **Light / Dark / System theme** — full dark mode support
- 🐳 **Docker development environment** — containerised environment with docker-compose for Linux development without a local R/Node setup
- 🚀 **Automated CI/CD** — conventional-commit versioning and multi-platform release builds via GitHub Actions

---

## Requirements

**To run a downloaded release:**

- [R](https://www.r-project.org/) installed and on your system (version 4.5.x recommended; other recent versions are generally compatible). Albatross detects your R installation automatically — see [How It Works](#how-it-works) — and installs the required R packages (`BATSS`, `INLA`, `fmesher`, `jsonlite`) into an app-private library on first launch, so no manual `install.packages()` step is needed.
- On Linux, installing from source requires standard build tooling (a C/Fortran toolchain, `cmake`) and the geospatial libraries INLA's dependencies need (GDAL, GEOS, PROJ, UDUNITS). See the [Dockerfile](Dockerfile) for the exact package list used in the containerised dev environment.

**To build or develop Albatross:**

- Node.js 24.x (the current LTS; see `.nvmrc`). The Docker environment and the release builds use the same version.
- npm
- R, as above (only needed to actually run a simulation; not required to build the app itself)
- [Docker](https://www.docker.com/) and Docker Compose, if you'd rather develop inside a container than install Node/R locally

---

## Quick Start

### Opening a downloaded macOS release

macOS releases are ad hoc signed, without an Apple Developer ID or Apple
notarization. macOS may therefore block the first launch even when the app's
signature is valid.

1. Download the DMG from this repository's releases and drag Albatross into
   **Applications**.
2. Try opening Albatross once.
3. If macOS blocks it, open **System Settings → Privacy & Security**, find the
   Albatross message, and choose **Open Anyway** if available. Confirm the prompt
   only if you trust the download.

For an older release that reports the app as damaged, download a newer release
containing the signing fix. Ad hoc signing checks the app's integrity; it does
not verify the publisher or mean Apple has checked the app for malware.

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the application:**

   ```bash
   npm run dev
   ```

### Development with Docker

The container provides a Linux environment with Node, R, and every system library BATSS/INLA need to build from source, so you don't need any of that installed on your host.

1. **Build and start the container:**

   ```bash
   docker-compose up -d
   ```

2. **Open a shell inside it:**

   ```bash
   docker exec -it albatross-dev bash
   ```

3. **Install dependencies and run the app** (inside the container):

   ```bash
   npm install
   npm run dev
   ```

   The container is configured for X11 forwarding with software rendering (see `docker-compose.yml`), so the Electron window renders on your host display.

---

## Available Scripts

| Script                 | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run dev`          | Start the app in development mode with hot reload                   |
| `npm start`            | Preview a production build without repackaging                      |
| `npm run build`        | Typecheck and build the renderer/main/preload bundles               |
| `npm run build:win`    | Build a Windows installer (`.exe`)                                  |
| `npm run build:mac`    | Build a macOS disk image (`.dmg`)                                   |
| `npm run build:linux`  | Build Linux packages (`.AppImage`, `.deb`)                          |
| `npm run build:unpack` | Build an unpacked app directory, for quick local testing of a build |
| `npm run typecheck`    | Type-check both the main/preload and renderer TypeScript projects   |
| `npm run lint`         | Lint and auto-fix with ESLint                                       |
| `npm run lint:check`   | Lint without changing files                                         |
| `npm run format`       | Format the codebase with Prettier                                   |
| `npm run format:check` | Check formatting without changing files                             |
| `npm test`             | Run the automated tests once                                        |
| `npm run test:watch`   | Re-run the tests whenever a file is saved                           |
| `npm run check`        | Typecheck, lint, formatting and tests: what CI runs on every push   |

---

## Testing

Automated tests use [Vitest](https://vitest.dev/). Each test file sits next to the code it tests and ends in `.test.ts`, e.g. `src/main/ipc/app-page.test.ts` for `app-page.ts`. Test files are never bundled into the app.

```bash
npm test              # run every test once (about a second)
npm run test:watch    # keep running and re-test on every save
```

The tests cover code where a mistake would be serious but easy to miss by clicking around:

| Test file                                     | What it checks                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `src/main/ipc/app-page.test.ts`               | Only the app's own page can talk to the main process (spaces, Windows case) |
| `src/main/ipc/runtime-queue.test.ts`          | R checks and updates never overlap, and an update is never skipped          |
| `src/main/services/error-log.service.test.ts` | The error log is written, kept small, and never causes a second error       |
| `src/shared/design-file-schema.test.ts`       | `.design` files load, and damaged ones are rejected with a clear message    |
| `src/shared/settings-types.test.ts`           | A damaged or hand-edited timeout setting falls back to the default          |
| `src/shared/error-reference.test.ts`          | Error references look like `7F3A-92CD` and don't repeat                     |

Simulations themselves (R, BATSS, INLA) and the screens aren't tested automatically; check those by hand before a release.

**Keeping the tests useful:**

- **When you fix a bug, add a test that would have caught it.** That's how the tests grow.
- **When you change on purpose how something behaves, update its test.** A failing test means either the code is broken (fix the code) or the rule changed (fix the test).
- Test what a function returns, not how it works inside, so reorganizing code doesn't break tests.
- Code that imports Electron is hard to test. Put logic worth testing in a small file without Electron imports (like `app-page.ts` or `runtime-queue.ts`) and keep the Electron wiring separate.

---

## Project Structure

```
albatross/
├── .github/workflows/          # CI: release-please + multi-platform build/publish
├── resources/
│   ├── icon.png                # App icon
│   └── r/
│       └── batss-simulation.R  # The R script that actually runs a BATSS simulation
├── src/
│   ├── main/                   # Electron main process (Node.js)
│   │   ├── ipc/                 # ipcMain handlers, one module per feature area
│   │   ├── runtime/              # R detection, package install/update, process execution
│   │   ├── services/              # App-level services (simulation, batch, settings, engine state)
│   │   ├── settings.constants.ts
│   │   └── index.ts               # App entrypoint: window lifecycle, IPC registration
│   ├── preload/                 # contextBridge API exposed to the renderer
│   ├── renderer/src/            # React application (the UI)
│   │   ├── components/            # UI components, grouped by feature area
│   │   ├── config/                 # Navigation and view registration
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── lib/                     # Schemas, mappers, and other framework-free logic
│   │   ├── pages/                   # Top-level routed views (dashboard, simulation, batch, results, ...)
│   │   ├── stores/                   # Zustand stores (design, simulation, batch, runtime, engine, ...)
│   │   └── types/
│   └── shared/                   # Types and constants shared between main, preload, and renderer
├── package.json
├── package-lock.json
├── electron-builder.yml         # Packaging configuration
├── electron.vite.config.ts       # Build configuration
├── Dockerfile                    # Containerised dev environment
├── docker-compose.yml
├── .gitignore
├── CHANGELOG.md                  # release-please auto-generated changelog
└── README.md                     # This file
```

---

## How It Works

1. **Runtime bootstrap** — on launch, Albatross searches common install locations for `Rscript` (including the Windows registry, since the CRAN installer doesn't add R to `PATH` by default), checks whether `BATSS`, `INLA`, `fmesher`, and `jsonlite` are installed in an app-private R library, and installs anything missing before the app becomes usable.
2. **Design the trial** — the simulation wizard collects the outcome type, treatment effect assumptions, sample size/interim schedule, and a decision rule, validating inputs at every step.
3. **Run the simulation** — Albatross serializes the design to JSON and runs `resources/r/batss-simulation.R` via your local `Rscript`, streaming live log output back to the UI. Results are read back from a temporary file rather than parsed from console output, so nothing from R/INLA's own logging can corrupt them.
4. **Review results** — each run is appended to the open `.design` file with its own results (outcome probability tables/charts, sample size distributions), so you can compare runs against each other over time.
5. **Batch mode** — for exploring many design variations at once, upload a CSV (see the in-app template) and Albatross validates and runs each row sequentially, saving every result into the same design.

---

## Troubleshooting

### Error Log

When something goes wrong unexpectedly (a simulation crashing, R setup failing, an update not downloading), Albatross shows a short message with a **reference** such as `Reference: 7F3A-92CD` instead of the raw technical error. Raw errors can contain file paths, usernames and server details, and aren't meaningful to most users.

The full details are saved under that same reference in an error log file, so a problem report that quotes the reference can be matched to exactly what happened.

#### Where to find it

The easiest way is **Settings → Error Log → Show Error Log**, which opens your file manager with the log selected (or its folder, if nothing has been recorded yet). Settings also shows the full path.

The file is `logs/errors.log` in Albatross's data folder:

| Platform | Location                                                  |
| -------- | --------------------------------------------------------- |
| macOS    | `~/Library/Application Support/albatross/logs/errors.log` |
| Windows  | `%APPDATA%\albatross\logs\errors.log`                     |
| Linux    | `~/.config/albatross/logs/errors.log`                     |

#### What's in it

One line per error, in JSON:

```json
{
  "time": "2026-10-26T14:03:12.481Z",
  "reference": "7F3A-92CD",
  "context": "simulation",
  "details": "Error: R execution failed: …"
}
```

- `time`: when it happened (UTC)
- `reference`: the reference shown in the app
- `context`: what Albatross was doing, e.g. `simulation`, `runtime check`, `update download`
- `details`: the full error and stack trace

#### Good to know

- The log **stays on your computer**; Albatross never uploads it.
- It's kept small: each entry is capped at 8 KB, and once the file passes about 256 KB the oldest half is dropped.
- It can contain local file paths and your username, so look it over before sharing it publicly (for example in a GitHub issue).
- Expected messages, such as validation errors or "R is not installed", aren't logged; they're shown in full because they're written for users.

**Reporting a problem:** include the reference from the app and attach `errors.log`, or the lines with that reference.

---

## CI/CD

### Checks

`.github/workflows/check.yml` runs `npm run check` (types, lint, formatting and tests) on every push and pull request, with read-only permissions. The result shows as a ✓ or ✗ next to the commit on GitHub. Release builds also run `npm test` on Windows, macOS and Linux before building; a platform whose tests fail is not built or published.

### Automatic Versioning

Commits follow the [Conventional Commits](https://www.conventionalcommits.org/) spec. [Release Please](https://github.com/googleapis/release-please) automatically generates changelogs and bumps versions:

| Commit prefix                | Version bump |
| ---------------------------- | ------------ |
| `feat:`                      | Minor        |
| `fix:`                       | Patch        |
| `feat!:` / `BREAKING CHANGE` | Major        |

Examples:

- `feat: add user authentication` → Bumps minor version
- `fix: resolve login button not working` → Bumps patch version
- `feat(ui): add dark mode support` → Bumps minor version with scope

Conventional commits [cheatsheet](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13)

### Multi-Platform Releases

On every merged release PR, GitHub Actions builds and uploads:

- **Linux** — `.AppImage` (portable) and `.deb` package
- **Windows** — `.exe` NSIS installer
- **macOS** — `.dmg` disk image (Apple Silicon), plus the `.zip` the auto-updater installs

Each platform also gets a `latest*.yml` file (`latest.yml`, `latest-mac.yml`, `latest-linux.yml`), which is what installed copies on that platform check for updates. If a platform fails to build, the others are still published, but the run then fails with a "Missing from the release" error naming what's absent. Re-run the failed job from the Actions tab (**Re-run failed jobs**) to add the missing files to the same release.

### Release Security

Whoever can change a release can change what every installed copy of Albatross runs, so the release pipeline is locked down.

**Least-privilege jobs.** `.github/workflows/release.yml` grants no token permissions by default; each job asks only for what it needs:

| Job              | Permissions                               | Why                                                                            |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| `release-please` | `contents: write`, `pull-requests: write` | Opens the release PR and creates the tag                                       |
| `build`          | `contents: read`                          | Runs `npm ci` and builds the installers, then saves them as workflow artifacts |
| `publish`        | `contents: write`                         | Attaches the installers to the GitHub release; installs no npm packages        |

`npm ci` runs every dependency's install scripts, so the build jobs can't write to the repository or releases, and `actions/checkout` uses `persist-credentials: false` so the token isn't left on disk.

**Actions are pinned to commit SHAs**, not tags:

```yaml
uses: softprops/action-gh-release@3bb12739c298aeb8a4eeaf626c5b8d85266b0e65 # v2.6.2
```

A tag such as `@v2` is a movable label: whoever controls the action's repository can point it at different code, and the next run executes it with this workflow's permissions. That has happened in practice: in March 2025 the `tj-actions/changed-files` tags were moved to a malicious commit that leaked CI secrets. A commit SHA can't be moved, so the workflow always runs exactly the code that was reviewed. The comment records the version the SHA corresponds to.

To update a pinned action, look up the commit for the new release tag and replace both the SHA and the version comment:

```bash
gh api repos/softprops/action-gh-release/commits/v2.6.3 -q .sha
```

Dependabot's `github-actions` ecosystem can automate this (it bumps the SHA and the comment together in a PR) if it's set up for this repository.

**Electron fuses.** `electron-builder.yml` sets `electronFuses` so a packaged Albatross can't be used to run other code: `runAsNode`, `NODE_OPTIONS` and `--inspect` are disabled, the app only loads from its own `app.asar`, and on macOS and Windows a modified `app.asar` won't load.

**Updates are downloaded only on request.** Releases aren't code-signed yet, so the auto-updater can only check a download against a hash published in the same GitHub release. Albatross therefore never downloads an update by itself: when one is available it offers a **Download** button, and installing still needs **Restart & Install**.

**Still to do:** code-sign the Windows build (and set `publisherName` so the updater verifies it), and sign and notarize the macOS build with an Apple Developer ID. Signing certificates must be stored as GitHub Actions secrets, never in the repository.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Follow conventional commits
4. Before opening a PR, make sure `npm run check` passes (types, lint, formatting and tests)
5. Open a pull request

---

## Creating a Release

1. Make sure you have conventional commits
2. When you push commits, the release-please action automatically creates/updates a release PR
3. When you're ready, merge the Release PR
4. release-please pushes a `v*` tag
5. The workflow automatically builds and publishes artifacts for all platforms

---

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [BATSS](https://batss-dev.github.io/BATSS/) — the Bayesian Adaptive Trial Simulator Software R package this application is built around
- [R-INLA](https://www.r-inla.org/) — Integrated Nested Laplace Approximation, the inference engine BATSS uses under the hood
- [Electron](https://www.electronjs.org/) / [electron-vite](https://electron-vite.org/) — desktop application framework and build tooling
- [Docker](https://www.docker.com/) — containerisation platform used for the reproducible dev environment
- [GitHub Actions](https://docs.github.com/en/actions) — CI/CD automation

---
