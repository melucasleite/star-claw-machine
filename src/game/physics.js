import * as CANNON from "cannon-es";
import { M, box } from "./scene.js";

// ---------- physics world ----------

export const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -20, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 20;

export const G_STATIC = 1;
export const G_PRIZE = 2;
export const G_CLAW = 4;
// The cabinet walls. Prizes bounce off them; the prongs pass through, so a claw dropped next to
// the glass isn't splayed open by it (which used to stop the drop halfway and cost a heart).
export const G_WALL = 8;
export const PRIZE_MASK = G_STATIC | G_PRIZE | G_CLAW | G_WALL;
export const mats = {
  static: new CANNON.Material("static"),
  prize: new CANNON.Material("prize"),
  claw: new CANNON.Material("claw"),
};
export const contact = (a, b, friction, o = {}) =>
  world.addContactMaterial(
    new CANNON.ContactMaterial(a, b, { friction, restitution: 0, ...o }),
  );
// Plushies are stuffed cotton: soft contacts that sink in and soak up the hit, no bounce.
// The claw contact stays firm so the grip is unchanged.
export const COTTON = {
  restitution: 0,
  contactEquationStiffness: 1.2e6,
  contactEquationRelaxation: 6,
};
contact(mats.prize, mats.static, 0.5, COTTON);
contact(mats.prize, mats.prize, 0.45, COTTON);
contact(mats.prize, mats.claw, 0.9);
contact(mats.claw, mats.static, 0.3);

export function addStaticBox(cx, cy, cz, hx, hy, hz, mat, group = G_STATIC) {
  const body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    material: mats.static,
    collisionFilterGroup: group,
    collisionFilterMask: group === G_WALL ? G_PRIZE : G_PRIZE | G_CLAW,
  });
  body.addShape(new CANNON.Box(new CANNON.Vec3(hx, hy, hz)));
  body.position.set(cx, cy, cz);
  world.addBody(body);
  if (mat)
    return box(hx * 2, hy * 2, hz * 2, mat, cx, cy, cz, {
      cast: mat !== M.acrylic,
    });
}
