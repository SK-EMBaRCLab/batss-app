# Albatross

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
    - [Development with Docker](#development-with-docker)
    - [Local Development](#local-development)
  - [Project Structure](#project-structure)
  - [CI/CD](#cicd)
    - [Automatic Versioning](#automatic-versioning)
    - [Multi-Platform Releases](#multi-platform-releases)
  - [Contributing](#contributing)
  - [Creating a Release](#creating-a-release)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

---

## About

TODO

> ⚠️ This tool is intended for ...

---

## Features

- 🔄 **Automatic R setup** — BATSS R dependencies install automatically on first launch
- 🪵 **Live activity log** — real-time inference progress and logging panel
- 🌗 **Light / Dark / System theme** — accessible contrast theme with full dark mode support
- 🐳 **Docker development** — containerised environment with docker-compose
- 🚀 **GitHub Actions CI/CD** — automated testing, linting, and multi-platform releases

---

## Requirements

- Node.js 22.x or later (or the current Active LTS version you support)
- npm
- [R](https://www.r-project.org/) (required for BATSS; detected automatically)
- On Linux: `python3-tk`, `libgl1`, `libglib2.0-0`
R packages (`BATSS` and dependencies) are installed automatically on first launch.

---

## Quick Start

### Development with Docker

1. **Start development environment:**

   ```bash
   docker-compose up -d
   ```

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the application:**

   ```bash
   npm run dev
   ```

---

## Project Structure

```
albatros/
├── .github/
│   └── workflows/
│       └── release.yml                   # Multi-platform releases

├── src/
│   └── main/
│       ├── ipc/                          #
│       ├── runtime/                      #
│       ├── services/                     #
│       ├── index.ts                      #
│       ├── settings.constants.ts         #
│   └── preload/
│   └── renderer/
│   └── shared/
├── package.json                          # Project configuration
├── package-lock.json                     # Dependency lock file
├── Dockerfile                            # Container configuration
├── docker-compose.yml                    # Docker services
├── .dockerignore                         # Docker ignore file
├── .gitignore                            # Git ignore file
├── CHANGELOG.md                          # Release please auto generated changelog
└── README.md                             # This file
```

---

## CI/CD

### Automatic Versioning

Commits follow the [Conventional Commits](https://www.conventionalcommits.org/) spec. [Release Please](https://github.com/googleapis/release-please) automatically generates changelogs and bumps versions:

| Commit prefix | Version bump |
|---|---|
| `feat:` | Minor |
| `fix:` | Patch |
| `feat!:` / `BREAKING CHANGE` | Major |

Examples:

- `feat: add user authentication` → Bumps minor version
- `fix: resolve login button not working` → Bumps patch version
- `feat(ui): add dark mode support` → Bumps minor version with scope

Conventional commits [cheatsheet](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13)

### Multi-Platform Releases

On every merged release PR, GitHub Actions builds and uploads:

- **Linux** — `.AppImage` (portable) and `.deb` package
- **Windows** — `.exe` containing the
- **macOS** — `.dmg` disk image (Apple Silicon)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Follow conventional commits
4. Open a pull request

---

## Creating a Release

1. Make sure you have conventional commits
2. When you push commits release please action will automatically create a release PR
3. when you are ready merge the Release PR
4. release-please pushes a v* tag
5. The workflow will automatically build for all platforms

---

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [BATTS](https://batss-dev.github.io/BATSS/) —
- [Docker](https://www.docker.com/) - Containerization platform
- [GitHub Actions](https://docs.github.com/en/actions) - CI/CD automation

---
