import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { RenderPixelatedPass } from "three/examples/jsm/postprocessing/RenderPixelatedPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { HorizontalTiltShiftShader } from "three/examples/jsm/shaders/HorizontalTiltShiftShader.js";
import { VerticalTiltShiftShader } from "three/examples/jsm/shaders/VerticalTiltShiftShader.js";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";
import { camera, renderer, scene } from "./scene.js";
import { theme } from "./settings.js";

// ---------- post-processing ----------

// Default and carousel render straight to the screen. 8-bit renders through a pixelating pass
// that also inks pixel-art outlines; 4K goes through a whole camera: ambient occlusion, bloom,
// tilt-shift focus, a touch of chromatic aberration, film grain and a vignette.
const size = new THREE.Vector2();
let composer = null;
let builtFor = null;
let tilt = [];
let pixelPass = null;

// About 220 chunky pixels from top to bottom, whatever the screen.
const pixelSize = (h) => Math.max(2, Math.round(h / 220));

function build(id) {
  renderer.getSize(size);
  const c = new EffectComposer(renderer);
  tilt = [];
  pixelPass = null;
  if (id === "retro") {
    pixelPass = new RenderPixelatedPass(pixelSize(size.y), scene, camera, {
      normalEdgeStrength: 0.35,
      depthEdgeStrength: 0.5,
    });
    c.addPass(pixelPass);
  } else {
    c.addPass(new RenderPass(scene, camera));
    const ao = new GTAOPass(scene, camera, size.x, size.y);
    ao.blendIntensity = 0.85;
    c.addPass(ao);
    c.addPass(new UnrealBloomPass(size.clone(), 0.16, 0.4, 0.96));
    // Tilt-shift: sharp across the middle of the machine, softening above and below.
    for (const shader of [HorizontalTiltShiftShader, VerticalTiltShiftShader]) {
      const pass = new ShaderPass(shader);
      pass.uniforms.r.value = 0.5;
      tilt.push(pass);
      c.addPass(pass);
    }
    const rgb = new ShaderPass(RGBShiftShader);
    rgb.uniforms.amount.value = 0.0012;
    c.addPass(rgb);
    c.addPass(new FilmPass(0.22));
    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 0.95;
    vignette.uniforms.darkness.value = 1.1;
    c.addPass(vignette);
  }
  c.addPass(new OutputPass());
  return c;
}

export const postFxComposer = () => composer;

export function sizePostFx() {
  if (!composer) return;
  renderer.getSize(size);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(size.x, size.y);
  if (pixelPass) pixelPass.setPixelSize(pixelSize(size.y));
  const [h, v] = tilt;
  if (h) h.uniforms.h.value = 1.4 / size.x;
  if (v) v.uniforms.v.value = 1.4 / size.y;
}

export function renderFrame() {
  const id = theme().id;
  if (id !== "retro" && id !== "real") {
    if (composer) {
      composer.dispose();
      composer = null;
      builtFor = null;
    }
    return renderer.render(scene, camera);
  }
  if (builtFor !== id) {
    composer?.dispose();
    composer = build(id);
    builtFor = id;
    sizePostFx();
  }
  composer.render();
}
