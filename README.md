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
  - [Project Structure](#project-structure)
  - [How It Works](#how-it-works)
  - [CI/CD](#cicd)
    - [Automatic Versioning](#automatic-versioning)
    - [Multi-Platform Releases](#multi-platform-releases)
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

- Node.js 22.x or later (current Active LTS)
- npm
- R, as above (only needed to actually run a simulation; not required to build the app itself)
- [Docker](https://www.docker.com/) and Docker Compose, if you'd rather develop inside a container than install Node/R locally

---

## Quick Start

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
| `npm run format`       | Format the codebase with Prettier                                   |

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

## CI/CD

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
- **macOS** — `.dmg` disk image (Apple Silicon)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Follow conventional commits
4. Before opening a PR, make sure `npm run typecheck` and `npm run lint` both pass
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
