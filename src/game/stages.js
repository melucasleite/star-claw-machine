// Stages: the set dressing a level brings to the machine. The default stage is the plain cabinet
// the themes style; a level with `stage: "arcade"` turns the inside into a tiny arcade (neon carpet,
// walls lined with glowing cabinets and signs) and the room outside into an arcade floor.
// Adding a stage is adding a builder to STAGES.
import * as THREE from "three";
import { M, lamp, scene } from "./scene.js";
import { bulbs, drawMarquee, ground, rug, stageDecor } from "./cabinet.js";
import { arcadeCarpet } from "./textures.js";
import { currentLevel } from "./levels.js";
import { onTheme } from "./settings.js";

const PX = 128; // canvas pixels per world unit
const NEON = ["#ff4fd8", "#33e6ff", "#ffd23f", "#9bff4a", "#b46bff"];

// Paints the same picture twice: once in full colour (the map) and once with only the lit parts
// (the emissive map), so screens and neon glow while the rest takes the cabinet lamp.
function litTexture(w, h, paint, { repeat } = {}) {
  const make = (glow) => {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const c = cv.getContext("2d");
    // fill(colour, lit): unlit colours go black in the glow pass.
    const fill = (color, lit = false) =>
      (c.fillStyle = glow && !lit ? "#000" : color);
    paint(c, w, h, fill, glow);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    if (repeat) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(...repeat);
    }
    return tex;
  };
  return { map: make(false), emissiveMap: make(true) };
}

function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Blacklight carpet: navy, with neon squiggles, rings and triangles. One tile is 2 x 2 units.
function paintCarpet(c, w, h, fill) {
  const r = rng(5);
  fill("#0d0b1e");
  c.fillRect(0, 0, w, h);
  c.lineWidth = 5;
  for (let i = 0; i < 18; i++) {
    const color = NEON[i % NEON.length];
    c.strokeStyle = color;
    fill(color, true);
    const x = r() * w;
    const y = r() * h;
    const kind = i % 4;
    // Draw each shape in all nine tile positions so it wraps without a seam.
    for (const dx of [-w, 0, w])
      for (const dy of [-h, 0, h]) {
        c.save();
        c.translate(x + dx, y + dy);
        c.rotate(r() * 6.28);
        c.beginPath();
        if (kind === 0) {
          c.moveTo(-22, 0);
          for (let k = 1; k <= 4; k++) c.lineTo(-22 + k * 11, k % 2 ? -9 : 9);
          c.stroke();
        } else if (kind === 1) {
          c.arc(0, 0, 9, 0, Math.PI * 2);
          c.stroke();
        } else if (kind === 2) {
          c.moveTo(0, -11);
          c.lineTo(10, 8);
          c.lineTo(-10, 8);
          c.closePath();
          c.stroke();
        } else c.fillRect(-4, -4, 8, 8);
        c.restore();
      }
  }
}

// A wall seen from inside the machine: a row of arcade cabinets along the floor, a neon strip,
// and neon signs above. `signs` is [text, x (units), y (units), colour].
function paintWall(seed, signs) {
  return (c, w, h, fill, glow) => {
    const r = rng(seed);
    const Y = (u) => h - u * PX;
    // Wall: deep purple, lighter toward the floor, with faint vertical panels.
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#120a24");
    g.addColorStop(1, "#2a1450");
    c.fillStyle = glow ? "#000" : g;
    c.fillRect(0, 0, w, h);
    fill("rgba(255,255,255,0.04)");
    for (let x = 0; x < w; x += PX) c.fillRect(x, 0, 4, h);

    // Neon strips: one along the top of the cabinets, one up high.
    for (const [u, color] of [
      [3.9, "#33e6ff"],
      [8.6, "#ff4fd8"],
    ]) {
      c.shadowColor = color;
      c.shadowBlur = 24;
      fill(color, true);
      c.fillRect(0, Y(u), w, 10);
      c.shadowBlur = 0;
    }

    // The cabinet row.
    const bodies = ["#2b2f6b", "#6b1f3a", "#1d1d24", "#173f5f", "#4a2266"];
    let x = 10;
    while (x < w - 60) {
      const cw = (0.9 + r() * 0.3) * PX;
      const top = Y(2.9 + r() * 0.5);
      const body = bodies[Math.floor(r() * bodies.length)];
      const neon = NEON[Math.floor(r() * NEON.length)];
      // Body, with a side-art stripe.
      fill(body);
      c.fillRect(x, top, cw, Y(0) - top);
      fill(neon);
      c.globalAlpha = 0.5;
      c.fillRect(x + 6, top + 0.5 * PX, 8, Y(0) - top - 0.6 * PX);
      c.globalAlpha = 1;
      // Lit marquee and screen.
      c.shadowColor = neon;
      c.shadowBlur = 18;
      fill(neon, true);
      c.fillRect(x + 10, top + 10, cw - 20, 0.32 * PX);
      c.shadowBlur = 0;
      const sy = top + 0.55 * PX;
      const sh = 0.95 * PX;
      fill("#0b1640", true);
      c.fillRect(x + 16, sy, cw - 32, sh);
      // A little game on the screen: invaders, a paddle or a maze, in chunky pixels.
      const game = Math.floor(r() * 3);
      const colour = NEON[Math.floor(r() * NEON.length)];
      fill(colour, true);
      const px = 8;
      if (game === 0)
        for (let i = 0; i < 4; i++)
          for (let j = 0; j < 2; j++)
            c.fillRect(x + 26 + i * 22, sy + 14 + j * 22, px * 2, px);
      else if (game === 1) {
        c.fillRect(x + cw / 2 - 20, sy + sh - 18, 40, px);
        c.fillRect(x + cw / 2 + 8, sy + sh / 2, px, px);
      } else {
        c.fillRect(x + 22, sy + 12, cw - 44, px);
        c.fillRect(x + 22, sy + 12, px, sh - 24);
        c.fillRect(x + cw - 30, sy + 30, px, sh - 42);
        c.fillRect(x + 40, sy + sh / 2, cw - 70, px);
      }
      // Control panel and coin door with glowing slots.
      fill("#111");
      c.fillRect(x - 4, sy + sh + 14, cw + 8, 0.28 * PX);
      fill(NEON[0], true);
      c.fillRect(x + cw * 0.3, sy + sh + 20, 12, 12);
      fill(NEON[2], true);
      c.fillRect(x + cw * 0.55, sy + sh + 20, 12, 12);
      fill("#0a0a0f");
      c.fillRect(x + cw / 2 - 26, Y(0.9), 52, 0.6 * PX);
      fill("#ff8a1f", true);
      c.fillRect(x + cw / 2 - 14, Y(0.75), 8, 18);
      c.fillRect(x + cw / 2 + 6, Y(0.75), 8, 18);
      x += cw + 8 + r() * 20;
    }

    // Neon signs: outlined tube text with a halo.
    for (const [text, sx, sy, color] of signs) {
      c.font = `${0.55 * PX}px "Press Start 2P", monospace`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.shadowColor = color;
      c.shadowBlur = 30;
      c.lineWidth = 6;
      c.strokeStyle = color;
      c.strokeText(text, sx * PX, Y(sy));
      fill("#ffffff", true);
      c.fillText(text, sx * PX, Y(sy));
      c.shadowBlur = 0;
    }
    // A neon star and bolt for good measure.
    c.shadowBlur = 24;
    c.lineWidth = 7;
    c.shadowColor = c.strokeStyle = NEON[2];
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 ? 0.22 * PX : 0.5 * PX;
      c.lineTo(1.1 * PX + Math.cos(a) * rad, Y(5.2) + Math.sin(a) * rad);
    }
    c.closePath();
    c.stroke();
    c.shadowColor = c.strokeStyle = NEON[1];
    c.beginPath();
    c.moveTo(6.9 * PX, Y(5.8));
    c.lineTo(6.6 * PX, Y(5.15));
    c.lineTo(6.95 * PX, Y(5.15));
    c.lineTo(6.65 * PX, Y(4.5));
    c.stroke();
    c.shadowBlur = 0;
  };
}

// Side art for the base of the arcade cabinet: racing stripes, stars and a neon zap.
function paintSideArt(c, w, h, fill) {
  fill("#140a26");
  c.fillRect(0, 0, w, h);
  for (const [k, color] of [
    [0, "#ff4fd8"],
    [1, "#33e6ff"],
    [2, "#ffd23f"],
  ]) {
    fill(color, true);
    c.beginPath();
    const x = w * 0.08 + k * 70;
    c.moveTo(x, h);
    c.lineTo(x + 40, h);
    c.lineTo(x + 40 + h * 0.9, 0);
    c.lineTo(x + h * 0.9, 0);
    c.fill();
  }
  const r = rng(3);
  for (let i = 0; i < 26; i++) {
    fill(NEON[i % NEON.length], true);
    const x = w * 0.45 + r() * w * 0.53;
    const y = r() * h;
    c.fillRect(x - 10, y - 2, 20, 4);
    c.fillRect(x - 2, y - 10, 4, 20);
  }
  c.font = `${0.5 * PX}px "Press Start 2P", monospace`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.shadowColor = "#ff4fd8";
  c.shadowBlur = 24;
  fill("#ffffff", true);
  c.fillText("1UP", w * 0.72, h * 0.5);
  c.shadowBlur = 0;
}

// The coin door: two glowing slots and an INSERT COIN label.
function paintCoinDoor(c, w, h, fill) {
  fill("#1c1c22");
  c.fillRect(0, 0, w, h);
  fill("#3a3a44");
  c.fillRect(6, 6, w - 12, h - 12);
  fill("#ff8a1f", true);
  for (const x of [w * 0.3, w * 0.62]) {
    c.fillRect(x, h * 0.42, w * 0.1, h * 0.22);
  }
  c.font = `${h * 0.1}px "Press Start 2P", monospace`;
  c.textAlign = "center";
  c.shadowColor = "#ffd23f";
  c.shadowBlur = 12;
  fill("#ffd23f", true);
  c.fillText("INSERT COIN", w / 2, h * 0.25);
  c.fillText("25¢", w / 2, h * 0.85);
  c.shadowBlur = 0;
}

function litMaterial({ map, emissiveMap }, glow) {
  return new THREE.MeshStandardMaterial({
    map,
    emissiveMap,
    emissive: 0xffffff,
    emissiveIntensity: glow,
    roughness: 0.9,
  });
}

function buildArcade() {
  const group = new THREE.Group();
  // Carpet over the two floor slabs (the chute corner stays a hole). UVs follow world units.
  const carpet = litTexture(256, 256, paintCarpet);
  for (const [x0, x1, z0, z1] of [
    [-4, 4, -4, 1.8],
    [-1.8, 4, 1.8, 4],
  ]) {
    const tiles = (a, b) => (b - a) / 2;
    const tex = {
      map: carpet.map.clone(),
      emissiveMap: carpet.emissiveMap.clone(),
    };
    for (const t of Object.values(tex)) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(tiles(x0, x1), tiles(z0, z1));
      t.needsUpdate = true;
    }
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(x1 - x0, z1 - z0),
      litMaterial(tex, 0.35),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, 0.004, (z0 + z1) / 2);
    m.receiveShadow = true;
    group.add(m);
  }
  // The two solid walls, just inside the wood.
  const walls = [
    {
      seed: 7,
      signs: [
        ["GAME ZONE", 4, 6.6, "#ff4fd8"],
        ["HI-SCORE", 4, 5.3, "#33e6ff"],
      ],
      pos: [0, 4.7, -3.95],
      rot: 0,
    },
    {
      seed: 13,
      signs: [
        ["PRIZES", 4, 6.6, "#9bff4a"],
        ["TOKENS", 4, 5.3, "#ffd23f"],
      ],
      pos: [-3.95, 4.7, 0],
      rot: Math.PI / 2,
    },
  ];
  const wallMeshes = walls.map((w) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(8, 9.4));
    m.position.set(...w.pos);
    m.rotation.y = w.rot;
    m.receiveShadow = true;
    group.add(m);
    return { ...w, mesh: m };
  });
  // The sign font may still be loading; repaint the walls once it's in.
  const paintWalls = () => {
    for (const w of wallMeshes) {
      w.mesh.material?.map?.dispose();
      w.mesh.material?.emissiveMap?.dispose();
      w.mesh.material = litMaterial(
        litTexture(8 * PX, 9.4 * PX, paintWall(w.seed, w.signs)),
        1,
      );
    }
  };
  paintWalls();
  document.fonts.load(`20px "Press Start 2P"`).then(paintWalls);
  // Neon tubes along the top of the walls, in 3D so they catch the eye from any angle.
  const tube = (color, w, d, x, z) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.07, d),
      new THREE.MeshBasicMaterial({ color, toneMapped: false }),
    );
    m.position.set(x, 9.1, z);
    group.add(m);
  };
  tube(0xff4fd8, 7.9, 0.07, 0, -3.9);
  tube(0x33e6ff, 0.07, 7.9, -3.9, 0);
  // Coloured spill from the signs.
  const pink = new THREE.PointLight(0xff4fd8, 6, 9, 2);
  pink.position.set(-1.5, 6, -3.4);
  const cyan = new THREE.PointLight(0x33e6ff, 5, 9, 2);
  cyan.position.set(-3.4, 5, 1.5);
  group.add(pink, cyan);

  // ----- the machine itself: same box, dressed as an arcade cabinet -----
  const neon = (color, w, h, d, x, y, z) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color, toneMapped: false }),
    );
    m.position.set(x, y, z);
    group.add(m);
  };
  // LED strips up the three corner posts, on the side facing the player.
  for (const [x, z] of [
    [-4.2, -4.2],
    [-4.2, 4.2],
    [4.2, -4.2],
  ])
    neon(0x33e6ff, 0.06, 9.6, 0.06, x + 0.18, 4.7, z + 0.18);
  // Underglow along the bottom of the base, and a pink line under the glass.
  neon(0xff4fd8, 8.8, 0.08, 0.06, 0, -3.45, 4.42);
  neon(0xff4fd8, 0.06, 0.08, 8.8, 4.42, -3.45, 0);
  neon(0x33e6ff, 0.06, 0.08, 8.8, 4.42, -0.25, 0);
  // Side art on the base and a coin door under the controls.
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 2.6),
    litMaterial(litTexture(8.4 * 64, 2.6 * 64, paintSideArt), 0.8),
  );
  art.rotation.y = Math.PI / 2;
  art.position.set(4.41, -1.85, 0);
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.7),
    litMaterial(litTexture(192, 216, paintCoinDoor), 1),
  );
  door.position.set(1.6, -2.1, 4.415);
  group.add(art, door);

  return {
    group,
    dress() {
      // Glossy black body, satin chrome, neon pink trim and a cyan glow on the brass bits.
      M.walnut.color.setHex(0x1a1024);
      M.walnut.roughness = 0.35;
      M.walnutDark.color.setHex(0x0e0814);
      M.post.color.setHex(0xc8ccd8);
      M.post.roughness = 0.25;
      M.post.map = null;
      M.brass.color.setHex(0xb8bcc8);
      M.brass.metalness = 0.3;
      M.teal.color.setHex(0xff4fd8);
      M.teal.emissive.setHex(0xff4fd8);
      M.teal.emissiveIntensity = 0.55;
      M.mustard.color.setHex(0x33e6ff);
      M.mustard.emissive.setHex(0x33e6ff);
      M.mustard.emissiveIntensity = 0.45;
      for (const k of DRESSED) {
        M[k].map = null;
        M[k].needsUpdate = true;
      }
      stageDecor.marquee = {
        background: "#140a26",
        border: "#ff4fd8",
        shadow: "#ff4fd8",
        text: "#33e6ff",
        glow: "#33e6ff",
        emoji: "🕹️",
      };
      stageDecor.bulbs = [0xff4fd8, 0x33e6ff, 0xffd23f, 0x9bff4a];
      bulbs.visible = true;
      // The room outside becomes the arcade floor.
      ground.material.map = arcadeCarpet();
      // Dimmed so the machine, not the floor, is the brightest thing on screen.
      ground.material.color.setHex(0x8a8a8a);
      ground.material.needsUpdate = true;
      rug.visible = false;
      scene.background.setHex(0x120a20);
      lamp.intensity = 18;
    },
  };
}

// The shared cabinet materials a stage may restyle. The theme resets their colour and
// roughness on every change; the glow is put back here.
const DRESSED = ["walnut", "walnutDark", "post", "brass", "teal", "mustard"];

export const STAGES = { arcade: buildArcade };
const built = {};
const LAMP = lamp.intensity;

// Shows the current level's stage. Runs on every theme change too, after the themes have styled
// the plain cabinet, so a stage's dressing sits on top of the theme's.
export function applyStage() {
  const id = currentLevel().stage;
  if (id && !built[id]) {
    built[id] = STAGES[id]();
    scene.add(built[id].group);
  }
  for (const [k, s] of Object.entries(built)) s.group.visible = k === id;
  rug.visible = true;
  lamp.intensity = LAMP;
  for (const k of DRESSED) M[k].emissive.setHex(0);
  stageDecor.marquee = stageDecor.bulbs = null;
  built[id]?.dress();
  drawMarquee();
}
onTheme(applyStage);
