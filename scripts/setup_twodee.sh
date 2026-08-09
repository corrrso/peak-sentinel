#!/usr/bin/env bash
# Download and build TWODEE-2.3 into third_party/.
# Requires: gfortran plus the C and Fortran netCDF libraries.
#   Debian/Ubuntu: sudo apt-get install gfortran libnetcdff-dev
#   macOS:         brew install gcc netcdf-fortran
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
# Homebrew keeps netcdf and netcdf-fortran in separate prefixes, so the
# configure default of one lib directory cannot find both -lnetcdff and
# -lnetcdf. Pass the flags each config tool reports instead.
NC_INC="$(nf-config --fflags)" \
NC_LIB="$(nf-config --flibs) $(nc-config --libs)" \
  ./configure -q
make -s
echo "TWODEE binary: $(pwd)/src/twodee"
