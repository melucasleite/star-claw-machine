#!/bin/sh
# Runs every interference case in checks.scad open, half and nearly closed. "clear" means an empty intersection.
cd "$(dirname "$0")"
SCAD=${OPENSCAD:-/Applications/OpenSCAD-2021.01.app/Contents/MacOS/OpenSCAD}
TMP=${TMPDIR:-/tmp}/claw-check.stl
for ch in frame_prong prong_prong frame_spider frame_rod rod_spider links_spider frame_servo rod_servo; do
  for c in 0 0.5 0.9375; do
    if $SCAD -o "$TMP" -D "check=\"$ch\"" -D c=$c checks.scad 2>&1 | grep -q "empty"; then r=clear; else r=HIT; fi
    echo "$ch c=$c $r"
  done
done
rm -f "$TMP"
