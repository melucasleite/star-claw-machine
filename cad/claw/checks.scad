// Interference checks: each case should export an empty object. Run via check.sh.
include <claw.scad>
part = "none";
check = "frame_prong";
c = 1;
zs = zs0 + c * stroke;
th = prong_angle(zs);
ph = crank_angle(zs);
cp = crank_pin(ph);
module prongs() for (a = [0:120:240]) rotate(a) translate([rp, 0, 0]) rotate([0, th, 0]) prong();
module prong_k(k) rotate(k * 120) translate([rp, 0, 0]) rotate([0, th, 0]) prong();
module rod() translate([0, 0, zs + lug_h]) rotate([0, atan2(cp[0], cp[1] - zs - lug_h), 0]) pushrod();
module links() for (a = [0:120:240]) rotate(a) {
    pl = [rp + lever_at(th)[0], lever_at(th)[1]];
    for (s = [-1, 1]) translate([pl[0], s * (prong_t / 2 + gap / 2 + link_t / 2), pl[1]])
        rotate([0, -atan2(zs - pl[1], rs - pl[0]), 0]) link();
  }
if (check == "frame_prong") intersection() { frame(); prongs(); }
if (check == "prong_prong") intersection() { prong_k(0); union() { prong_k(1); prong_k(2); } }
if (check == "frame_spider") intersection() { frame(); translate([0, 0, zs]) spider(); }
if (check == "frame_rod") intersection() { frame(); rod(); }
if (check == "rod_spider") intersection() { rod(); translate([0, 0, zs]) spider(); }
if (check == "links_spider") intersection() { links(); translate([0, 0, zs]) spider(); }
// The tabs sit flush on the wall face, so the servo backs off 0.01 mm to keep that face out of the result.
if (check == "frame_servo") intersection() { frame(); translate([0, -0.01, 0]) servo_dummy(ph); }
if (check == "rod_servo") intersection() { rod(); servo_dummy(ph); }
