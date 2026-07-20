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

        installed <- installed.packages()

        result <- sapply(
          packages,
          function(pkg) {

            if (pkg %in% rownames(installed)) {

              as.character(
                installed[pkg, "Version"]
              )

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

    return output
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [name, version] = line.split(':')

        return {
          name,
          installed: version !== 'NA',
          version: version === 'NA' ? undefined : version
        }
      })
  }

  async checkPackages(): Promise<string[]> {
    const status = await this.getStatus()

    return status.filter((pkg) => !pkg.installed).map((pkg) => pkg.name)
  }

  async installPackages(packages: string[]): Promise<void> {
    const total = packages.length
    const defaultRepo = 'https://cloud.r-project.org'

    for (const [index, pkg] of packages.entries()) {
      const progress = 40 + Math.round(((index + 1) / total) * 50)

      this.reporter.installing(`Installing ${pkg}`, progress)

      const extraRepo = PACKAGE_REPOS[pkg]
      const repos = extraRepo ? [defaultRepo, extraRepo] : [defaultRepo]

      await this.r.execute(
        `
          pkg <- Sys.getenv("${PACKAGE_NAME_ENV}")
          repos <- strsplit(Sys.getenv("${PACKAGE_REPOS_ENV}"), ",")[[1]]

          install_lib <- .libPaths()[1]

          if (!requireNamespace(pkg, quietly = TRUE, lib.loc = install_lib)) {

            install.packages(
              pkg,
              repos = repos,
              lib = install_lib,
              dependencies = NA
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

    if (missing.length > 0) {
      await this.installPackages(missing)
    }

    const status = await this.getStatus()

    return status
  }
}
