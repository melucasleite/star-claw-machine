import * as THREE from "three";
import * as CANNON from "cannon-es";
import { CHUTE, CLAW } from "./config.js";
import { M, scene } from "./scene.js";
import { G_CLAW, G_PRIZE, G_STATIC, mats, world } from "./physics.js";

// ---------- claw ----------

export function meshFromBody(body, mat) {
  const g = new THREE.Group();
  body.shapes.forEach((s, i) => {
    let geo;
    if (s instanceof CANNON.Box) {
      const e = s.halfExtents;
      geo = new THREE.BoxGeometry(e.x * 2, e.y * 2, e.z * 2);
    } else {
      geo = new THREE.CylinderGeometry(
        s.radiusTop,
        s.radiusBottom,
        s.height,
        16,
      );
    }
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(body.shapeOffsets[i]);
    m.quaternion.copy(body.shapeOrientations[i]);
    m.castShadow = true;
    g.add(m);
  });
  scene.add(g);
  return g;
}

// The hub is kinematic: we drive it like the gantry motors would.
export const hub = new CANNON.Body({
  type: CANNON.Body.KINEMATIC,
  material: mats.claw,
  collisionFilterGroup: G_CLAW,
  collisionFilterMask: G_PRIZE,
});
hub.addShape(new CANNON.Cylinder(0.38, 0.38, 0.4, 12));
hub.position.set(CHUTE.x, CLAW.topY, CHUTE.z);
world.addBody(hub);
export const hubMesh = meshFromBody(hub, M.brass);

// Three prongs on hinges, each driven by a torque-limited servo. The torque limit is the grip.
export const prongs = [];
for (let i = 0; i < 3; i++) {
  const phi = (i / 3) * Math.PI * 2 + Math.PI / 6;
  const radial = new CANNON.Vec3(Math.cos(phi), 0, Math.sin(phi));
  const axis = new CANNON.Vec3(-Math.sin(phi), 0, Math.cos(phi));
  // Local frame: +x points outward, +z is the hinge axis.
  const q0 = new CANNON.Quaternion().setFromAxisAngle(
    new CANNON.Vec3(0, 1, 0),
    -phi,
  );
  const pivot = new CANNON.Vec3(radial.x * 0.32, -0.15, radial.z * 0.32);
  const body = new CANNON.Body({
    mass: 0.25,
    material: mats.claw,
    collisionFilterGroup: G_CLAW,
    collisionFilterMask: G_STATIC | G_PRIZE,
    angularDamping: 0.4,
  });
  const zAxis = new CANNON.Vec3(0, 0, 1);
  body.addShape(
    new CANNON.Box(new CANNON.Vec3(0.06, 0.5, 0.09)),
    new CANNON.Vec3(0.17, -0.47, 0),
    new CANNON.Quaternion().setFromAxisAngle(zAxis, 0.35),
  );
  body.addShape(
    new CANNON.Box(new CANNON.Vec3(0.06, 0.3, 0.1)),
    new CANNON.Vec3(0.2, -1.15, 0),
    new CANNON.Quaternion().setFromAxisAngle(zAxis, -0.65),
  );
  body.position.copy(hub.position.vadd(pivot));
  body.quaternion.copy(q0);
  world.addBody(body);
  world.addConstraint(
    new CANNON.HingeConstraint(hub, body, {
      pivotA: pivot,
      axisA: axis,
      pivotB: new CANNON.Vec3(0, 0, 0),
      axisB: zAxis,
    }),
  );
  prongs.push({
    body,
    axis,
    q0inv: q0.conjugate(),
    mesh: meshFromBody(body, M.brass),
    angle: 0,
  });
}
export const prongBodies = new Set(prongs.map((p) => p.body));

export const claw = { closing: false, torque: CLAW.openTorque };

export function prongAngle(p) {
  const q = p.q0inv.mult(p.body.quaternion);
  return 2 * Math.atan2(q.z, q.w);
}

export function driveProngs() {
  const target = claw.closing ? CLAW.closedAngle : CLAW.openAngle;
  const limit = claw.closing ? claw.torque : CLAW.openTorque;
  for (const p of prongs) {
    p.angle = prongAngle(p);
    const w = p.body.angularVelocity.dot(p.axis);
    const tau = Math.max(
      -limit,
      Math.min(limit, CLAW.kp * (target - p.angle) - CLAW.kd * w),
    );
    p.body.torque.vadd(p.axis.scale(tau), p.body.torque);
  }
}
