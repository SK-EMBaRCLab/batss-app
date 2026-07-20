#install.packages('BATSS')
library(BATSS)

# logit is a helper function
logit = function(p){log(p/(1 - p))}

trials <- batss.glm(
  model = y~group, # Fixed argument
  var = list(y=rbinom, group=alloc.balanced), # Fixed argument
  var.control = list(y=list(size=1)), # Fixed argument
  prob0 = c(A=1, B=1), # Fixed argument (Default to even randomization)
  alternative = "greater", # lesser if negative outcome (Q1B)
  beta=c(logit(0.4), 0), # adjust 0.4 to proportion in Q2
  which=2, # Fixed argument (for 2 arm trial)
  eff.arm = eff.arm.simple,
  eff.arm.control = list(b = 0.95), # Adjust b per Q3
  delta.eff = 0, # Adjust delta.eff per Q3
  fut.arm = NULL,
  N=216, # Adjust based on Q4 input
  interim=list(recruited=list(m0=60, m=12)), # Adjust based on Q5/6
  R = 3, # User enters input for Q7
  extended=1 # Fixed argument, for now...
 )
