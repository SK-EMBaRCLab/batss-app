import { OutputListener, RManager } from '../runtime/r-manager'
import type { SimulationRunInput, SimulationRunResult } from '../../shared/simulation-types'

const BATSS_INPUT_ENV = 'ALBATROSS_BATSS_INPUT'

export class SimulationService {
  private readonly r = new RManager()

  /**
   * Runs the 2-arm binomial BATSS design (batss.glm with rbinom /
   * alloc.balanced / eff.arm.simple) using parameters supplied by the
   * frontend form, rather than the hardcoded normal-outcome demo used
   * previously.
   *
   * Parameters are passed into R as a single JSON blob via an
   * environment variable and decoded with jsonlite::fromJSON — same
   * reasoning as everywhere else in this codebase: never interpolate
   * externally-sourced values into R source text. jsonlite is safe to
   * rely on here (unlike in PackageManager.getStatus) because this only
   * ever runs after the runtime bootstrap has confirmed it's installed.
   *
   * `onOutput`, if provided, receives each line of R/INLA output as it
   * streams, so the caller can forward it to the GUI live.
   */
  async runExample(
    input: SimulationRunInput,
    onOutput?: OutputListener
  ): Promise<SimulationRunResult> {
    const alternative = input.primaryOutcome === 'A' ? 'greater' : 'less'

    const script = `
      library(BATSS)
      library(INLA)

      # Fix: INLA's automatic thread-count detection frequently
      # misreads what's actually available inside a container (cgroup
      # CPU limits vs. /proc/cpuinfo), which is one of the most common
      # causes of "the inla-program exited with an error" with no
      # further detail. Forcing a single thread sidesteps that whole
      # class of failure.
      # Docker only
      if (file.exists("/.dockerenv")) {
        inla.setOption(num.threads = "1:1")
      }

      # logit is a helper function
      logit <- function(p) { log(p / (1 - p)) }

      input <- jsonlite::fromJSON(Sys.getenv("${BATSS_INPUT_ENV}"))


      trials <- batss.glm(
        model = y ~ group,
        family = "binomial",
        link = "logit",
        var = list(y = rbinom, group = alloc.balanced),
        var.control = list(y = list(size = 1)),
        prob0 = c(A = 1, B = 1),
        alternative = input$alternative,
        beta = c(logit(input$probability), input$logOdds),
        which = 2,
        eff.arm = eff.arm.simple,
        eff.arm.control = list(b = input$b),
        delta.eff = input$deltaEff,
        fut.arm = NULL,
        N = input$N,
        interim = list(recruited = list(m0 = input$m0, m = input$m)),
        R = input$R,
        extended = 2,
        computation = 'serial'
      )

      summary1 <- summary(trials)

      df <- rbind(
        data.frame(
          Scenario = "H0",
          Outcome = summary1$H0$scenario$groupB,
          Proportion = summary1$H0$scenario$overall
        ),
        data.frame(
          Scenario = "H1",
          Outcome = summary1$H1$scenario$groupB,
          Proportion = summary1$H1$scenario$overall
        )
      )

      df$Outcome <- factor(
        df$Outcome,
        levels = c(0, 1),
        labels = c("Inconclusive", "B Superior")
      )


      # reshape to frontend table:
      # Outcome | H0 proportions | H1 proportions

      wide <- reshape(
        df,
        idvar = "Outcome",
        timevar = "Scenario",
        direction = "wide"
      )

      names(wide) <- c(
        "Outcome",
        "H0",
        "H1"
      )


      result <- list(
        status = "success",
        package = as.character(packageVersion("BATSS")),
        table = wide,
        chart = df
      )

      cat(jsonlite::toJSON(result, auto_unbox = TRUE, force = TRUE, null = "null"))
    `

    try {
      const output = await this.r.execute(
        script,
        { [BATSS_INPUT_ENV]: JSON.stringify({ ...input, alternative }) },
        onOutput
      )

      return JSON.parse(output) as SimulationRunResult
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Simulation run failed'
      }
    }
  }
}
