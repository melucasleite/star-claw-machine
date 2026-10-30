// Procedural canvas textures for the themes: floors, wood grain, wool and stripes.
// Each is painted once and cached; nothing is downloaded.
import * as THREE from "three";

const cache = {};
function canvasTexture(key, w, h, paint, { repeat, pixel, color = true } = {}) {
  if (cache[key]) return cache[key];
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  paint(cv.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(...repeat);
  }
  if (pixel) tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.anisotropy = 4;
  return (cache[key] = tex);
}

// A seeded random, so the stars and bokeh land in the same place every time.
function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Floor textures for the big ground plane (80 x 80 units). In the isometric view the floor fills
// the whole frame, so it is each theme's background.
export function floorboards() {
  return canvasTexture(
    "floorboards",
    512,
    512,
    (c, w, h) => {
      const r = rng(3);
      const rows = 8;
      for (let i = 0; i < rows; i++) {
        const y = (i * h) / rows;
        const shade = 0.82 + r() * 0.3;
        c.fillStyle = `rgb(${110 * shade},${80 * shade},${56 * shade})`;
        c.fillRect(0, y, w, h / rows);
        // Grain streaks along the plank, and the seam between planks.
        for (let k = 0; k < 40; k++) {
          c.fillStyle = `rgba(40,24,12,${r() * 0.15})`;
          c.fillRect(r() * w, y + r() * (h / rows), 40 + r() * 160, 1);
        }
        c.fillStyle = "rgba(20,10,4,0.6)";
        c.fillRect(0, y, w, 2);
        c.fillRect(((i * 197) % w) | 0, y, 2, h / rows);
      }
    },
    { repeat: [10, 10] },
  );
}

// Fairground harlequin: plum diamonds with a scatter of gold sparkles.
export function harlequin() {
  return canvasTexture(
    "harlequin",
    256,
    256,
    (c, w, h) => {
      const r = rng(9);
      c.fillStyle = "#3e1638";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#4f1d47";
      for (const [x, y] of [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
        [w / 2, h / 2],
      ]) {
        c.beginPath();
        c.moveTo(x, y - h / 2);
        c.lineTo(x + w / 2, y);
        c.lineTo(x, y + h / 2);
        c.lineTo(x - w / 2, y);
        c.fill();
      }
      for (let i = 0; i < 14; i++) {
        c.fillStyle = `rgba(242,193,78,${0.25 + r() * 0.35})`;
        const x = r() * w;
        const y = r() * h;
        c.fillRect(x - 3, y - 0.5, 6, 1);
        c.fillRect(x - 0.5, y - 3, 1, 6);
      }
    },
    { repeat: [16, 16] },
  );
}

// The 90s arcade carpet: black, with neon squiggles, triangles and dots in hard pixels.
export function arcadeCarpet() {
  return canvasTexture(
    "arcade",
    64,
    64,
    (c, w, h) => {
      const r = rng(21);
      const neon = ["#00e8d8", "#f878f8", "#f8b800", "#3cbcfc", "#b8f818"];
      c.fillStyle = "#000000";
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) {
        c.fillStyle = neon[i % neon.length];
        const x = Math.floor(r() * w);
        const y = Math.floor(r() * h);
        const kind = i % 3;
        if (kind === 0)
          // A zig-zag squiggle.
          for (let k = 0; k < 6; k++)
            c.fillRect((x + k * 2) % w, y + (k % 2) * 2, 2, 2);
        else if (kind === 1)
          // A little hollow triangle.
          for (let k = 0; k < 4; k++) {
            c.fillRect((x + k) % w, (y + 3) % h, 1, 1);
            c.fillRect((x + k / 2) % w, (y + 3 - k) % h, 1, 1);
            c.fillRect((x + 3 - k / 2) % w, (y + 3 - k) % h, 1, 1);
          }
        else c.fillRect(x, y, 2, 2);
      }
    },
    { repeat: [24, 24], pixel: true },
  );
}

// Halloween: a dark purple floor with fallen leaves in orange, rust and brown.
export function leaves() {
  return canvasTexture(
    "leaves",
    256,
    256,
    (c, w, h) => {
      const r = rng(31);
      c.fillStyle = "#1e1428";
      c.fillRect(0, 0, w, h);
      const colors = ["#ff7a1a", "#c4501a", "#8a3a1a", "#e0a030", "#5a2a1a"];
      for (let i = 0; i < 26; i++) {
        const x = r() * w;
        const y = r() * h;
        const s = 6 + r() * 7;
        c.fillStyle = colors[i % colors.length];
        c.globalAlpha = 0.55 + r() * 0.35;
        // A leaf: two arcs meeting at the tips, plus a stem; drawn in all nine tile positions.
        for (const dx of [-w, 0, w])
          for (const dy of [-h, 0, h]) {
            c.save();
            c.translate(x + dx, y + dy);
            c.rotate(r() * 6.28);
            c.beginPath();
            c.moveTo(-s, 0);
            c.quadraticCurveTo(0, -s * 0.7, s, 0);
            c.quadraticCurveTo(0, s * 0.7, -s, 0);
            c.fill();
            c.fillRect(s, -0.5, s * 0.4, 1);
            c.restore();
          }
      }
      c.globalAlpha = 1;
    },
    { repeat: [12, 12] },
  );
}

// A cobweb: radial threads and a sagging spiral, white on transparent.
export function cobweb() {
  return canvasTexture("cobweb", 256, 256, (c, w) => {
    c.strokeStyle = "rgba(255,255,255,0.75)";
    c.lineWidth = 1.5;
    const spokes = 9;
    // Anchored in the top-left corner and fanning out a quarter turn.
    const angle = (i) => (i / (spokes - 1)) * (Math.PI / 2);
    for (let i = 0; i < spokes; i++) {
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(angle(i)) * w, Math.sin(angle(i)) * w);
      c.stroke();
    }
    for (let ring = 1; ring <= 7; ring++) {
      const rad = ring * (w / 7.5);
      c.beginPath();
      for (let i = 0; i < spokes; i++) {
        const a = angle(i);
        const x = Math.cos(a) * rad;
        const y = Math.sin(a) * rad;
        if (i === 0) c.moveTo(x, y);
        else {
          // Each thread sags toward the corner between spokes.
          const m = angle(i - 0.5);
          c.quadraticCurveTo(
            Math.cos(m) * rad * 0.86,
            Math.sin(m) * rad * 0.86,
            x,
            y,
          );
        }
      }
      c.stroke();
    }
  });
}

// Wood grain for the cabinet in the realistic theme. Tinted by the material colour.
export function woodGrain() {
  return canvasTexture(
    "wood",
    256,
    512,
    (c, w, h) => {
      const r = rng(11);
      c.fillStyle = "#c8c8c8";
      c.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 1) {
        const v =
          170 + Math.sin(x * 0.09 + Math.sin(x * 0.013) * 6) * 30 + r() * 20;
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.fillRect(x, 0, 1, h);
      }
    },
    { repeat: [1, 1] },
  );
}

// Wool rug: a fine noise so it reads as fabric under the studio light.
export function wool() {
  return canvasTexture(
    "wool",
    256,
    256,
    (c, w, h) => {
      const r = rng(5);
      c.fillStyle = "#d0d0d0";
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) {
        const v = 150 + r() * 105;
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.fillRect(r() * w, r() * h, 1, 2);
      }
    },
    { repeat: [6, 6] },
  );
}

// Carousel platform: radial wedges round the rug's centre.
export function wedges(a, b, n = 16) {
  return canvasTexture(`wedges:${a}:${b}`, 512, 512, (c, w, h) => {
    for (let i = 0; i < n; i++) {
      c.fillStyle = i % 2 ? a : b;
      c.beginPath();
      c.moveTo(w / 2, h / 2);
      c.arc(
        w / 2,
        h / 2,
        w,
        (i / n) * Math.PI * 2,
        ((i + 1) / n) * Math.PI * 2,
      );
      c.fill();
    }
    c.strokeStyle = "#f2c14e";
    c.lineWidth = 10;
    c.beginPath();
    c.arc(w / 2, h / 2, w / 2 - 6, 0, Math.PI * 2);
    c.stroke();
  });
}

// Candy-cane stripes for the carousel posts.
export function candy(a, b) {
  return canvasTexture(
    `candy:${a}:${b}`,
    64,
    64,
    (c, w, h) => {
      c.fillStyle = a;
      c.fillRect(0, 0, w, h);
      c.fillStyle = b;
      for (let i = -2; i < 4; i++) {
        c.beginPath();
        c.moveTo(i * 32, h);
        c.lineTo(i * 32 + 16, h);
        c.lineTo(i * 32 + 16 + h, 0);
        c.lineTo(i * 32 + h, 0);
        c.fill();
      }
    },
    { repeat: [1, 14] },
  );
}

// Greasy fingerprints and palm smudges for the 4K glass, as an alpha map: nearly clear, with
// cloudy patches low down where people lean on it.
export function smudges() {
  return canvasTexture(
    "smudges",
    512,
    512,
    (c, w, h) => {
      const r = rng(17);
      c.fillStyle = "rgb(13,13,13)";
      c.fillRect(0, 0, w, h);
      const blot = (x, y, rad, a) => {
        const g = c.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, rad, 0, Math.PI * 2);
        c.fill();
      };
      // Palm prints: a cluster of four fingertips over a smear.
      for (let i = 0; i < 4; i++) {
        const x = 40 + r() * (w - 80);
        const y = h * 0.55 + r() * h * 0.35;
        blot(x, y + 26, 30, 0.07);
        for (let f = 0; f < 4; f++)
          blot(x - 27 + f * 18, y - 8 - (f % 3) * 6, 8, 0.12);
      }
    },
    { color: false },
  );
}

export function sticker() {
  return canvasTexture("sticker", 256, 116, (c, w, h) => {
    c.fillStyle = "#fbf3d0";
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(0,0,0,0.15)";
    c.strokeRect(1, 1, w - 2, h - 2);
    c.fillStyle = "#c81e1e";
    c.textAlign = "center";
    c.font = '700 54px "Inter", sans-serif';
    c.fillText("50\u00a2", w / 2, 58);
    c.font = '700 18px "Inter", sans-serif';
    c.fillText("PER PLAY", w / 2, 82);
    c.fillStyle = "#1d3fa8";
    c.font = 'italic 15px "Comic Sans MS", "Fredoka", cursive';
    c.fillText("no refunds!! - mgmt", w / 2, 104);
  });
}

// A plain paper cup with a brown sleeve, wrapped round a cylinder.
export function coffeeSleeve() {
  return canvasTexture("coffee", 512, 256, (c, w, h) => {
    c.fillStyle = "#f4f1ea";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#8a5a36";
    c.fillRect(0, h * 0.3, w, h * 0.42);
    c.fillStyle = "#6f4529";
    for (let x = 0; x < w; x += 6) c.fillRect(x, h * 0.3, 2, h * 0.42);
    c.fillStyle = "#f4f1ea";
    c.font = '700 30px "Inter", sans-serif';
    c.textAlign = "center";
    c.fillText("CAUTION: HOT", w * 0.25, h * 0.56);
    c.fillText("CAUTION: HOT", w * 0.75, h * 0.56);
  });
}
