// BATSS depends on INLA, which is NOT distributed via CRAN — it ships
// from its own repository. It must be installed before BATSS, or
// `library(BATSS)` (and even `install.packages("BATSS")`, since INLA is
// a declared dependency) will fail.
// See: https://www.r-inla.org/download-install
export const INLA_REPO = 'https://inla.r-inla-download.org/R/stable'

export const R_PACKAGES = {
  // Installed in order.
  //   fmesher — CRAN-only package INLA depends on since v23.08.18.
  //     Installed explicitly and up front rather than relying on INLA's
  //     own dependency resolution to pull it in, so it's independently
  //     checked/reported like every other required package.
  //   INLA    — from its own repo (not CRAN). Requires fmesher already
  //     present.
  //   BATSS   — from CRAN, now that its INLA dependency is satisfied.
  //   jsonlite
  ordered: ['fmesher', 'INLA', 'BATSS', 'jsonlite']
} as const

export const REQUIRED_R_PACKAGES = [...R_PACKAGES.ordered] as const

// Packages that must come from a repo other than the default CRAN
// mirror. Anything not listed here installs from cloud.r-project.org.
export const PACKAGE_REPOS: Record<string, string> = {
  INLA: INLA_REPO
}
