# Must happen before `library(INLA)` — these are read by Intel MKL
# (and OpenMP/OpenBLAS, depending on the installed INLA binary variant)
# at load/first-use time, not re-read later. `inla.setOption(num.threads
# = "1:1")` below only constrains GMRFLib's own thread pool; it does
# NOT stop MKL's BLAS/LAPACK routines from spawning their own internal
# threads for dense linear algebra, which they do by default (typically
# one per logical core). Confirmed via `ps`: with only num.threads set,
# individual `inla.mkl` worker processes were observed using 150-460%
# CPU each, despite `-t1:1` being passed on their command line — i.e.
# every "single-threaded" BATSS worker was quietly multithreading
# anyway. With `mc.cores` workers already saturating the machine at the
# outer level, that's severe oversubscription on top of oversubscription.
Sys.setenv(
  MKL_NUM_THREADS = "1",
  OMP_NUM_THREADS = "1",
  OPENBLAS_NUM_THREADS = "1"
)

library(BATSS)
library(INLA)

Sys.setenv(R_LIBS_USER = Sys.getenv("R_LIBS_USER"))

# Belt-and-suspenders alongside the env vars above: constrains
# GMRFLib's own outer/inner thread pool (see the main project
# discussion for what these control) to 1 thread per worker process, on
# top of the BLAS-level limits already set.
inla.setOption(num.threads = "1:1")

# logit is a helper function
logit <- function(p) {
  log(p / (1 - p))
}

input <- jsonlite::fromJSON(
  Sys.getenv("ALBATROSS_BATSS_INPUT"),
  simplifyVector = FALSE
)

varY <- switch(
  input$varY,
  rbinom = rbinom,
  rnorm = rnorm,
  stop("Unsupported outcome distribution")
)

rule <- input$decisionRules[[1]]

b <- rule$threshold

if (input$outcomeType == "binary") {
  varControl <- list(y = list(size = 1))
  beta <- c(
    logit(input$probability),
    log(input$treatmentEffect)
  )
  delta.eff <- log(rule$margin)
} else if (input$outcomeType == "continuous") {
  varControl <- list(y = list(sd = input$sd))
  beta <- c(
    input$meanOutcome,
    input$meanDiff
  )
  delta.eff <- rule$margin
}

trials <- batss.glm(
  model = y ~ group,
  family = input$family,
  link = input$link,
  var = list(
    y = varY,
    group = alloc.balanced
  ),
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
  interim = list(
    recruited = list(
      m0 = input$m0,
      m = input$m
    )
  ),
  R = input$R,
  extended = 2,
  computation = "parallel",
  # Resolved from the "% of cores" advanced setting in the Electron
  # main process (which is the only side that knows the real core
  # count); 3 mirrors BATSS's own built-in default as a fallback for
  # older callers that don't send it.
  mc.cores = if (!is.null(input$cores)) input$cores else 3
)

summary1 <- summary(trials)

# With a small number of simulated trials (R), it's possible for every
# replicate under one scenario to land in the same outcome category by
# chance, leaving BATSS's summary() with no row at all for the other
# category. Left unchecked, that surfaces several lines further down
# as a cryptic "arguments imply differing number of rows" error from
# data.frame(). Catch it here and report something the user can act on.
validate_scenario <- function(scenario, label) {
  outcome <- scenario$groupExperimental
  proportion <- scenario$overall

  if (length(outcome) == 0 || length(proportion) == 0 || length(outcome) != length(proportion)) {
    return(paste0(
      "BATSS produced no usable results for the ", label, " scenario. ",
      "This can happen when the number of simulated trials (R) is very ",
      "small and, by chance, every simulated trial landed in the same ",
      "outcome category. Try increasing the number of simulated trials."
    ))
  }

  NULL
}

scenario_error <- validate_scenario(summary1$H0$scenario, "Null Effect")
if (is.null(scenario_error)) {
  scenario_error <- validate_scenario(summary1$H1$scenario, "Target Effect")
}

if (!is.null(scenario_error)) {
  writeLines(
    jsonlite::toJSON(
      list(status = "error", message = scenario_error),
      auto_unbox = TRUE
    ),
    Sys.getenv("ALBATROSS_BATSS_OUTPUT")
  )

  quit(save = "no", status = 0)
}

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

# Reshape to frontend table:
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

writeLines(
  jsonlite::toJSON(result, auto_unbox = TRUE, force = TRUE, null = "null"),
  Sys.getenv("ALBATROSS_BATSS_OUTPUT")
)
