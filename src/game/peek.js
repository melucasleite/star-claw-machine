import * as THREE from "three";
import { CAM_OFFSET, CAM_TARGET, camera } from "./scene.js";

// ---------- peek ----------

// Like leaning round a real claw machine to line the claw up: FRONT looks straight in through the
// front glass (lines up left and right), SIDE through the right-hand glass (lines up near and
// far). The camera glides between views; tapping the active view's button goes back.
export const VIEWS = {
  iso: CAM_OFFSET.clone(),
  front: new THREE.Vector3(0, 5, 40),
  side: new THREE.Vector3(40, 5, 0),
};
export const peek = { view: "iso" };
const offset = CAM_OFFSET.clone();
const goal = new THREE.Vector3();

export function setView(view) {
  peek.view = VIEWS[view] ? view : "iso";
  document.body.dataset.peek = peek.view;
}
export const togglePeek = (view) => setView(peek.view === view ? "iso" : view);

// Called every frame: ease the camera toward the chosen view.
export function stepCamera(dt) {
  goal.copy(VIEWS[peek.view]);
  if (offset.distanceToSquared(goal) < 1e-4) return;
  offset.lerp(goal, 1 - Math.exp(-dt * 7));
  camera.position.copy(CAM_TARGET).add(offset);
  camera.lookAt(CAM_TARGET);
}

// Arrow keys follow the view: right is always screen-right, down always toward you.
export function viewAxes(ix, iz) {
  if (peek.view === "side") return [iz, -ix];
  return [ix, iz];
}

// A screen-space drag (CSS px) as a move on the floor, for whichever way the camera faces.
const right = new THREE.Vector3();
const toward = new THREE.Vector3();
export function screenDeltaToGround(dx, dy) {
  const s = (camera.right - camera.left) / innerWidth;
  right.set(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();
  toward.copy(camera.position).sub(CAM_TARGET);
  // How steeply the camera looks down: a level view foreshortens depth a lot, so cap it.
  const sinElev = Math.max(0.45, toward.y / toward.length());
  toward.setY(0).normalize();
  const r = dx * s;
  const t = (dy * s) / sinElev;
  return {
    x: right.x * r + toward.x * t,
    z: right.z * r + toward.z * t,
  };
}
