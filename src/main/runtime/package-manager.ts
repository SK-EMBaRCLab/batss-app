// src/main/runtime/package-manager.ts

import { RManager } from './r-manager'
import { RuntimeReporter } from './reporter'
import { REQUIRED_R_PACKAGES, PACKAGE_REPOS } from './r-packages'
import type { RuntimePackage } from './types'

const PACKAGES_ENV = 'ALBATROSS_R_PACKAGES'
const PACKAGE_NAME_ENV = 'ALBATROSS_R_PACKAGE_NAME'
const PACKAGE_REPOS_ENV = 'ALBATROSS_R_PACKAGE_REPOS'

export class PackageManager {
  constructor(
    private readonly r: RManager,
    private readonly reporter: RuntimeReporter
  ) {}

  async getStatus(): Promise<RuntimePackage[]> {
    const output = await this.r.execute(
      `
        packages <- strsplit(Sys.getenv("${PACKAGES_ENV}"), ",")[[1]]

        installed <- installed.packages(lib.loc = .libPaths()[1])

        result <- sapply(
          packages,
          function(pkg) {

            if (requireNamespace(pkg, quietly = TRUE, lib.loc = .libPaths()[1])) {
              as.character(packageVersion(pkg, lib.loc = .libPaths()[1]))
            } else {
              "NA"
            }

          }
        )

        writeLines(
          paste(
            names(result),
            result,
            sep=":"
          )
        )
      `,
      { [PACKAGES_ENV]: REQUIRED_R_PACKAGES.join(',') }
    )

    const parsed = output
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [name, rawVersion] = line.split(':')
        const version = rawVersion?.trim()

        const installed = Boolean(version && version !== 'NA')

        return {
          name: name.trim(),
          installed,
          version: installed ? version : undefined
        }
      })

    this.reporter.log(`STATUS PARSED: ${JSON.stringify(parsed)}`)

    return parsed
  }

  async checkPackages(): Promise<string[]> {
    try {
      const status = await this.getStatus()

      this.reporter.log(
        status.map((p) => `${p.name}: installed=${p.installed}, version=${p.version}`).join('\n')
      )

      return status.filter((pkg) => !pkg.installed).map((pkg) => pkg.name)
    } catch (error) {
      this.reporter.log(`CHECK FAILED: ${error}`)
      throw error
    }
  }

  async installPackages(packages: string[]): Promise<void> {
    this.reporter.log(`Installing ${packages.length} package(s)`)
    const total = packages.length
    const defaultRepo = 'https://cloud.r-project.org'

    for (const [index, pkg] of packages.entries()) {
      this.reporter.log(`Attempting ${pkg}`)
      const progress = 40 + Math.round(((index + 1) / total) * 50)

      this.reporter.installing(`Installing ${pkg}`, progress)

      const extraRepo = PACKAGE_REPOS[pkg]
      const repos = extraRepo ? [defaultRepo, extraRepo] : [defaultRepo]

      await this.r.execute(
        `
          pkg <- Sys.getenv("${PACKAGE_NAME_ENV}")
          repos <- strsplit(Sys.getenv("${PACKAGE_REPOS_ENV}"), ",")[[1]]

          install_lib <- .libPaths()[1]

          # Temporary diagnostics: confirm what R's own environment sees,
          # since this is the actual process context where the internal
          # system("cp -R ...") call during binary-package install
          # happens — checking on the Node side isn't enough to prove
          # the child R process inherited it correctly.
          cat("DEBUG R PATH:", Sys.getenv("PATH"), "\\n")
          cat("DEBUG Sys.which('cp'):", Sys.which("cp"), "\\n")
          cat("DEBUG Sys.which('tar'):", Sys.which("tar"), "\\n")
          cat("DEBUG file.exists cp.exe candidates:\\n")
          for (p in strsplit(Sys.getenv("PATH"), ";")[[1]]) {
            candidate <- file.path(p, "cp.exe")
            if (file.exists(candidate)) {
              cat("  FOUND:", candidate, "\\n")
            }
          }

          # On Windows/macOS, prefer precompiled binaries even when a
          # newer source release exists — this repo's binaries commonly
          # lag its source releases, and letting install.packages()
          # fall back to "both" (its Windows/mac default) means it will
          # try to compile INLA from source, which reliably fails with
          # errors like "cp: unknown option -- )" regardless of whether
          # Rtools is installed correctly. Linux has no binary repo for
          # these packages at all, so it must keep compiling from source
          # there, same as before.
          pkg_type <- if (pkg == "INLA") {
            "source"
          } else if (.Platform$OS.type == "windows" || Sys.info()[["sysname"]] == "Darwin") {
            "binary"
          } else {
            "source"
          }
          if (!requireNamespace(pkg, quietly = TRUE, lib.loc = install_lib)) {

            install.packages(
              pkg,
              repos = repos,
              lib = install_lib,
              dependencies = NA,
              type = pkg_type
            )

          }
        `,
        { [PACKAGE_NAME_ENV]: pkg, [PACKAGE_REPOS_ENV]: repos.join(',') },

        (line) => this.reporter.log(line)
      )
    }
  }

  async ensurePackages(): Promise<RuntimePackage[]> {
    this.reporter.checking('Checking required R packages', 30)

    const missing = await this.checkPackages()

    this.reporter.log(`Missing packages: ${JSON.stringify(missing)}`)

    if (missing.length > 0) {
      await this.installPackages(missing)
    }

    const status = await this.getStatus()

    return status
  }
}
