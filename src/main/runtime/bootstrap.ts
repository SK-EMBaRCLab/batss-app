// src/main/runtime/bootstrap.ts

import { PackageManager } from './package-manager'
import { RuntimeReporter } from './reporter'
import { RManager } from './r-manager'
import type { RuntimeResult } from './types'

export async function bootstrapRuntime(reporter: RuntimeReporter): Promise<RuntimeResult> {
  const r = new RManager()

  try {
    reporter.checking('Checking R installation', 10)

    const installed = await r.isInstalled()

    if (!installed) {
      reporter.error('R is not installed')

      throw new Error('R is required')
    }

    const packages = new PackageManager(r, reporter)

    reporter.checking('Checking required packages', 25)

    await packages.ensurePackages()

    reporter.checking('Collecting package information', 90)

    const status = await packages.getStatus()

    reporter.ready()

    return {
      ready: status.every((pkg) => pkg.installed),
      r: true,
      packages: status
    }
  } catch (error) {
    if (error instanceof Error) {
      reporter.error(error.message)
    } else {
      reporter.error('Runtime initialization failed')
    }

    throw error
  }
}
