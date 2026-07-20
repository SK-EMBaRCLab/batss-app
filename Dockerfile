FROM ubuntu:24.04

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive


# --- Node.js 22 via NodeSource ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

# --- Current R via CRAN's own Ubuntu apt repo (not Debian's stale one) ---
# Only the CRAN R repo is added here, not the full r2u binary-package
# repo — this image intentionally does NOT provide precompiled R
# packages. install.packages() inside the app will compile from source,
# same as before, just now against a current R and with the system
# libraries below actually present.
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates gnupg \
  && wget -q -O- https://cloud.r-project.org/bin/linux/ubuntu/marutter_pubkey.asc \
    | tee -a /etc/apt/trusted.gpg.d/cran_ubuntu_key.asc \
  && echo "deb [arch=amd64] https://cloud.r-project.org/bin/linux/ubuntu noble-cran40/" \
    > /etc/apt/sources.list.d/cran_r.list \
  && apt-get update -qq \
  && apt-get install -y --no-install-recommends r-base-core \
  && rm -rf /var/lib/apt/lists/*

# --- Build tools + system libraries that sf/s2/fmesher/INLA need to
# compile at runtime (this is the actual fix for the earlier failures:
# missing cmake/Abseil for s2, missing GDAL/GEOS/PROJ for sf) ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gfortran \
    cmake \
    pkg-config \
    libabsl-dev \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    libsqlite3-dev \
    libudunits2-dev \
  && rm -rf /var/lib/apt/lists/*

# Electron runtime libraries (unchanged from before)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2t64 \
    libgbm1 \
    libxshmfence1 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libx11-xcb1 \
    libgl1 \
    libgl1-mesa-dri \
    libglx-mesa0 \
    libegl1 \
    mesa-vulkan-drivers \
    mesa-utils \
    xdg-utils \
    git \
    nano \
  && rm -rf /var/lib/apt/lists/*

COPY --chown=ubuntu:ubuntu package*.json ./
COPY --chown=ubuntu:ubuntu . .

RUN chown -R ubuntu:ubuntu /app

USER ubuntu

CMD ["bash"]
