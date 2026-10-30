#!/bin/sh
# Previews and STLs for the claw and the winch. Re-run after any change to a .scad and look at the PNGs.
# Interference checks are separate: ./check.sh (claw) and the winch_checks.scad cases.
set -e
cd "$(dirname "$0")"
SCAD=${OPENSCAD:-/Applications/OpenSCAD-2021.01.app/Contents/MacOS/OpenSCAD}
mkdir -p out stl
rm -f stl/cap.stl

$SCAD -o out/open.png -D 'part="assembly"' -D close=0 --camera=0,10,30,65,0,30,560 --imgsize=1000,1200 --projection=p --colorscheme=Tomorrow claw.scad
$SCAD -o out/closed.png -D 'part="assembly"' -D close=1 --camera=0,10,30,65,0,30,560 --imgsize=1000,1200 --projection=p --colorscheme=Tomorrow claw.scad
$SCAD -o out/side-open.png -D 'part="assembly"' -D close=0 --camera=0,10,30,90,0,0,520 --imgsize=1000,1200 --projection=o --colorscheme=Tomorrow claw.scad
$SCAD -o out/side-closed.png -D 'part="assembly"' -D close=1 --camera=0,10,30,90,0,0,520 --imgsize=1000,1200 --projection=o --colorscheme=Tomorrow claw.scad
$SCAD -o out/plate.png -D 'part="print_plate"' --camera=0,60,30,50,0,20,600 --imgsize=1200,1000 --projection=p --colorscheme=Tomorrow claw.scad
$SCAD -o out/winch.png -D 'part="assembly"' --camera=-5,-5,35,60,0,-50,330 --imgsize=1200,1100 --projection=p --colorscheme=Tomorrow winch.scad
$SCAD -o out/winch-section.png -D 'part="section"' --camera=0,-5,30,90,0,90,200 --imgsize=1000,1100 --projection=o --colorscheme=Tomorrow winch.scad

for p in frame spider prong link pushrod; do
  $SCAD -o stl/$p.stl -D "part=\"$p\"" claw.scad
done
for p in base spool; do
  $SCAD -o stl/winch-$p.stl -D "part=\"$p\"" winch.scad
done
