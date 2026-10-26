import { withReference } from '../../shared/error-reference'
import { recordError } from '../services/error-log.service'
import { PackageManager } from './package-manager'
import { rManager } from './r-manager'
import { RuntimeReporter } from './reporter'
import type { RuntimeResult } from './types'

// A setup failure whose message is written for users (R missing). Any
// other error is unexpected: users see a generic message with a reference,
// and the details go to the error log.
class RuntimeSetupError extends Error {}

function reportFailure(reporter: RuntimeReporter, error: unknown, context: string): void {
  if (error instanceof RuntimeSetupError) {
    reporter.error(error.message)
    return
  }

  const reference = recordError(context, error)
  reporter.error(withReference('Setting up R failed unexpectedly.', reference))
}

export async function bootstrapRuntime(reporter: RuntimeReporter): Promise<RuntimeResult> {
  const r = rManager

  try {
    reporter.checking('Checking R installation', 10)

    const installed = await r.isInstalled()

    if (!installed) {
      throw new RuntimeSetupError('R is not installed')
    }

    const packages = new PackageManager(r, reporter)

    reporter.checking('Checking required packages', 25)

    const status = await packages.ensurePackages()

    reporter.ready()

    return {
      ready: status.every((pkg) => pkg.installed),
      r: true,
      packages: status
    }
  } catch (error) {
    reportFailure(reporter, error, 'runtime check')
    throw error
  }
}

export async function updateRuntime(
  packageNames: string[],
  reporter: RuntimeReporter
): Promise<RuntimeResult> {
  const r = rManager

  try {
    reporter.checking('Checking R installation', 10)

    const installed = await r.isInstalled()

    if (!installed) {
      throw new RuntimeSetupError('R is not installed')
    }

    const packages = new PackageManager(r, reporter)

    reporter.checking('Checking package updates', 25)

    const status = await packages.getStatus()

    const packagesToUpdate = status
      .filter((pkg) => packageNames.includes(pkg.name))
      .filter((pkg) => pkg.updateAvailable)

    if (packagesToUpdate.length === 0) {
      reporter.ready()

      return {
        ready: status.every((pkg) => pkg.installed),
        r: true,
        packages: status
      }
    }

    reporter.checking(`Updating ${packagesToUpdate.length} package(s)`, 30)

    await packages.updatePackages(packagesToUpdate.map((pkg) => pkg.name))

    reporter.checking('Collecting package information', 90)

    const updatedStatus = await packages.getStatus()

    reporter.ready()

    return {
      ready: updatedStatus.every((pkg) => pkg.installed),
      r: true,
      packages: updatedStatus
    }
  } catch (error) {
    reportFailure(reporter, error, 'runtime update')
    throw error
  }
}
