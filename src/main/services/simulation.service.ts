import type { SimulationRunInput, SimulationRunResult } from '../../shared/simulation-types'
import { OutputListener, rManager } from '../runtime/r-manager'

const BATSS_INPUT_ENV = 'ALBATROSS_BATSS_INPUT'

export class SimulationService {
  private readonly r = rManager

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
    const alternative = input.decisionRules[0]?.direction ?? 'greater'

    let family = ''
    let link = ''
    let varY = ''

    switch (input.outcomeType) {
      case 'binary':
        family = 'binomial'
        link = 'logit'
        varY = 'rbinom'
        break
      case 'continuous':
        family = 'gaussian'
        link = 'identity'
        varY = 'rnorm'
        break
      case 'ordinal':
        family = 'binomial'
        link = 'logit'
        varY = 'rbinom'
        break
      default:
        family = 'binomial'
        link = 'logit'
        varY = 'rbinom'
        break
    }

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

      input <- jsonlite::fromJSON(Sys.getenv("${BATSS_INPUT_ENV}"), simplifyVector = FALSE)

      varY <- switch(
        input$varY,
        rbinom = rbinom,
        rnorm = rnorm,
        stop("Unsupported outcome distribution")
      )

      rule <- input$decisionRules[[1]]

      b <- rule$threshold

      if(input$outcomeType == 'binary') {
        varControl <- list(y = list(size = 1))
        beta <- c(logit(input$probability), log(input$treatmentEffect))
        delta.eff <- log(rule$margin)
      } else if(input$outcomeType == 'continuous') {
        varControl <- list(y = list(sd = input$sd))
        beta <- c(input$meanOutcome, input$meanDiff)
        delta.eff <- 0
      }

      trials <- batss.glm(
        model = y ~ group,
        family = input$family,
        link = input$link,
        var = list(y = varY, group = alloc.balanced),
        var.control = varControl,
        prob0 = c(Control = 1, Experimental = 1),
        alternative = input$alternative,
        beta = beta,
        which = 2,
        eff.arm = eff.arm.simple,
        eff.arm.control = list(b = b),
        delta.eff = delta.eff,
        fut.arm = NULL,
        N = input$N,
        interim = list(recruited = list(m0 = input$m0, m = input$m)),
        R = input$R,
        extended = 2,
        computation = 'parallel'
      )

      summary1 <- summary(trials)

      df <- rbind(
        data.frame(
          Scenario = "Null Effect",
          Outcome = summary1$H0$scenario$groupExperimental,
          Proportion = summary1$H0$scenario$overall
        ),
        data.frame(
          Scenario = "Target Effect",
          Outcome = summary1$H1$scenario$groupExperimental,
          Proportion = summary1$H1$scenario$overall
        )
      )

      df$Outcome <- factor(
        df$Outcome,
        levels = c(0, 1),
        labels = c("Inconclusive", "Experimental Superior")
      )


      # reshape to frontend table:
      # Outcome | Null Effect proportions | Target Effect proportions

      wide <- reshape(
        df,
        idvar = "Outcome",
        timevar = "Scenario",
        direction = "wide"
      )

      names(wide) <- c(
        "Outcome",
        "Null Effect",
        "Target Effect"
      )


      result <- list(
        status = "success",
        package = as.character(packageVersion("BATSS")),
        table = wide,
        chart = df,
        sampleSize = list(
          H0 = list(
            control = trials$H0$sample$Control,
            experimental = trials$H0$sample$Experimental
          ),
          H1 = list(
            control = trials$H1$sample$Control,
            experimental = trials$H1$sample$Experimental
          )
        )
      )

      cat(jsonlite::toJSON(result, auto_unbox = TRUE, force = TRUE, null = "null"))
    `

    try {
      const output = await this.r.execute(
        script,
        { [BATSS_INPUT_ENV]: JSON.stringify({ ...input, alternative, family, link, varY }) },
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
