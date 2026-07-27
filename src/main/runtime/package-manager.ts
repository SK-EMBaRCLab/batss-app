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

        for (pkg in packages) {
          found <- find.package(pkg, quiet = TRUE)

          if (length(found) > 0) {
            message(paste(pkg, "FOUND:", found))
          } else {
            message(paste(pkg, "MISSING"))
          }
        }

        installed <- installed.packages(lib.loc = .libPaths()[1])

        message("Libraries:")
        message(paste(.libPaths(), collapse="\n"))

        message("Required: ", paste(packages, collapse=","))

        result <- sapply(
          packages,
          function(pkg) {

            if (requireNamespace(pkg, quietly = TRUE, lib.loc = .libPaths()[1])) {
              as.character(packageVersion(pkg, lib.loc = .libPaths()[1]))
            } else {
              NA
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

    this.reporter.log(`STATUS RAW OUTPUT: ${JSON.stringify(output)}`)

    const parsed = output
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [name, version] = line.split(':')
        const installed = Boolean(version && version !== 'NA')

        return {
          name,
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

      console.log(`STATUS LENGTH: ${status.length}`)

      this.reporter.log(`STATUS LENGTH: ${status.length}`)
      this.reporter.log(JSON.stringify(status))

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

          message("ENTERED INSTALL SCRIPT\n")
          message("pkg=", pkg, "\n", sep="")
          message("lib=", install_lib, "\n", sep="")
          message("requireNamespace=",
              requireNamespace(pkg, quietly = TRUE, lib.loc = install_lib),
              "\n", sep="")

          # On Windows/macOS, prefer precompiled binaries even when a
          # newer source release exists — this repo's binaries commonly
          # lag its source releases, and letting install.packages()
          # fall back to "both" (its Windows/mac default) means it will
          # try to compile INLA from source, which reliably fails with
          # errors like "cp: unknown option -- )" regardless of whether
          # Rtools is installed correctly. Linux has no binary repo for
          # these packages at all, so it must keep compiling from source
          # there, same as before.
          pkg_type <- if (.Platform$OS.type == "windows" || Sys.info()[["sysname"]] == "Darwin") {
            "binary"
          } else {
            "source"
          }

          message("lib:", install_lib, "\n")
          message("available:", requireNamespace(pkg, quietly = TRUE, lib.loc = install_lib), "\n")
          message("all libs:", paste(.libPaths(), collapse = "\n"), "\n")

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
