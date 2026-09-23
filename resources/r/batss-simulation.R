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
  computation = "parallel"
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
