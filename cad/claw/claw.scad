// START CLAW: three-prong claw driven by a standard-size servo (MG996R).
// The servo horn is a crank: a pushrod pulls the spider up, paired links lift each prong's lever, the prongs close.
// Grip is how hard the servo is driven past contact (current-limited in firmware, see README).
// Every dimension marked MEASURE is a listing or datasheet guess until the part is in hand.
// Coordinates: z = 0 on the prong pivot axes, +z up toward the gantry.
// Printed in ASA on an H2D; supports allowed on the frame only.

part = "assembly"; // assembly | frame | spider | prong | link | pushrod | print_plate
close = 0.0; // assembly only: 0 = open, 1 = full stroke
$fn = 96;

// ---------- bought parts ----------
// MG996R (Deegoo-FPV 4-pack, B07MFK266B). DS3218 shares the footprint but check its tab height.
servo_l = 40.7; // MEASURE body length (along the tabs)
servo_w = 19.7; // MEASURE body width
servo_h = 36.5; // MEASURE body height, case bottom to case top (no boss)
servo_boss = 6.4; // MEASURE case top to spline face
servo_shaft_off = 10.2; // MEASURE spline centre to the near end of the body
servo_tab_from_top = 9.5; // MEASURE case top to the tab face nearest the horn
servo_tab_t = 2.5; // MEASURE
servo_holes = [49.5, 10]; // MEASURE hole centres, along x along z
servo_screw = 3.4; // M3 through the tabs into nuts
horn_hub = 5; // MEASURE spline face to the horn arm's outer face
horn_arm_t = 2; // MEASURE
crank_r = 10; // MEASURE horn hole radius used as the crank pin; stroke = 2 * crank_r * sin(crank_half)
horn_pin = 2.3; // M2 screw through the horn hole into the pushrod
stroke = 8; // spider travel open to closed; the prong tips meet between 7.5 and 8 (checks.scad)
pin_d = 3; // M3 screws as pins, nylock nuts

// ---------- fit (ASA) ----------
clr = 0.3; // radial clearance on bores and pins
gap = 0.6; // side clearance between moving plates
pin_bore = pin_d + clr;

// ---------- linkage (checked in kinematics.py) ----------
rp = 30; // pivot radius
lever = 22; // pivot to link pin
lever_ang = 10; // lever angle above horizontal, open
rs = 12; // spider link-pin radius
link_len = 20; // link pin centres
prong_t = 6; // prong thickness (tangential)
link_t = 3; // each link of the pair
link_w = 7;
finger = [[0, 0], [8, -20], [12, -40], [12, -58], [8, -68], [2, -72]]; // prong centreline, local
finger_r = 4;

// ---------- frame ----------
cheek = 4; // clevis cheek thickness
ring_r = [34, 42]; // pivot ring inner, outer radius
ring_z = [8, 14];
post = [8, 6]; // radial x tangential
post_r = 37;
spider_h = 8;
spider_r = 16;
plate_t = 4;
wall_t = 5; // servo bracket wall
rod_t = 4; // pushrod thickness
rod_w = 7;
lug_h = 9; // spider centre pin height above the spider pin plane
eye_d = 5; // cable eye hole for the braided cable
eye_y = 10; // MEASURE eye offset toward the servo; hang the claw and move it until it hangs level
bail_t = 6;

// ---------- derived ----------
L0 = [-lever * cos(lever_ang), lever * sin(lever_ang)];
zs0 = L0[1] + sqrt(pow(link_len, 2) - pow(rs - (rp + L0[0]), 2)); // spider pin z, open
plate_z = zs0 + stroke + spider_h / 2 + lug_h + 3.5 + 1; // deck underside clears the closed lug
deck_top = plate_z + plate_t;
crank_half = asin(stroke / (2 * crank_r));
shaft_x = -crank_r * cos(crank_half); // crank pin sits on the axis at both ends of the stroke
shaft_z = deck_top + servo_w / 2 + 2;
rod_len = shaft_z - crank_r * sin(crank_half) - (zs0 + lug_h);
// Servo along +y from the horn: spline face, case top, tab, case bottom.
spline_y = rod_t / 2 + gap + horn_hub;
case_top_y = spline_y + servo_boss;
tab_y = case_top_y + servo_tab_from_top; // tab face against the wall
servo_cx = shaft_x - servo_shaft_off + servo_l / 2; // body centre in x
bail_top = shaft_z + servo_w / 2 + 6;

function rotp(p, th) = [p[0] * cos(th) + p[1] * sin(th), -p[0] * sin(th) + p[1] * cos(th)];
function lever_at(th) = rotp(L0, th);
function link_err(th, zs) = norm([rs - (rp + lever_at(th)[0]), zs - lever_at(th)[1]]) - link_len;
// Bisection for the prong angle that keeps the link length at a given spider pin height.
function prong_angle(zs, lo = -10, hi = 60, n = 30) =
  n == 0 ? (lo + hi) / 2
  : link_err((lo + hi) / 2, zs) > 0 ? prong_angle(zs, (lo + hi) / 2, hi, n - 1)
  : prong_angle(zs, lo, (lo + hi) / 2, n - 1);
function crank_pin(ph) = [shaft_x + crank_r * cos(ph), shaft_z + crank_r * sin(ph)];
function rod_err(ph, zs) = norm(crank_pin(ph) - [0, zs + lug_h]) - rod_len;
// Same again for the crank angle that keeps the pushrod length.
function crank_angle(zs, lo = -60, hi = 60, n = 30) =
  n == 0 ? (lo + hi) / 2
  : rod_err((lo + hi) / 2, zs) < 0 ? crank_angle(zs, (lo + hi) / 2, hi, n - 1)
  : crank_angle(zs, lo, (lo + hi) / 2, n - 1);

echo(spider_pin_open = zs0, deck = plate_z, servo_shaft_z = shaft_z, pushrod = rod_len, top = bail_top + bail_t);
echo(prong_closed_deg = prong_angle(zs0 + stroke));
echo(servo_open_deg = crank_angle(zs0), servo_closed_deg = crank_angle(zs0 + stroke));

// ---------- parts ----------

module prong() {
  // Lies in the x-z plane, pivot at the origin, thickness along y.
  rotate([90, 0, 0]) linear_extrude(prong_t, center = true) difference() {
        union() {
          hull() {
            circle(r = 6);
            translate(L0) circle(r = 4.5);
          }
          for (i = [0:len(finger) - 2]) hull() {
              translate(finger[i]) circle(r = finger_r);
              translate(finger[i + 1]) circle(r = finger_r);
            }
          // Grip teeth on the inner face of the tip.
          for (z = [-52, -60]) translate([8, z]) rotate(45) square(4, center = true);
        }
        circle(d = pin_bore);
        translate(L0) circle(d = pin_bore);
      }
}

module bar(len, t, w, d1, d2) {
  // Flat bar in the x-z plane, holes at the origin and at [len, 0], thickness along y.
  rotate([90, 0, 0]) linear_extrude(t, center = true) difference() {
        hull() {
          circle(d = w);
          translate([len, 0]) circle(d = w);
        }
        circle(d = d1);
        translate([len, 0]) circle(d = d2);
      }
}

module link() bar(link_len, link_t, link_w, pin_bore, pin_bore);

// Spider pin at the origin, crank pin at [0, rod_len] along +z.
module pushrod() rotate([0, -90, 0]) bar(rod_len, rod_t, rod_w, pin_bore, horn_pin);

module spider() {
  // Pin plane at z = 0.
  difference() {
    union() {
      cylinder(r = spider_r, h = spider_h, center = true);
      // Stop tabs ride the posts and land on their ledges when open.
      for (a = [60:120:300]) rotate(a) translate([0, -2.5, -spider_h / 2])
            cube([post_r - post[0] / 2 - gap, 5, spider_h]);
      // Centre clevis for the pushrod.
      for (s = [-1, 1]) translate([-5, s > 0 ? rod_t / 2 + gap / 2 : -rod_t / 2 - gap / 2 - 3, 0])
          cube([10, 3, lug_h + 4]);
    }
    // Pockets either side of each link lug, leaving a prong_t lug at rs.
    for (a = [0:120:240]) rotate(a) {
        for (s = [-1, 1]) translate([rs - 6, s * (prong_t / 2 + gap / 2) - (s < 0 ? link_t + gap : 0), -spider_h])
            cube([12, link_t + gap, 2 * spider_h]);
        translate([rs, 0, 0]) rotate([90, 0, 0]) cylinder(d = pin_bore, h = 30, center = true);
      }
    translate([0, 0, lug_h]) rotate([90, 0, 0]) cylinder(d = pin_bore, h = 20, center = true);
  }
}

module servo_window() {
  translate([servo_cx, 0, shaft_z]) {
    cube([servo_l + 2 * clr, 80, servo_w + 2 * clr], center = true);
    for (i = [-1, 1], j = [-1, 1]) translate([i * servo_holes[0] / 2, 0, j * servo_holes[1] / 2])
        rotate([90, 0, 0]) cylinder(d = servo_screw, h = 80, center = true);
  }
}

module frame() {
  cheek_y = prong_t / 2 + gap / 2;
  difference() {
    union() {
      // Deck.
      translate([0, 0, plate_z]) cylinder(r = ring_r[1], h = plate_t);
      // Servo bracket wall: the tabs bolt to its horn-side face.
      translate([servo_cx - 34, tab_y, plate_z]) cube([68, wall_t, shaft_z + servo_w / 2 + 6 - plate_z]);
      // Gussets clear the tab ends by 1.5 mm.
      for (x = [servo_cx - 34, servo_cx + 29]) translate([x, tab_y - 10, plate_z]) cube([5, 10 + wall_t, 12]);
      // Bail over the servo, eye on the hang line.
      translate([0, eye_y, 0]) {
        for (x = [-40, 35]) translate([x, -bail_t / 2, plate_z]) cube([5, bail_t, bail_top - plate_z + bail_t]);
        translate([-40, -bail_t / 2, bail_top]) cube([80, bail_t, bail_t]);
        translate([0, 0, bail_top + bail_t]) rotate([90, 0, 0]) difference() {
              hull() {
                cylinder(d = 12, h = bail_t, center = true);
                translate([0, -4, 0]) cube([12, 1, bail_t], center = true);
              }
              cylinder(d = eye_d, h = bail_t + 2, center = true);
            }
      }
      // Posts with stop ledges.
      for (a = [60:120:300]) rotate(a) {
          translate([post_r - post[0] / 2, -post[1] / 2, ring_z[0]]) cube([post[0], post[1], plate_z - ring_z[0] + 0.1]);
          translate([post_r - post[0] / 2 - 3, -post[1] / 2, ring_z[0]])
            cube([3.1, post[1], zs0 - spider_h / 2 - ring_z[0]]);
        }
      // Pivot ring.
      translate([0, 0, ring_z[0]]) difference() {
          cylinder(r = ring_r[1], h = ring_z[1] - ring_z[0]);
          translate([0, 0, -1]) cylinder(r = ring_r[0], h = 20);
        }
      // Clevis cheeks.
      for (a = [0:120:240]) rotate(a) for (s = [-1, 1])
            translate([rp - 7, s > 0 ? cheek_y : -cheek_y - cheek, -7]) cube([ring_r[1] - rp + 7, cheek, ring_z[1] + 7]);
    }
    // Pushrod slot through the deck.
    translate([-8, -rod_t / 2 - 2, plate_z - 1]) cube([16, rod_t + 4, plate_t + 2]);
    servo_window();
    // Pivot pins.
    for (a = [0:120:240]) rotate(a) translate([rp, 0, 0]) rotate([90, 0, 0]) cylinder(d = pin_bore, h = 40, center = true);
  }
}

// ---------- bought-part stand-ins ----------

module servo_dummy(ph) {
  color("dimgray") translate([servo_cx, 0, shaft_z]) {
      translate([0, case_top_y + servo_h / 2, 0]) cube([servo_l, servo_h, servo_w], center = true);
      translate([0, tab_y - servo_tab_t / 2, 0]) cube([servo_l + 14, servo_tab_t, servo_w], center = true);
    }
  color("dimgray") translate([shaft_x, case_top_y, shaft_z]) rotate([90, 0, 0]) cylinder(d = 12, h = servo_boss);
  // Single-arm horn.
  color("white") translate([shaft_x, spline_y, shaft_z]) rotate([90, 0, 0]) {
        cylinder(d = 9, h = horn_hub);
        translate([0, 0, horn_hub - horn_arm_t]) rotate(ph) hull() {
              cylinder(d = 9, h = horn_arm_t);
              translate([crank_r + 3, 0, 0]) cylinder(d = 5, h = horn_arm_t);
            }
      }
}

// ---------- layouts ----------

module assembly(c) {
  u = c * stroke;
  zs = zs0 + u;
  th = prong_angle(zs);
  ph = crank_angle(zs);
  cp = crank_pin(ph);
  color("burlywood") frame();
  color("goldenrod") translate([0, 0, zs]) spider();
  servo_dummy(ph);
  color("seagreen") translate([0, 0, zs + lug_h]) rotate([0, atan2(cp[0], cp[1] - zs - lug_h), 0]) pushrod();
  for (a = [0:120:240]) rotate(a) {
      color("crimson") translate([rp, 0, 0]) rotate([0, th, 0]) prong();
      pl = [rp + lever_at(th)[0], lever_at(th)[1]];
      ang = atan2(zs - pl[1], rs - pl[0]);
      for (s = [-1, 1]) color("steelblue") translate([pl[0], s * (prong_t / 2 + gap / 2 + link_t / 2), pl[1]])
            rotate([0, -ang, 0]) link();
    }
}

module print_plate() {
  // H2D bed, ASA. Frame upright on its pivot cheeks with supports; everything else flat, no supports.
  translate([0, 0, 7]) frame();
  translate([100, 0, spider_h / 2]) spider();
  translate([100, 40, rod_t / 2]) rotate([90, 0, 0]) rotate([0, 90, 0]) pushrod();
  for (i = [0:2]) translate([-110 + i * 35, 140, prong_t / 2]) rotate([-90, 0, 0]) prong();
  for (i = [0:5]) translate([40 + (i % 3) * 35, 110 + floor(i / 3) * 14, link_t / 2]) rotate([-90, 0, 0]) link();
}

if (part == "assembly") assembly(close);
else if (part == "frame") frame();
else if (part == "spider") spider();
else if (part == "prong") rotate([-90, 0, 0]) prong();
else if (part == "link") rotate([-90, 0, 0]) link();
else if (part == "pushrod") rotate([90, 0, 0]) rotate([0, 90, 0]) pushrod();
else if (part == "print_plate") print_plate();
