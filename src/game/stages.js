// Stages: the set dressing a level brings to the machine. The default stage is the plain cabinet
// the themes style; a level with `stage: "arcade"` turns the inside into a tiny arcade (neon carpet,
// walls lined with glowing cabinets and signs) and the room outside into an arcade floor, and
// `stage: "city"` makes it a night street under a skyline.
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
      // The floor's edge, under the carpet.
      M.felt.color.setHex(0x0d0b1e);
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

// ----- the city -----

// The machine's floor as a night street: a crossroads of asphalt with dashed yellow lines and
// zebra crossings, sidewalk blocks in the four corners, a manhole, a few cracks, and painted
// street-lamp pools. One canvas for the whole 8 x 8 floor, 64 px a unit.
function paintStreet(c, w, h, fill) {
  const u = w / 8;
  const X = (x) => (x + 4) * u;
  const r = rng(17);
  // Asphalt with a little grit.
  fill("#2a2c33");
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 1600; i++) {
    fill(r() < 0.5 ? "#33363e" : "#24262c");
    c.fillRect(r() * w, r() * h, 2, 2);
  }
  // Sidewalk blocks, with paving joints and a kerb.
  const road = 1.1;
  for (const [x0, x1] of [
    [-4, -road],
    [road, 4],
  ])
    for (const [z0, z1] of [
      [-4, -road],
      [road, 4],
    ]) {
      fill("#7d828c");
      c.fillRect(X(x0), X(z0), (x1 - x0) * u, (z1 - z0) * u);
      fill("#6c717b");
      for (let t = x0; t < x1; t += 0.5)
        c.fillRect(X(t), X(z0), 2, (z1 - z0) * u);
      for (let t = z0; t < z1; t += 0.5)
        c.fillRect(X(x0), X(t), (x1 - x0) * u, 2);
      fill("#b9bdc4");
      c.lineWidth = 5;
      c.strokeStyle = "#b9bdc4";
      c.strokeRect(X(x0), X(z0), (x1 - x0) * u, (z1 - z0) * u);
    }
  // Dashed centre lines.
  fill("#f5c518", true);
  for (let t = -4; t < 4; t += 0.6) {
    if (Math.abs(t) < road + 0.6) continue;
    c.fillRect(X(t), X(0) - 3, 0.35 * u, 6);
    c.fillRect(X(0) - 3, X(t), 6, 0.35 * u);
  }
  // Zebra crossings on all four arms.
  fill("#e9ecf0");
  for (let k = -road + 0.15; k < road - 0.1; k += 0.3) {
    for (const s of [-1, 1]) {
      c.fillRect(
        X(k),
        X(s * (road + 0.15)) - (s < 0 ? 0.45 * u : 0),
        0.16 * u,
        0.45 * u,
      );
      c.fillRect(
        X(s * (road + 0.15)) - (s < 0 ? 0.45 * u : 0),
        X(k),
        0.45 * u,
        0.16 * u,
      );
    }
  }
  // A manhole and a few cracks.
  fill("#1c1d22");
  c.beginPath();
  c.arc(X(0.55), X(-2.6), 0.32 * u, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#3b3e46";
  c.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.arc(X(0.55), X(-2.6), (0.08 + i * 0.07) * u, 0, Math.PI * 2);
    c.stroke();
  }
  c.strokeStyle = "#1d1f24";
  for (let i = 0; i < 6; i++) {
    let x = r() * w;
    let y = X(-0.6 + r() * 1.2);
    c.beginPath();
    c.moveTo(x, y);
    for (let k = 0; k < 5; k++)
      c.lineTo((x += (r() - 0.5) * 30), (y += (r() - 0.5) * 30));
    c.stroke();
  }
  // Warm pools of lamplight on the sidewalk corners.
  for (const [x, z] of [
    [-3.2, -3.2],
    [3.2, -3.2],
  ]) {
    const g = c.createRadialGradient(X(x), X(z), 0, X(x), X(z), 1.4 * u);
    g.addColorStop(0, "rgba(255,214,140,0.35)");
    g.addColorStop(1, "rgba(255,214,140,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }
}

// A wall seen from inside the machine: night sky with stars, then rows of buildings with lit
// windows, a couple of signs, and lamp posts along the bottom. `signs` is
// [text, x (units), y (units), colour, vertical?]; `extra` paints anything else (the moon...).
function paintSkyline(seed, signs, extra) {
  return (c, w, h, fill, glow) => {
    const r = rng(seed);
    const Y = (u) => h - u * PX;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#070b1c");
    sky.addColorStop(0.6, "#1b1a44");
    sky.addColorStop(1, "#3a2450");
    c.fillStyle = glow ? "#000" : sky;
    c.fillRect(0, 0, w, h);
    // Stars.
    for (let i = 0; i < 90; i++) {
      fill(`rgba(255,255,255,${0.4 + r() * 0.6})`, true);
      const s = r() < 0.15 ? 4 : 2;
      c.fillRect(r() * w, r() * Y(4.5), s, s);
    }
    extra?.(c, w, h, fill, Y);
    // Two rows of buildings: far ones dim, near ones taller and brighter.
    for (const [row, base, top, tint, lit] of [
      [0, 0, [4.5, 7.5], "#1a1c38", 0.35],
      [1, 0, [2.5, 5.5], "#23264a", 0.6],
    ]) {
      let x = row ? -20 : 0;
      while (x < w) {
        const bw = (0.7 + r() * 0.9) * PX;
        const bh = top[0] + r() * (top[1] - top[0]);
        fill(tint);
        c.fillRect(x, Y(bh), bw, Y(base) - Y(bh));
        // Rooftop bits: a water tower or an antenna now and then.
        if (r() < 0.3)
          c.fillRect(x + bw * 0.3, Y(bh + 0.35), bw * 0.25, 0.35 * PX);
        if (r() < 0.25) c.fillRect(x + bw * 0.7, Y(bh + 0.7), 4, 0.7 * PX);
        // Windows: a grid, some lit warm, a few cool TV-blue.
        for (let wy = bh - 0.35; wy > base + 0.3; wy -= 0.32)
          for (let wx = x + 10; wx < x + bw - 16; wx += 20) {
            const on = r() < lit;
            fill(on ? (r() < 0.15 ? "#8fd3ff" : "#ffd98a") : "#14152a", on);
            c.fillRect(wx, Y(wy), 9, 0.15 * PX);
          }
        x += bw + (row ? 6 : 2);
      }
    }
    // Neon signs.
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (const [text, sx, sy, color, vertical] of signs) {
      c.font = `${0.42 * PX}px "Press Start 2P", monospace`;
      c.shadowColor = color;
      c.shadowBlur = 26;
      fill(color, true);
      if (vertical)
        [...text].forEach((ch, i) => c.fillText(ch, sx * PX, Y(sy - i * 0.5)));
      else {
        c.lineWidth = 6;
        c.strokeStyle = color;
        c.strokeText(text, sx * PX, Y(sy));
        fill("#ffffff", true);
        c.fillText(text, sx * PX, Y(sy));
      }
      c.shadowBlur = 0;
    }
    // Lamp posts along the street.
    for (let lx = 0.9; lx < 8; lx += 2.4) {
      fill("#0d0e18");
      c.fillRect(lx * PX - 4, Y(2.6), 8, 2.6 * PX);
      c.fillRect(lx * PX - 4, Y(2.6), 0.4 * PX, 6);
      c.shadowColor = "#ffd98a";
      c.shadowBlur = 30;
      fill("#fff1c4", true);
      c.beginPath();
      c.arc(lx * PX + 0.4 * PX, Y(2.52), 9, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
    }
  };
}

// The moon over the back wall.
function paintMoon(c, w, h, fill, Y) {
  c.shadowColor = "#fff3c8";
  c.shadowBlur = 40;
  fill("#fff6d8", true);
  c.beginPath();
  c.arc(6.4 * PX, Y(8.1), 0.55 * PX, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;
}
// A little "M+L" heart chalked low on the side wall, painted over the finished skyline.
function paintChalk(c, w, h, fill, Y) {
  c.save();
  c.translate(1.3 * PX, Y(0.75));
  c.rotate(-0.08);
  c.strokeStyle = "#f7a8c8";
  c.lineWidth = 4;
  c.beginPath();
  const s = 0.3 * PX;
  c.moveTo(0, s * 0.9);
  c.bezierCurveTo(-s * 1.3, 0, -s * 0.8, -s * 0.9, 0, -s * 0.3);
  c.bezierCurveTo(s * 0.8, -s * 0.9, s * 1.3, 0, 0, s * 0.9);
  c.stroke();
  c.font = `${0.16 * PX}px "Press Start 2P", monospace`;
  c.fillStyle = "#f7a8c8";
  c.textAlign = "center";
  c.fillText("M+L", 0, 2);
  c.restore();
}

// Hazard stripes for the base of the cabinet, like a loading bay.
function paintHazard(c, w, h, fill) {
  fill("#111");
  c.fillRect(0, 0, w, h);
  fill("#f5c518");
  for (let x = -h; x < w; x += h * 1.2) {
    c.beginPath();
    c.moveTo(x, h);
    c.lineTo(x + h * 0.6, h);
    c.lineTo(x + h * 1.2, 0);
    c.lineTo(x + h * 0.6, 0);
    c.fill();
  }
}

// Sidewalk paving for the room outside.
function paintPaving(c, w, h) {
  c.fillStyle = "#3a3f4a";
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#2c3039";
  c.fillRect(0, 0, w, 3);
  c.fillRect(0, 0, 3, h);
  const r = rng(29);
  for (let i = 0; i < 60; i++) {
    c.fillStyle = `rgba(0,0,0,${r() * 0.15})`;
    c.fillRect(r() * w, r() * h, 3, 3);
  }
}

function buildCity() {
  const group = new THREE.Group();
  // The street, over the two floor slabs; each samples its own patch of the one canvas.
  const street = litTexture(512, 512, paintStreet);
  for (const [x0, x1, z0, z1] of [
    [-4, 4, -4, 1.8],
    [-1.8, 4, 1.8, 4],
  ]) {
    const tex = {
      map: street.map.clone(),
      emissiveMap: street.emissiveMap.clone(),
    };
    for (const t of Object.values(tex)) {
      t.repeat.set((x1 - x0) / 8, (z1 - z0) / 8);
      t.offset.set((x0 + 4) / 8, 1 - (z1 + 4) / 8);
      t.needsUpdate = true;
    }
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(x1 - x0, z1 - z0),
      litMaterial(tex, 0.25),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, 0.004, (z0 + z1) / 2);
    m.receiveShadow = true;
    group.add(m);
  }
  // The skyline on the two solid walls.
  const walls = [
    {
      paint: paintSkyline(
        41,
        [
          ["ARCADE", 2.3, 5.2, "#ff4fd8"],
          ["HOTEL", 6.9, 6.6, "#33e6ff", true],
        ],
        paintMoon,
      ),
      pos: [0, 4.7, -3.95],
      rot: 0,
    },
    {
      paint: paintSkyline(
        53,
        [
          ["DINER", 5.6, 4.6, "#ff6b4a"],
          ["24H", 1.6, 5.9, "#9bff4a"],
        ],
        null,
      ),
      chalk: true,
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
  const paintWalls = () => {
    for (const w of wallMeshes) {
      w.mesh.material?.map?.dispose();
      w.mesh.material?.emissiveMap?.dispose();
      const paint = w.chalk
        ? (c, cw, ch, fill, glow) => {
            w.paint(c, cw, ch, fill, glow);
            if (!glow) paintChalk(c, cw, ch, fill, (u) => ch - u * PX);
          }
        : w.paint;
      w.mesh.material = litMaterial(litTexture(8 * PX, 9.4 * PX, paint), 1);
    }
  };
  paintWalls();
  document.fonts.load(`20px "Press Start 2P"`).then(paintWalls);
  // Hazard stripes round the bottom of the base.
  const hazard = litTexture(512, 32, paintHazard);
  for (const [w, x, z, rot] of [
    [8.8, 4.415, 0, Math.PI / 2],
    [8.8, 0, 4.415, 0],
  ]) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, 0.5),
      litMaterial(hazard, 0),
    );
    m.position.set(x, -3.3, z);
    m.rotation.y = rot;
    group.add(m);
  }
  // Warm street-lamp light and a cool moonlit fill.
  const lampLight = new THREE.PointLight(0xffd98a, 6, 10, 2);
  lampLight.position.set(-3.2, 4.5, -3.2);
  group.add(lampLight);
  let paving = null;
  return {
    group,
    dress() {
      // Slate body, steel posts, taxi-yellow trim.
      M.walnut.color.setHex(0x2b3340);
      M.walnut.roughness = 0.5;
      M.walnutDark.color.setHex(0x1a1f28);
      M.post.color.setHex(0x9aa3ad);
      M.post.roughness = 0.35;
      M.brass.color.setHex(0xa8b0ba);
      M.teal.color.setHex(0xf5c518);
      M.mustard.color.setHex(0xf5c518);
      M.mustard.emissive.setHex(0xf5c518);
      M.mustard.emissiveIntensity = 0.25;
      // The floor's edge, under the street: kerb grey.
      M.felt.color.setHex(0x7d828c);
      for (const k of DRESSED) {
        M[k].map = null;
        M[k].needsUpdate = true;
      }
      // A theatre marquee with warm chasing bulbs.
      stageDecor.marquee = {
        background: "#111318",
        border: "#f5c518",
        shadow: "#000000",
        text: "#fff6d6",
        glow: "#ffd27a",
        emoji: "🏙️",
      };
      stageDecor.bulbs = [0xfff2c4, 0xffd27a];
      bulbs.visible = true;
      // Outside: sidewalk paving under a night sky.
      if (!paving) {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 64;
        paintPaving(cv.getContext("2d"), 64, 64);
        paving = new THREE.CanvasTexture(cv);
        paving.colorSpace = THREE.SRGBColorSpace;
        paving.wrapS = paving.wrapT = THREE.RepeatWrapping;
        paving.repeat.set(40, 40);
      }
      ground.material.map = paving;
      ground.material.color.setHex(0xffffff);
      ground.material.needsUpdate = true;
      rug.visible = false;
      scene.background.setHex(0x0b1020);
      lamp.intensity = 20;
    },
  };
}

// The shared cabinet materials a stage may restyle. The theme resets their colour and
// roughness on every change; the glow is put back here.
const DRESSED = [
  "walnut",
  "walnutDark",
  "post",
  "brass",
  "teal",
  "mustard",
  "felt",
];

export const STAGES = { arcade: buildArcade, city: buildCity };
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
