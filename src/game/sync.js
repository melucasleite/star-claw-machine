import { lamp } from "./scene.js";
import { theme } from "./settings.js";
import { updateLaser } from "./laser.js";
import { animatePhoto } from "./photo.js";
import { animateHalloween } from "./halloween.js";
import {
  animateDecor,
  bridge,
  cable,
  carriage,
  reelButton,
  stick,
} from "./cabinet.js";
import { hub, hubMesh, prongs } from "./claw.js";
import { glowPets, plushies } from "./plushies.js";
import { keys } from "./input.js";
import { game } from "./game.js";

// ---------- render sync ----------

export function sync(now) {
  for (const b of plushies) {
    // Squash keeps the volume and sinks a little so the plushie stays on the floor.
    const a = b.squash.a;
    b.root.position.copy(b.body.position);
    b.root.position.y -= a * 0.35;
    b.root.scale.set(1 + a / 2, 1 - a, 1 + a / 2);
    b.group.quaternion.copy(b.body.quaternion);
  }
  hubMesh.position.copy(hub.position);
  for (const p of prongs) {
    p.mesh.position.copy(p.body.position);
    p.mesh.quaternion.copy(p.body.quaternion);
  }
  carriage.position.set(hub.position.x, 8.55, hub.position.z);
  bridge.position.z = hub.position.z;
  const cableTop = 7.9;
  const cableBottom = hub.position.y + 0.2;
  cable.scale.y = Math.max(0.01, cableTop - cableBottom);
  cable.position.set(
    hub.position.x,
    (cableTop + cableBottom) / 2,
    hub.position.z,
  );

  // The cabinet lamp slowly cycles through the pastels after a clear.
  const party =
    game.mode === "clear" || (game.mode === "over" && game.result?.cleared);
  if (party) lamp.color.setHSL((now / 4000) % 1, 0.7, 0.75);
  else lamp.color.setHex(theme().scene.lamp);
  animateDecor(now);
  updateLaser(now);
  animatePhoto(now);
  glowPets(now);
  animateHalloween(now);

  const ix = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
  const iz = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
  stick.rotation.set(iz * 0.35, 0, -ix * 0.35);
  reelButton.position.y = keys.Space ? -0.07 : -0.02;
}
