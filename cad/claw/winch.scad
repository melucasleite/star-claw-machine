// START CLAW: drop winch for the carriage box.
// N20 gearmotor with a Hall encoder turns a flanged spool; the far end of the spool runs in a 683ZZ bearing.
// The cable drops past a guide hole and a KW12-3 roller switch to an exit hole through the box floor.
// The claw's weight pulls the cable straight and holds the switch closed; when the claw lands, the cable
// goes slack, the switch lever pushes it sideways and opens, and the drop stops.
// Every dimension marked MEASURE is a listing or datasheet guess until the part is in hand.
// Coordinates: z = 0 on the box floor (top of the 6 mm ply), spool axis along x.
// Printed in ASA on an H2D; supports allowed under the bearing pocket and the guide arm.

part = "assembly"; // assembly | base | spool | print_plate
$fn = 96;

// ---------- bought parts ----------
// N20 6 V 100 rpm with Hall encoder (7 PPR on the motor shaft, about 1:150; e.g. GA12-N20 listings).
n20_w = 12; // MEASURE gearbox width
n20_h = 10; // MEASURE gearbox height (the flats)
n20_gear_l = 9; // MEASURE gearbox length
n20_motor_l = 15; // MEASURE motor can length
n20_enc = [6, 18.5, 12]; // MEASURE encoder board and magnet, along x, y, z
n20_boss = [4, 0.8]; // MEASURE bearing boss on the gearbox face, d and height
n20_holes = 9; // MEASURE M1.6 tapped holes in the gearbox face, centre to centre (across the 12 mm side)
shaft_d = 3; // D-shaft
shaft_flat = 2.5; // MEASURE across the flat
shaft_l = 10; // MEASURE from the gearbox face
brg = [3, 7, 3]; // 683ZZ bore, OD, width
// KW12-3 roller lever micro switch (20 x 10.5 x 6.5, 2 mm holes 9.5 apart).
sw = [6.5, 10.5, 20]; // MEASURE thickness (x), width (y), length (z)
sw_holes = 9.5; // MEASURE
sw_roller = [4.8, 3]; // MEASURE roller diameter, width

// ---------- fit (ASA) ----------
clr = 0.3;
gap = 0.6;

// ---------- spool ----------
core_d = 12; // from docs/hardware.md
core_w = 8; // 8 turns a layer of 1 mm cable: 1.2 m fits in 3 layers, 1.6 m in 4
flange_d = 32;
flange_t = 2;
bore_depth = 6;
anchor_d = 1.5; // cable anchor hole across the core
stub = [4, 3.6]; // boss on the far end that bears on the 683 inner race

// ---------- base ----------
base_t = 4;
axis_z = 62; // spool axis above the floor
wall_t = 3; // motor face wall
tower_t = 5;
guide_z = 40; // guide hole the cable passes before the switch
roller_z = 20; // where the switch roller meets the cable
slack_push = 2; // how far the free roller pushes a slack cable sideways; slots give +-2
cable_y = -(core_d / 2 + 1.5); // the cable's line, mid layer
base_x = [-44, 26];
base_y = [-30, 18];
base_screw = 3.4; // M3 through the box floor, nuts underneath
exit_d = 3; // exit hole in the base; drill the ply floor 8 mm so the cable never touches wood

// ---------- derived ----------
spool_x0 = gap; // spool's motor-side face
spool_mid = spool_x0 + flange_t + core_w / 2;
spool_x1 = spool_x0 + 2 * flange_t + core_w;
tower_x0 = spool_x1 + stub[1];
sw_x = spool_mid - sw[0] / 2; // the roller sits in line with the cable
sw_y1 = cable_y + slack_push - sw_roller[0] - 1.5; // switch body edge on the roller side

echo(spool_axis = axis_z, spool_width = spool_x1 - spool_x0, tower_face = tower_x0, cable_y = cable_y);

// ---------- parts ----------

module spool() {
  // Motor-side face at x = 0, axis along x.
  difference() {
    rotate([0, 90, 0]) union() {
        cylinder(d = flange_d, h = flange_t);
        cylinder(d = core_d, h = 2 * flange_t + core_w);
        translate([0, 0, 2 * flange_t + core_w - flange_t]) cylinder(d = flange_d, h = flange_t);
        translate([0, 0, 2 * flange_t + core_w]) cylinder(d = stub[0], h = stub[1]);
      }
    // D-bore for the gearmotor shaft.
    translate([-1, 0, 0]) rotate([0, 90, 0]) intersection() {
          cylinder(d = shaft_d + clr / 2, h = bore_depth + 1);
          translate([-(shaft_d + 1) / 2, -(shaft_d + 1) / 2 + (shaft_d - shaft_flat) - clr / 4, 0])
            cube([shaft_d + 1, shaft_d + 1, bore_depth + 1]);
        }
    // M3 pilot from the bearing end.
    translate([2 * flange_t + core_w + stub[1] + 1, 0, 0]) rotate([0, -90, 0]) cylinder(d = 2.5, h = 7);
    // Cable anchor: thread across the core and knot.
    translate([flange_t + core_w - 1.5, 0, 0]) rotate([90, 0, 0]) cylinder(d = anchor_d, h = core_d + 2, center = true);
  }
}

module base() {
  difference() {
    union() {
      // Floor plate.
      translate([base_x[0], base_y[0], -base_t]) cube([base_x[1] - base_x[0], base_y[1] - base_y[0], base_t]);
      // Motor face wall.
      translate([-wall_t, -16, 0]) cube([wall_t, 32, axis_z + 10]);
      // Motor cradle under the gearbox and can; zip-tie it down.
      translate([-wall_t - n20_gear_l - n20_motor_l, -n20_w / 2 - 3, 0])
        cube([n20_gear_l + n20_motor_l, n20_w + 6, axis_z - n20_h / 2]);
      // Bearing tower.
      translate([tower_x0, -16, 0]) cube([tower_t, 32, axis_z + 10]);
      // Guide arm from the tower, over the cable line.
      translate([wall_t / 2 - 2, cable_y - 6, guide_z - 2]) cube([tower_x0 + tower_t - wall_t / 2 + 2, 10, 4]);
      // Switch plate behind the switch body.
      translate([sw_x + sw[0], -28, 0]) cube([tower_x0 - sw_x - sw[0], 16, roller_z + sw[2] / 2 + 4]);
      // Exit boss.
      translate([spool_mid, cable_y, 0]) cylinder(d = 10, h = 3);
    }
    // Gearbox boss, shaft and M1.6 screws through the wall.
    translate([-wall_t - 1, 0, axis_z]) rotate([0, 90, 0]) {
        cylinder(d = n20_boss[0] + 2 * clr, h = wall_t + 2);
        for (s = [-1, 1]) translate([0, s * n20_holes / 2, 0]) cylinder(d = 1.8, h = wall_t + 2);
      }
    // Gearbox and can pocket in the cradle.
    translate([-wall_t - n20_gear_l - n20_motor_l - 1, -n20_w / 2 - clr, axis_z - n20_h / 2 - clr])
      cube([n20_gear_l + n20_motor_l + 1 - 0.01, n20_w + 2 * clr, n20_h + 2 * clr]);
    // Zip-tie slots.
    for (x = [-wall_t - 6, -wall_t - n20_gear_l - n20_motor_l + 6]) translate([x - 2, -20, axis_z - n20_h / 2 - 4])
        cube([4, 40, 2]);
    // Bearing: a lip on the spool side (the stub passes it), the pocket open on the outside.
    translate([tower_x0 - 1, 0, axis_z]) rotate([0, 90, 0]) {
        cylinder(d = stub[0] + 1, h = tower_t + 2);
        translate([0, 0, 1 + tower_t - brg[2]]) cylinder(d = brg[1] + 0.1, h = brg[2] + 1);
      }
    // Guide hole, chamfered both sides.
    translate([spool_mid, cable_y, guide_z]) {
      cylinder(d = 2.5, h = 10, center = true);
      for (s = [-1, 1]) translate([0, 0, s * 2]) cylinder(d1 = s > 0 ? 2.5 : 5.5, d2 = s > 0 ? 5.5 : 2.5, h = 1.5, center = true);
    }
    // Switch screws, slotted so slack_push can be tuned by +-2.
    for (s = [-1, 1]) hull() for (dy = [-2, 2])
          translate([sw_x + sw[0] - 1, sw_y1 - sw[1] / 2 + dy, roller_z + s * sw_holes / 2]) rotate([0, 90, 0]) cylinder(d = 2.2, h = 30);
    // Exit hole.
    translate([spool_mid, cable_y, -base_t - 1]) {
      cylinder(d = exit_d, h = 10);
      translate([0, 0, base_t + 3 - 1.5 + 1]) cylinder(d1 = exit_d, d2 = exit_d + 3, h = 1.51);
      cylinder(d1 = exit_d + 3, d2 = exit_d, h = 2.5);
    }
    // Floor screws.
    for (x = [base_x[0] + 5, base_x[1] - 5], y = [base_y[0] + 5, base_y[1] - 5]) translate([x, y, -base_t - 1])
        cylinder(d = base_screw, h = base_t + 2);
  }
}

// ---------- bought-part stand-ins ----------

module n20_dummy() {
  color("silver") translate([-wall_t, 0, axis_z]) {
      translate([-n20_gear_l, -n20_w / 2, -n20_h / 2]) cube([n20_gear_l, n20_w, n20_h]);
      translate([-n20_gear_l - n20_motor_l, 0, 0]) rotate([0, 90, 0]) intersection() {
            cylinder(d = n20_w, h = n20_motor_l);
            translate([-n20_h / 2, -n20_w / 2, 0]) cube([n20_h, n20_w, n20_motor_l]);
          }
      rotate([0, 90, 0]) cylinder(d = shaft_d, h = shaft_l);
    }
  color("green") translate([-wall_t - n20_gear_l - n20_motor_l - n20_enc[0], -n20_enc[1] / 2, axis_z - n20_enc[2] / 2]) cube(n20_enc);
}

module switch_dummy(pressed) {
  // Body against the plate, lever along -z from the top, roller on the cable side.
  color("black") translate([sw_x, sw_y1 - sw[1], roller_z - sw[2] / 2]) cube(sw);
  color("silver") translate([spool_mid, sw_y1 + sw_roller[0] / 2 + 1.5 - (pressed ? slack_push : 0), roller_z]) rotate([0, 90, 0])
      cylinder(d = sw_roller[0], h = sw_roller[1], center = true);
}

module cable(slack) {
  pts = [[spool_mid, cable_y, axis_z], [spool_mid, cable_y, guide_z],
         [spool_mid, cable_y + (slack ? slack_push : 0), roller_z], [spool_mid, cable_y, 0], [spool_mid, cable_y, -60]];
  color("orange") for (i = [0:len(pts) - 2]) hull() {
        translate(pts[i]) sphere(d = 1);
        translate(pts[i + 1]) sphere(d = 1);
      }
}

// ---------- layouts ----------

module assembly() {
  color("burlywood") base();
  color("goldenrod") translate([spool_x0, 0, axis_z]) spool();
  color("lightgray") translate([tower_x0 + tower_t - brg[2], 0, axis_z]) rotate([0, 90, 0]) difference() {
        cylinder(d = brg[1], h = brg[2]);
        translate([0, 0, -1]) cylinder(d = brg[0], h = brg[2] + 2);
      }
  n20_dummy();
  switch_dummy(true);
  cable(false);
  // The 6 mm ply floor of the carriage box.
  color("tan", 0.4) translate([base_x[0] - 10, base_y[0] - 10, -6 - base_t]) cube([base_x[1] - base_x[0] + 20, base_y[1] - base_y[0] + 20, 6]);
}

module print_plate() {
  translate([0, 0, base_t]) base();
  translate([60, 0, 0]) rotate([0, -90, 0]) spool(); // motor-side flange down
}

if (part == "assembly") assembly();
else if (part == "base") translate([0, 0, base_t]) base();
else if (part == "spool") rotate([0, -90, 0]) spool();
else if (part == "print_plate") print_plate();

// Section through the cable line, looking from +x, for checking the guide, roller and exit.
if (part == "section") intersection() {
    assembly();
    translate([-200, -100, -100]) cube([200 + spool_mid, 200, 300]);
  }
