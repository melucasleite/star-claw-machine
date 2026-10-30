// End-to-end checks in a real browser (WebGL, physics, audio). Needs the app running:
//   yarn dev             (or yarn build && yarn start)
//   yarn test:e2e        (BASE_URL defaults to http://localhost:3000)
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let browser;

before(async () => {
  browser = await chromium.launch({
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
});
after(() => browser?.close());

// A fresh page with the help sheet dismissed. Collects page errors into `errors`.
async function open(settings) {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 760 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (settings)
    await page.addInitScript(
      (s) => localStorage.setItem("startclaw.settings.v1", JSON.stringify(s)),
      settings,
    );
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__claw);
  await page.click("[data-close-help]");
  return { page, errors, g: (expr, arg) => page.evaluate(expr, arg) };
}
const startAndAim = async ({ page, g }) => {
  await g(() => __claw.startGame());
  await page.waitForFunction(() => __claw.game.state === "aim", null, {
    timeout: 15000,
  });
};

test("every theme renders a run and plays its music without errors", async () => {
  const ctx = await open();
  await startAndAim(ctx);
  for (const id of ["default", "retro", "carousel", "real"]) {
    await ctx.g((t) => __claw.applyTheme(t), id);
    assert.equal(await ctx.g(() => document.body.dataset.theme), id);
    const step = await ctx.g(() => __claw.music.step);
    await wait(1500);
    assert.equal(await ctx.g(() => __claw.audioState()), "running");
    assert.notEqual(
      await ctx.g(() => __claw.music.step),
      step,
      `${id} music is stuck`,
    );
  }
  assert.deepEqual(ctx.errors, []);
  await ctx.page.close();
});

test("aim assist asks first, restarts the run and keeps it off the boards", async () => {
  const ctx = await open({ theme: "default", aimAssist: false });
  const { page, g } = ctx;
  await startAndAim(ctx);
  await g(() => (__claw.game.score = 1234));
  await page.click("[data-settings]");
  await page.click("[data-assist]");
  assert.equal(await page.textContent("#confirm-title"), "AIM ASSIST?");
  await page.click("#confirm-no");
  assert.equal(
    await g(() => __claw.game.score),
    1234,
    "cancel changes nothing",
  );
  await page.click("[data-assist]");
  await page.click("#confirm-yes");
  await page.waitForFunction(() => __claw.game.state === "aim", null, {
    timeout: 15000,
  });
  assert.equal(await g(() => __claw.game.score), 0, "turning it on restarts");
  assert.equal(await g(() => __claw.game.assisted), true);
  assert.equal(await page.isVisible("#assist-tag"), true);
  // A score that would top any board stays off them.
  await g(() => (__claw.game.score = 999999));
  await page.click("#quit");
  await page.click("#confirm-yes");
  assert.equal(await g(() => __claw.game.result.highscore), false);
  assert.equal(await page.isVisible("#panel form.name"), false);
  // Off mid-run restarts too.
  await startAndAim(ctx);
  await g(() => (__claw.game.score = 50));
  await page.click("[data-settings]");
  await page.click("[data-assist]");
  await page.click("#confirm-yes");
  assert.equal(await g(() => __claw.game.score), 0, "turning it off restarts");
  assert.equal(await g(() => __claw.game.assisted), false);
  assert.deepEqual(ctx.errors, []);
  await page.close();
});

test("a plushie that teeters on the chute guard and drops in counts as a catch", async () => {
  const ctx = await open({ theme: "default", aimAssist: false });
  await startAndAim(ctx);
  const result = await ctx.g(async () => {
    const { game, plushies } = __claw;
    game.lives = 3;
    const p = plushies[0];
    // Released just past the guard: it lands on the edge, hesitates, then tips into the hole.
    p.body.position.set(-1.5, 2.2, 2.7);
    p.body.velocity.set(-0.9, 0, 0);
    p.body.angularVelocity.set(0, 0, 0);
    game.turn = { kind: "reel", prizes: 0, result: "caught" };
    game.state = "release";
    game.t = 0;
    for (let i = 0; i < 80 && game.state === "release"; i++)
      await new Promise((r) => setTimeout(r, 100));
    await new Promise((r) => setTimeout(r, 500));
    return {
      lives: game.lives,
      bag: game.bag.length,
      inMachine: plushies.includes(p),
    };
  });
  assert.equal(result.inMachine, false, "the plushie went down the chute");
  assert.equal(result.bag, 1);
  // 3 hearts, no penalty, plus the half heart every catch heals.
  assert.equal(result.lives, 3.5);
  assert.deepEqual(ctx.errors, []);
  await ctx.page.close();
});
