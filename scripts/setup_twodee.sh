#!/usr/bin/env bash
# Download and build TWODEE-2.3 into third_party/.
# Requires: gfortran, libnetcdff-dev (Debian/Ubuntu: sudo apt-get install gfortran libnetcdff-dev)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p third_party
cd third_party
if [ ! -d twodee-2.3 ]; then
  curl -sL -o twodee-2.3.zip "https://digital.csic.es/bitstream/10261/241390/1/twodee-2.3.zip"
  unzip -q twodee-2.3.zip
  rm twodee-2.3.zip
fi
cd twodee-2.3
chmod +x configure autoconf/*
NETCDF_INC="$(nf-config --includedir)" NETCDF_LIB="$(nf-config --prefix)/lib" ./configure -q
make -s
echo "TWODEE binary: $(pwd)/src/twodee"
