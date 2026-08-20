// src/main/runtime/package-manager.ts

import { RManager } from './r-manager'
import { PACKAGE_REPOS, REQUIRED_R_PACKAGES } from './r-packages'
import { RuntimeReporter } from './reporter'
import type { RuntimePackage } from './types'

const PACKAGES_ENV = 'ALBATROSS_R_PACKAGES'
const PACKAGE_NAME_ENV = 'ALBATROSS_R_PACKAGE_NAME'
const PACKAGE_REPOS_ENV = 'ALBATROSS_R_PACKAGE_REPOS'
const PACKAGE_REPO_MAP_ENV = 'ALBATROSS_R_PACKAGE_REPO_MAP'

export class PackageManager {
  constructor(
    private readonly r: RManager,
    private readonly reporter: RuntimeReporter
  ) {}

  private getRepositories(pkg: string): string[] {
    const defaultRepo = 'https://cloud.r-project.org'
    const extraRepo = PACKAGE_REPOS[pkg]

    return extraRepo ? [defaultRepo, extraRepo] : [defaultRepo]
  }

  async getStatus(): Promise<RuntimePackage[]> {
    const packageRepoMap = REQUIRED_R_PACKAGES.map((pkg) => {
      const repo = PACKAGE_REPOS[pkg] ?? 'https://cloud.r-project.org'

      return `${pkg}=${repo}`
    }).join(';')

    const output = await this.r.execute(
      `
      packages <- strsplit(
        Sys.getenv("${PACKAGES_ENV}"),
        ","
      )[[1]]

      repo_entries <- strsplit(
        Sys.getenv("${PACKAGE_REPO_MAP_ENV}"),
        ";"
      )[[1]]

      package_repos <- list()

      for (entry in repo_entries) {
        parts <- strsplit(entry, "=", fixed = TRUE)[[1]]

        package_repos[[parts[1]]] <- parts[2]
      }

      install_lib <- .libPaths()[1]

      installed <- installed.packages(
        lib.loc = install_lib
      )

      unique_repos <- unique(unlist(package_repos))

      available_by_repo <- list()

      for (repo in unique_repos) {
        available_by_repo[[repo]] <- available.packages(
          repos = repo
        )
      }

      for (pkg in packages) {
        is_installed <- pkg %in% rownames(installed)

        installed_version <- if (is_installed) {
          as.character(
            packageVersion(
              pkg,
              lib.loc = install_lib
            )
          )
        } else {
          NA_character_
        }

        repo <- package_repos[[pkg]]
        available <- available_by_repo[[repo]]

        latest_version <- if (pkg %in% rownames(available)) {
          as.character(
            available[pkg, "Version"]
          )
        } else {
          NA_character_
        }

        update_available <- FALSE

        if (
          !is.na(installed_version) &&
          !is.na(latest_version)
        ) {
          update_available <-
            package_version(latest_version) >
            package_version(installed_version)
        }

        writeLines(
          paste(
            pkg,
            is_installed,
            installed_version,
            latest_version,
            update_available,
            sep = ":"
          )
        )
      }
    `,
      {
        [PACKAGES_ENV]: REQUIRED_R_PACKAGES.join(','),
        [PACKAGE_REPO_MAP_ENV]: packageRepoMap
      }
    )

    return output
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [name, installedValue, rawVersion, rawLatestVersion, updateValue] = line.split(':')

        const installed = installedValue === 'TRUE'

        return {
          name: name.trim(),
          installed,
          version: installed && rawVersion !== 'NA' ? rawVersion.trim() : undefined,
          latestVersion: rawLatestVersion !== 'NA' ? rawLatestVersion.trim() : undefined,
          updateAvailable: updateValue === 'TRUE'
        }
      })
  }

  async checkPackages(): Promise<string[]> {
    try {
      const status = await this.getStatus()

      this.reporter.log(
        status
          .map(
            (p) =>
              `${p.name}: installed=${p.installed}, ` +
              `version=${p.version ?? 'N/A'}, ` +
              `latest=${p.latestVersion ?? 'N/A'}, ` +
              `updateAvailable=${p.updateAvailable}`
          )
          .join('\n')
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

    for (const [index, pkg] of packages.entries()) {
      this.reporter.log(`Attempting ${pkg}`)

      const progress = 40 + Math.round(((index + 1) / total) * 50)

      this.reporter.installing(`Installing ${pkg}`, progress)

      const repos = this.getRepositories(pkg)

      await this.r.execute(
        `
      pkg <- Sys.getenv("${PACKAGE_NAME_ENV}")
      repos <- strsplit(Sys.getenv("${PACKAGE_REPOS_ENV}"), ",")[[1]]

      install_lib <- .libPaths()[1]

      pkg_type <- if (
        .Platform$OS.type == "windows" ||
        Sys.info()[["sysname"]] == "Darwin"
      ) {
        "binary"
      } else {
        "source"
      }

      if (!requireNamespace(
        pkg,
        quietly = TRUE,
        lib.loc = install_lib
      )) {
        install.packages(
          pkg,
          repos = repos,
          lib = install_lib,
          dependencies = c("Depends", "Imports"),
          type = pkg_type
        )
      }
    `,
        {
          [PACKAGE_NAME_ENV]: pkg,
          [PACKAGE_REPOS_ENV]: repos.join(',')
        },
        (line) => this.reporter.log(line)
      )
    }
  }
  async updatePackages(packages: string[]): Promise<void> {
    this.reporter.log(`Updating ${packages.length} package(s)`)

    const total = packages.length

    for (const [index, pkg] of packages.entries()) {
      this.reporter.log(`Updating ${pkg}`)

      const progress = 40 + Math.round(((index + 1) / total) * 50)

      this.reporter.installing(`Updating ${pkg}`, progress)

      const repos = this.getRepositories(pkg)

      await this.r.execute(
        `
        pkg <- Sys.getenv("${PACKAGE_NAME_ENV}")
        repos <- strsplit(
          Sys.getenv("${PACKAGE_REPOS_ENV}"),
          ","
        )[[1]]

        install_lib <- .libPaths()[1]

        pkg_type <- if (
          .Platform$OS.type == "windows" ||
          Sys.info()[["sysname"]] == "Darwin"
        ) {
          "binary"
        } else {
          "source"
        }

        install.packages(
          pkg,
          repos = repos,
          lib = install_lib,
          dependencies = c("Depends", "Imports"),
          type = pkg_type
        )
      `,
        {
          [PACKAGE_NAME_ENV]: pkg,
          [PACKAGE_REPOS_ENV]: repos.join(',')
        },
        (line) => this.reporter.log(line)
      )
    }
  }

  async updateAvailablePackages(): Promise<RuntimePackage[]> {
    const status = await this.getStatus()

    return status.filter((pkg) => pkg.updateAvailable)
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
