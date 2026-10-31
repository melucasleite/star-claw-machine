import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { onTheme, theme } from "./settings.js";

// ---------- renderer / camera ----------

// Alpha, so a theme without a scene background (desktop) shows the page's painted sky behind.
export const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById("stage").appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2b1d14);

export const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 200);
export const CAM_TARGET = new THREE.Vector3(0, 3.4, 0.4);
export const CAM_OFFSET = new THREE.Vector3(30, 25, 30);
camera.position.copy(CAM_TARGET).add(CAM_OFFSET);
camera.lookAt(CAM_TARGET);

// Two screen segments (a dual-screen or folding phone spanned across its hinge), or null.
export function screenSegments() {
  let segs = null;
  try {
    segs = window.viewport?.segments ?? window.getWindowSegments?.();
  } catch {}
  if (!segs || segs.length !== 2) return null;
  return [...segs]
    .map((r) => ({
      x: r.x ?? r.left,
      y: r.y ?? r.top,
      width: r.width,
      height: r.height,
    }))
    .sort((a, b) => a.x - b.x || a.y - b.y);
}

export function resize() {
  // Measure the page itself: when a Surface Duo spans onto both screens, innerWidth can still
  // report the old single-screen width at the moment the resize event fires.
  const root = document.documentElement;
  const w = Math.max(root.clientWidth, innerWidth) || innerWidth;
  const h = Math.max(root.clientHeight, innerHeight) || innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, theme().scene.pixelRatio));
  renderer.setSize(w, h, false);
  // The cabinet is centred and fit in whichever axis is tighter. On a foldable spanning two
  // screens (Surface Duo) menus and the reel game still move to the second screen.
  const seg = screenSegments();
  document.body.classList.toggle("spanned", !!seg);
  if (seg)
    for (const [k, v] of Object.entries({
      x: seg[1].x,
      y: seg[1].y,
      w: seg[1].width,
      h: seg[1].height,
    }))
      document.body.style.setProperty(`--seg2-${k}`, `${v}px`);
  const scale = Math.min(h / 19.2, w / 15.2);
  const halfW = w / 2 / scale;
  const halfH = h / 2 / scale;
  camera.left = -halfW;
  camera.right = halfW;
  camera.top = halfH;
  camera.bottom = -halfH;
  camera.updateProjectionMatrix();
}

export const hemi = new THREE.HemisphereLight(0xfff1d6, 0x5a3b22, 1.1);
scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xffe2b0, 2.2);
sun.position.set(8, 20, 12);
sun.target.position.set(0, 2, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {
  left: -10,
  right: 10,
  top: 12,
  bottom: -10,
  near: 1,
  far: 60,
});
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);
export const lamp = new THREE.PointLight(0xffd59a, 25, 14, 2);
lamp.position.set(0, 9, 0);
scene.add(lamp);

export const std = (color, roughness = 0.7, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
export const M = {
  walnut: std(0x6b4226, 0.7),
  walnutDark: std(0x3a2a1a, 0.8),
  teal: std(0x1f6f6b, 0.6),
  mustard: std(0xd9a521, 0.45, 0.2),
  felt: std(0x2f8f86, 1),
  brass: std(0xc9a24a, 0.35, 0.8),
  // The corner posts: walnut by default, candy-striped on the carousel.
  post: std(0x6b4226, 0.7),
  black: std(0x161616, 0.5),
  red: std(0xc0392b, 0.4),
  pit: new THREE.MeshBasicMaterial({ color: 0x080604 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xd8f3f0,
    transparent: true,
    opacity: 0.1,
    roughness: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  acrylic: new THREE.MeshPhysicalMaterial({
    color: 0xbfe8ff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    depthWrite: false,
  }),
};

export function box(
  w,
  h,
  d,
  mat,
  x,
  y,
  z,
  { cast = true, receive = true } = {},
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  scene.add(m);
  return m;
}

// ---------- theme ----------

let roomEnv = null;
onTheme((t) => {
  const s = t.scene;
  scene.background =
    s.background === null
      ? null
      : (scene.background ?? new THREE.Color()).setHex(s.background);
  hemi.color.setHex(s.hemi[0]);
  hemi.groundColor.setHex(s.hemi[1]);
  hemi.intensity = s.hemi[2];
  sun.color.setHex(s.sun[0]);
  sun.intensity = s.sun[1];
  lamp.color.setHex(s.lamp);
  renderer.toneMapping =
    s.toneMapping === "none"
      ? THREE.NoToneMapping
      : THREE.ACESFilmicToneMapping;
  renderer.shadowMap.type =
    s.shadows === "hard" ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
  // A new shadow map size or type only takes once the old map is thrown away.
  sun.shadow.mapSize.set(s.shadowSize, s.shadowSize);
  sun.shadow.map?.dispose();
  sun.shadow.map = null;
  // Chrome, gold and glass need something to reflect: a studio room, generated once.
  if (s.environment && !roomEnv)
    roomEnv = new THREE.PMREMGenerator(renderer).fromScene(
      new RoomEnvironment(),
      0.04,
    ).texture;
  scene.environment = s.environment ? roomEnv : null;
  scene.environmentIntensity = s.environment || 1;
  for (const [k, [color, roughness, metalness = 0, opacity]] of Object.entries(
    s.materials,
  )) {
    const m = M[k];
    m.color.setHex(color);
    m.roughness = roughness;
    m.metalness = metalness;
    if (opacity !== undefined) m.opacity = opacity;
    m.flatShading = !!s.flat;
    m.map = null;
    m.alphaMap = null;
    m.envMapIntensity = 1;
    m.needsUpdate = true;
  }
  resize();
});
