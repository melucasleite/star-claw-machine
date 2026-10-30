// Interference checks for the winch: each case should export an empty object.
// Flush mounting faces back off 0.01 mm so a shared face is not reported.
include <winch.scad>
part = "none";
check = "base_spool";
if (check == "base_spool") intersection() { base(); translate([spool_x0, 0, axis_z]) spool(); }
if (check == "base_n20") intersection() { base(); translate([-0.01, 0, 0]) n20_dummy(); }
if (check == "base_switch") intersection() { base(); translate([-0.01, 0, 0]) switch_dummy(false); }
if (check == "spool_switch") intersection() { translate([spool_x0, 0, axis_z]) spool(); switch_dummy(false); }
