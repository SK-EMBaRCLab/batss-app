#install.packages('BATSS')
library(BATSS)
library(ggplot2)

trials1 <- batss.glm(
  model = y~group, 
  family          = "gaussian", # Updated
  link            = "identity", # Updated
  var = list(y=rnorm, group=alloc.balanced), # Updated
  var.control = list(y=list(sd=1)), # Updated
  prob0 = c(Control=1, Experimental=1), 
  alternative = "greater", 
  beta=c(5, 5), # Updated
  which=2, 
  eff.arm = eff.arm.simple,
  eff.arm.control = list(b = 0.95), 
  delta.eff = 0, 
  fut.arm = NULL,
  N=216, 
  interim=list(recruited=list(m0=60, m=12)), 
  R = 3,
  extended=2
)