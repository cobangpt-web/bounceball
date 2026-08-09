import { STR } from "./strings.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const devBox = document.getElementById("dev");
const pauseButton = document.getElementById("pause-button");
const soundButton = document.getElementById("sound-button");
const touchLeft = document.getElementById("touch-left");
const touchRight = document.getElementById("touch-right");

document.title = STR.documentTitle;
touchLeft.setAttribute("aria-label", STR.ariaLeft);
touchRight.setAttribute("aria-label", STR.ariaRight);
pauseButton.setAttribute("aria-label", STR.ariaPause);
soundButton.setAttribute("aria-label", STR.ariaSound);

const CONFIG = Object.freeze({
  stepMs: 1000 / 60,
  dprCap: 1.5,
  worldHeight: 900,
  ballRadius: 27,
  gravity: 2200,
  acceleration: 1650,
  maxSpeed: 355,
  airDrag: 0.988,
  idleDrag: 0.91,
  bounceSpeed: 835,
  springSpeed: 1130,
  springHeightRatio: 0.9,
  springTopInset: 10,
  springRecoilTime: 0.34,
  replaySampleInterval: 0.08,
  replayMaxSamples: 1500,
  landingTolerance: 14,
  deathDelay: 0.62,
  respawnGrace: 0.8,
  maxParticles: 64
});

const STYLE_FORMULA = "Flat vector cartoon with soft candy-like gradients; rounded geometric shapes with crisp navy outlines and subtle elastic squash-and-stretch; cool sky-blue and indigo environments, a warm coral hero that strongly contrasts the world, cyan goals, golden pickups, and vivid red-orange hazards; bright, playful arcade daylight with gentle bloom; high contrast between gameplay elements and backgrounds, clean readable silhouettes, restrained surface detail, and a consistent side-view perspective across every asset.";

const ASSET_URLS = Object.freeze({
  sky: "./assets/sky_backdrop.png",
  hero: "./assets/ball_hero.png",
  tile: "./assets/platform_tile.png",
  spike: "./assets/spike_hazard.png",
  spring: "./assets/spring_pad.png",
  portal: "./assets/goal_portal.png",
  star: "./assets/star_pickup.png",
  cover: "./assets/store_thumbnail.png"
});

const AUDIO_URLS = Object.freeze({
  bgm: "./assets/audio/bgm_sky_loop.wav",
  bounce: "./assets/audio/bounce.wav",
  spring: "./assets/audio/spring.wav",
  star: "./assets/audio/star.wav",
  clear: "./assets/audio/clear.wav",
  death: "./assets/audio/death.wav"
});

const platform = (x, y, w, kind = "normal", motion = null) =>
  Object.freeze({ x, y, w, h: 38, kind, motion });
const star = (x, y) => Object.freeze({ x, y });
const hazard = (x, y, w, h = 58) => Object.freeze({ x, y, w, h });
const spring = (platformIndex, offset, width = 92) =>
  Object.freeze({ platformIndex, offset, width });

const LEVELS = Object.freeze([
  Object.freeze({
    width: 2340,
    start: Object.freeze({ x: 125, y: 700 }),
    platforms: Object.freeze([
      platform(0, 790, 360),
      platform(430, 690, 230),
      platform(720, 590, 220),
      platform(1000, 690, 230),
      platform(1290, 570, 220),
      platform(1570, 470, 230),
      platform(1850, 580, 210),
      platform(2080, 460, 235)
    ]),
    hazards: Object.freeze([]),
    springs: Object.freeze([]),
    stars: Object.freeze([
      star(535, 605),
      star(1110, 605),
      star(1675, 385)
    ]),
    checkpoint: Object.freeze({ x: 1110, y: 690, respawnX: 1080, respawnY: 610 }),
    goal: Object.freeze({ x: 2195, y: 385 })
  }),
  Object.freeze({
    width: 2360,
    start: Object.freeze({ x: 120, y: 700 }),
    platforms: Object.freeze([
      platform(0, 790, 330),
      platform(405, 690, 215),
      platform(700, 760, 225),
      platform(990, 640, 220),
      platform(1280, 540, 215),
      platform(1555, 650, 210),
      platform(1820, 540, 215),
      platform(2080, 430, 240)
    ]),
    hazards: Object.freeze([
      hazard(328, 742, 78),
      hazard(620, 842, 80),
      hazard(925, 842, 65),
      hazard(1210, 842, 70),
      hazard(1495, 842, 60),
      hazard(1765, 842, 55)
    ]),
    springs: Object.freeze([]),
    stars: Object.freeze([
      star(515, 605),
      star(1095, 555),
      star(1930, 455)
    ]),
    checkpoint: Object.freeze({ x: 1385, y: 540, respawnX: 1340, respawnY: 465 }),
    goal: Object.freeze({ x: 2200, y: 355 })
  }),
  Object.freeze({
    width: 2310,
    start: Object.freeze({ x: 120, y: 700 }),
    platforms: Object.freeze([
      platform(0, 790, 345),
      platform(430, 635, 225),
      platform(730, 485, 225),
      platform(1030, 710, 275),
      platform(1395, 445, 235),
      platform(1710, 560, 225),
      platform(1995, 380, 250)
    ]),
    hazards: Object.freeze([
      hazard(345, 842, 85),
      hazard(945, 842, 85),
      hazard(1305, 842, 90)
    ]),
    springs: Object.freeze([
      spring(0, 205),
      spring(2, 90),
      spring(3, 155),
      spring(5, 75)
    ]),
    stars: Object.freeze([
      star(535, 545),
      star(840, 360),
      star(1510, 350)
    ]),
    checkpoint: Object.freeze({ x: 1160, y: 710, respawnX: 1100, respawnY: 630 }),
    goal: Object.freeze({ x: 2120, y: 305 })
  }),
  Object.freeze({
    width: 2530,
    start: Object.freeze({ x: 120, y: 700 }),
    platforms: Object.freeze([
      platform(0, 790, 340),
      platform(430, 680, 210, "moving", Object.freeze({ axis: "x", range: 92, speed: 1.15, phase: 0 })),
      platform(770, 570, 210, "moving", Object.freeze({ axis: "y", range: 70, speed: 1.35, phase: 1.1 })),
      platform(1060, 690, 205, "crumble"),
      platform(1350, 540, 225, "moving", Object.freeze({ axis: "x", range: 110, speed: 1.1, phase: 2.2 })),
      platform(1685, 650, 205, "crumble"),
      platform(1960, 500, 220, "moving", Object.freeze({ axis: "y", range: 62, speed: 1.25, phase: 0.7 })),
      platform(2260, 390, 235)
    ]),
    hazards: Object.freeze([
      hazard(340, 842, 90),
      hazard(670, 842, 100),
      hazard(980, 842, 80),
      hazard(1265, 842, 85),
      hazard(1575, 842, 110),
      hazard(1890, 842, 70),
      hazard(2180, 842, 80)
    ]),
    springs: Object.freeze([]),
    stars: Object.freeze([
      star(530, 575),
      star(1160, 595),
      star(2070, 395)
    ]),
    checkpoint: Object.freeze({ x: 1450, y: 540, respawnX: 1400, respawnY: 465 }),
    goal: Object.freeze({ x: 2375, y: 315 })
  }),
  Object.freeze({
    width: 2820,
    start: Object.freeze({ x: 120, y: 700 }),
    platforms: Object.freeze([
      platform(0, 790, 325),
      platform(420, 625, 215, "moving", Object.freeze({ axis: "x", range: 62, speed: 1.15, phase: 0.4 })),
      platform(710, 760, 205),
      platform(995, 610, 230),
      platform(1340, 335, 245),
      platform(1660, 500, 215, "moving", Object.freeze({ axis: "y", range: 62, speed: 1.3, phase: 1.4 })),
      platform(1935, 650, 210, "crumble"),
      platform(2220, 500, 215, "moving", Object.freeze({ axis: "x", range: 82, speed: 1.05, phase: 2.1 })),
      platform(2510, 360, 260)
    ]),
    hazards: Object.freeze([
      hazard(325, 842, 95),
      hazard(635, 842, 75),
      hazard(915, 842, 80),
      hazard(1225, 842, 115),
      hazard(1585, 842, 75),
      hazard(1875, 842, 60),
      hazard(2145, 842, 75),
      hazard(2435, 842, 75)
    ]),
    springs: Object.freeze([
      spring(0, 195),
      spring(3, 125),
      spring(6, 68)
    ]),
    stars: Object.freeze([
      star(520, 525),
      star(1110, 500),
      star(1460, 220)
    ]),
    checkpoint: Object.freeze({ x: 1450, y: 335, respawnX: 1410, respawnY: 258 }),
    goal: Object.freeze({ x: 2640, y: 285 })
  })
]);

const images = {};
let platformPattern = null;
let viewportWidth = innerWidth;
let viewportHeight = innerHeight;
let dpr = 1;
let cameraX = 0;
let cameraTargetX = 0;
let scale = 1;
let viewWorldWidth = CONFIG.worldHeight * (innerWidth / innerHeight);
let phase = "loading";
let previousPhase = "playing";
let currentLevelIndex = 0;
let level = LEVELS[0];
let runtimePlatforms = [];
let runtimeSprings = [];
let runtimeStars = [];
let currentReplay = null;
let nextReplaySampleAt = 0;
let localBestReplays = [];
let localLastReplays = [];
let onlineBestGhost = null;
let onlineFetchTicket = 0;
let simTime = 0;
let stageTime = 0;
let runTime = 0;
let clearReadyAt = 0;
let respawnAt = 0;
let checkpointActive = false;
let checkpointMessageUntil = 0;
let deathMessageUntil = 0;
let completedStars = 0;
let stageCollected = 0;
let drawCalls = 0;
let shake = 0;
let randomSeed = 0x5f3759df;

const ball = {
  x: 0,
  y: 0,
  prevX: 0,
  prevY: 0,
  vx: 0,
  vy: 0,
  radius: CONFIG.ballRadius,
  squash: 0,
  graceUntil: 0
};

const particles = Array.from({ length: CONFIG.maxParticles }, () => ({
  active: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  life: 0,
  maxLife: 0,
  size: 0,
  color: "#ffffff"
}));

const input = {
  keyLeft: false,
  keyRight: false,
  touchLeft: false,
  touchRight: false,
  padLeft: false,
  padRight: false,
  actionPulse: false,
  restartPulse: false,
  pausePulse: false,
  padActionWasDown: false,
  padPauseWasDown: false
};

let muted = localStorage.getItem("bounce-up-muted") === "1";
let audioContext = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let musicSource = null;
let audioLoadPromise = null;
let nextMusicAt = 0;
let musicStep = 0;
const audioBuffers = {};

const bestTimes = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem("bounce-up-best") || "[]");
    return Array.from({ length: LEVELS.length }, (_, i) =>
      Number.isFinite(saved[i]) ? saved[i] : null
    );
  } catch {
    return Array(LEVELS.length).fill(null);
  }
})();

function saveBestTimes() {
  try {
    localStorage.setItem("bounce-up-best", JSON.stringify(bestTimes));
  } catch {
    // Storage can be disabled without affecting play.
  }
}

function emptyReplaySlots() {
  return Array.from({ length: LEVELS.length }, () => null);
}

function isReplay(value) {
  return value &&
    Number.isInteger(value.levelIndex) &&
    Number.isFinite(value.time) &&
    Array.isArray(value.samples) &&
    value.samples.length > 1;
}

function loadReplaySlots(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.from({ length: LEVELS.length }, (_, index) =>
      isReplay(saved[index]) ? saved[index] : null
    );
  } catch {
    return emptyReplaySlots();
  }
}

function saveReplaySlots(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ghost replay storage is optional; gameplay still works if full or blocked.
  }
}

localBestReplays = loadReplaySlots("bounce-up-best-replays");
localLastReplays = loadReplaySlots("bounce-up-last-replays");

function onlineConfig() {
  const config = window.BOUNCE_UP_ONLINE;
  if (!config || typeof config !== "object") return null;
  const supabaseUrl = String(config.supabaseUrl || "").replace(/\/$/, "");
  const anonKey = String(config.anonKey || "");
  const table = String(config.table || "bounce_up_runs");
  if (!supabaseUrl || !anonKey) return null;
  return {
    supabaseUrl,
    anonKey,
    table,
    playerName: String(config.playerName || localStorage.getItem("bounce-up-player") || "익명")
  };
}

function onlineHeaders(config, extra = {}) {
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function fetchOnlineBestGhost(levelIndex) {
  const config = onlineConfig();
  const ticket = ++onlineFetchTicket;
  onlineBestGhost = null;
  if (!config) return;
  const query = `select=player_name,time,stars,replay&level_index=eq.${levelIndex}` +
    "&order=stars.desc,time.asc&limit=1";
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${config.table}?${query}`, {
      headers: onlineHeaders(config)
    });
    if (!response.ok) return;
    const rows = await response.json();
    const record = rows?.[0];
    if (ticket !== onlineFetchTicket || !isReplay(record?.replay)) return;
    onlineBestGhost = {
      ...record.replay,
      label: record.player_name ? `${record.player_name} 1등` : STR.onlineBestGhost,
      online: true
    };
  } catch {
    // The online ghost is a bonus layer; failures should never interrupt play.
  }
}

async function submitOnlineReplay(replay) {
  const config = onlineConfig();
  if (!config || !isReplay(replay)) return;
  try {
    await fetch(`${config.supabaseUrl}/rest/v1/${config.table}`, {
      method: "POST",
      headers: onlineHeaders(config, { Prefer: "return=minimal" }),
      body: JSON.stringify({
        level_index: replay.levelIndex,
        player_name: config.playerName.slice(0, 24),
        time: Number(replay.time.toFixed(3)),
        stars: replay.stars,
        replay
      })
    });
  } catch {
    // Online upload is best-effort.
  }
}

function nextRandom() {
  randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
  return randomSeed / 4294967296;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds - minutes * 60).toFixed(1).padStart(4, "0");
  return `${minutes}:${rest}`;
}

function resize() {
  viewportWidth = Math.max(1, innerWidth);
  viewportHeight = Math.max(1, innerHeight);
  dpr = Math.min(devicePixelRatio || 1, CONFIG.dprCap);
  canvas.width = Math.round(viewportWidth * dpr);
  canvas.height = Math.round(viewportHeight * dpr);
  canvas.style.width = `${viewportWidth}px`;
  canvas.style.height = `${viewportHeight}px`;
  scale = viewportHeight / CONFIG.worldHeight;
  viewWorldWidth = viewportWidth / scale;
}

addEventListener("resize", resize);
addEventListener("orientationchange", resize);
resize();

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(url));
    image.src = url;
  });
}

async function loadAssets() {
  const entries = Object.entries(ASSET_URLS);
  const loaded = await Promise.all(entries.map(([, url]) => loadImage(url)));
  entries.forEach(([key], index) => {
    images[key] = loaded[index];
  });
  platformPattern = ctx.createPattern(images.tile, "repeat");
  if (platformPattern?.setTransform) {
    platformPattern.setTransform(new DOMMatrix().scale(0.25));
  }
  phase = "menu";
}

function ensureAudio() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    audioContext = new AudioCtor();
    masterGain = audioContext.createGain();
    sfxGain = audioContext.createGain();
    musicGain = audioContext.createGain();
    masterGain.gain.value = muted ? 0 : 0.58;
    sfxGain.gain.value = 0.3;
    musicGain.gain.value = 0.075;
    sfxGain.connect(masterGain);
    musicGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
    nextMusicAt = audioContext.currentTime + 0.05;
  }
  if (audioContext.state === "suspended") audioContext.resume();
  void loadAudioAssets().then(startMusicLoop);
}

function loadAudioAssets() {
  if (!audioContext) return Promise.resolve();
  if (audioLoadPromise) return audioLoadPromise;
  const entries = Object.entries(AUDIO_URLS);
  audioLoadPromise = Promise.all(entries.map(async ([key, url]) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(url);
    const data = await response.arrayBuffer();
    audioBuffers[key] = await audioContext.decodeAudioData(data);
  })).catch(() => {
    // Procedural WebAudio remains as a fallback if decoded assets fail.
  });
  return audioLoadPromise;
}

function stopMusicLoop() {
  if (!musicSource) return;
  try {
    musicSource.stop();
  } catch {
    // The source may already be stopped by the browser.
  }
  musicSource.disconnect();
  musicSource = null;
}

function startMusicLoop() {
  if (!audioContext || muted || musicSource || phase === "loading") return;
  const buffer = audioBuffers.bgm;
  if (!buffer) return;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(musicGain);
  source.start();
  source.onended = () => {
    if (musicSource === source) musicSource = null;
  };
  musicSource = source;
}

function playBuffer(name, amount = 1, rate = 1) {
  const buffer = audioBuffers[name];
  if (!audioContext || muted || !buffer) return false;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  gain.gain.value = amount;
  source.connect(gain);
  gain.connect(sfxGain);
  source.start();
  return true;
}

function playSweep(from, to, duration, type = "sine", amount = 0.4, delay = 0) {
  if (!audioContext || muted) return;
  const start = audioContext.currentTime + delay;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(amount, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function soundBounce(isSpring) {
  if (playBuffer(isSpring ? "spring" : "bounce", isSpring ? 0.62 : 0.46)) return;
  playSweep(isSpring ? 260 : 175, isSpring ? 620 : 235, isSpring ? 0.2 : 0.12, "triangle", isSpring ? 0.42 : 0.25);
}

function soundCollect() {
  if (playBuffer("star", 0.54)) return;
  playSweep(620, 840, 0.12, "sine", 0.28);
  playSweep(880, 1180, 0.16, "sine", 0.22, 0.075);
}

function soundClear() {
  if (playBuffer("clear", 0.58)) return;
  playSweep(440, 660, 0.2, "triangle", 0.28);
  playSweep(660, 880, 0.22, "triangle", 0.25, 0.13);
  playSweep(880, 1320, 0.32, "triangle", 0.22, 0.28);
}

function soundDeath() {
  if (playBuffer("death", 0.5)) return;
  playSweep(220, 75, 0.32, "square", 0.16);
}

function updateMusic() {
  if (!audioContext || muted || phase === "loading") return;
  if (audioBuffers.bgm) {
    startMusicLoop();
    return;
  }
  const pattern = [262, 330, 392, 523, 392, 330, 294, 392, 330, 392, 494, 659, 494, 392, 330, 294];
  while (nextMusicAt < audioContext.currentTime + 0.12) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = nextMusicAt;
    osc.type = musicStep % 4 === 0 ? "triangle" : "sine";
    osc.frequency.value = pattern[musicStep % pattern.length];
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.19);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(start);
    osc.stop(start + 0.22);
    musicStep += 1;
    nextMusicAt += 0.24;
  }
}

function toggleSound() {
  muted = !muted;
  localStorage.setItem("bounce-up-muted", muted ? "1" : "0");
  ensureAudio();
  if (masterGain && audioContext) {
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.58, audioContext.currentTime + 0.08);
  }
  if (muted) stopMusicLoop();
  else startMusicLoop();
  soundButton.classList.toggle("active", !muted);
  soundButton.title = muted ? STR.soundOff : STR.soundOn;
}

soundButton.classList.toggle("active", !muted);
soundButton.title = muted ? STR.soundOff : STR.soundOn;

function platformPosition(runtime) {
  const motion = runtime.definition.motion;
  runtime.cx = runtime.definition.x;
  runtime.cy = runtime.definition.y;
  if (!motion) return;
  const offset = Math.sin(simTime * motion.speed + motion.phase) * motion.range;
  if (motion.axis === "x") runtime.cx += offset;
  else runtime.cy += offset;
}

function springHeight(springDefinition) {
  return springDefinition.width * CONFIG.springHeightRatio;
}

function springSurface(runtime, springDefinition) {
  return runtime.cy - springHeight(springDefinition) + 8 + CONFIG.springTopInset;
}

function loadLevel(index, resetRun = false) {
  currentLevelIndex = index;
  level = LEVELS[index];
  runtimePlatforms = level.platforms.map((definition) => ({
    definition,
    cx: definition.x,
    cy: definition.y,
    active: true,
    breakAt: 0,
    restoreAt: 0
  }));
  runtimeSprings = level.springs.map((definition) => ({
    definition,
    compression: 0
  }));
  runtimeStars = level.stars.map((definition) => ({ definition, collected: false }));
  stageCollected = 0;
  checkpointActive = false;
  checkpointMessageUntil = 0;
  deathMessageUntil = 0;
  stageTime = 0;
  if (resetRun) {
    runTime = 0;
    completedStars = 0;
  }
  resetBall(level.start.x, level.start.y);
  phase = "playing";
  startReplayRecording();
  void fetchOnlineBestGhost(currentLevelIndex);
  cameraX = 0;
  cameraTargetX = 0;
}

function resetBall(x, y) {
  ball.x = x;
  ball.y = y;
  ball.prevX = x;
  ball.prevY = y;
  ball.vx = 0;
  ball.vy = -CONFIG.bounceSpeed;
  ball.squash = 0;
  ball.graceUntil = simTime + CONFIG.respawnGrace;
}

function startReplayRecording() {
  currentReplay = {
    version: 1,
    levelIndex: currentLevelIndex,
    levelName: STR.stageNames[currentLevelIndex],
    time: 0,
    stars: 0,
    samples: []
  };
  nextReplaySampleAt = 0;
  recordReplaySample(true);
}

function recordReplaySample(force = false) {
  if (!currentReplay || phase !== "playing") return;
  if (!force && stageTime < nextReplaySampleAt) return;
  if (currentReplay.samples.length >= CONFIG.replayMaxSamples) {
    currentReplay.samples.shift();
  }
  currentReplay.samples.push({
    t: Number(stageTime.toFixed(3)),
    x: Number(ball.x.toFixed(1)),
    y: Number(ball.y.toFixed(1)),
    vx: Number(ball.vx.toFixed(1)),
    vy: Number(ball.vy.toFixed(1))
  });
  nextReplaySampleAt = stageTime + CONFIG.replaySampleInterval;
}

function finishReplay() {
  if (!currentReplay) return null;
  recordReplaySample(true);
  const replay = {
    ...currentReplay,
    time: Number(stageTime.toFixed(3)),
    stars: stageCollected,
    samples: currentReplay.samples.slice()
  };
  currentReplay = null;
  localLastReplays[currentLevelIndex] = replay;
  saveReplaySlots("bounce-up-last-replays", localLastReplays);
  return replay;
}

function replayIsBetter(candidate, current) {
  if (!isReplay(candidate)) return false;
  if (!isReplay(current)) return true;
  if ((candidate.stars || 0) !== (current.stars || 0)) {
    return (candidate.stars || 0) > (current.stars || 0);
  }
  return candidate.time < current.time;
}

function restartLevel() {
  loadLevel(currentLevelIndex, false);
}

function respawn() {
  const source = checkpointActive
    ? { x: level.checkpoint.respawnX, y: level.checkpoint.respawnY }
    : level.start;
  resetBall(source.x, source.y);
  phase = "playing";
  deathMessageUntil = simTime + 0.9;
}

function die() {
  if (phase !== "playing" || simTime < ball.graceUntil) return;
  soundDeath();
  shake = 12;
  spawnBurst(ball.x, ball.y, "#ff654f", 16, 250);
  phase = "dead";
  respawnAt = simTime + CONFIG.deathDelay;
}

function spawnBurst(x, y, color, count, speed) {
  let spawned = 0;
  for (let i = 0; i < particles.length && spawned < count; i += 1) {
    const particle = particles[i];
    if (particle.active) continue;
    const angle = nextRandom() * Math.PI * 2;
    const velocity = speed * (0.45 + nextRandom() * 0.55);
    particle.active = true;
    particle.x = x;
    particle.y = y;
    particle.vx = Math.cos(angle) * velocity;
    particle.vy = Math.sin(angle) * velocity - 80;
    particle.life = 0.4 + nextRandom() * 0.35;
    particle.maxLife = particle.life;
    particle.size = 4 + nextRandom() * 8;
    particle.color = color;
    spawned += 1;
  }
}

function updateParticles(dt) {
  for (const particle of particles) {
    if (!particle.active) continue;
    particle.life -= dt;
    if (particle.life <= 0) {
      particle.active = false;
      continue;
    }
    particle.vy += 520 * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }
}

function circleHitsRect(cx, cy, radius, rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function pollGamepad() {
  input.padLeft = false;
  input.padRight = false;
  const pads = navigator.getGamepads?.() || [];
  for (const pad of pads) {
    if (!pad) continue;
    const axis = pad.axes[0] || 0;
    input.padLeft ||= axis < -0.25 || Boolean(pad.buttons[14]?.pressed);
    input.padRight ||= axis > 0.25 || Boolean(pad.buttons[15]?.pressed);
    const actionDown = Boolean(pad.buttons[0]?.pressed);
    const pauseDown = Boolean(pad.buttons[9]?.pressed);
    if (actionDown && !input.padActionWasDown) input.actionPulse = true;
    if (pauseDown && !input.padPauseWasDown) input.pausePulse = true;
    input.padActionWasDown = actionDown;
    input.padPauseWasDown = pauseDown;
    break;
  }
}

function consumeMetaInput() {
  if (input.pausePulse) {
    input.pausePulse = false;
    togglePause();
  }
  if (input.restartPulse) {
    input.restartPulse = false;
    if (phase === "playing" || phase === "dead" || phase === "paused") restartLevel();
  }
  if (!input.actionPulse) return;
  input.actionPulse = false;
  ensureAudio();
  if (phase === "menu") {
    loadLevel(0, true);
  } else if (phase === "paused") {
    phase = previousPhase === "dead" ? "playing" : previousPhase;
  } else if (phase === "stageClear" && simTime >= clearReadyAt) {
    loadLevel(currentLevelIndex + 1, false);
  } else if (phase === "complete") {
    loadLevel(0, true);
  }
}

function togglePause() {
  if (phase === "loading" || phase === "menu" || phase === "complete") return;
  if (phase === "paused") {
    phase = previousPhase;
  } else {
    previousPhase = phase;
    phase = "paused";
  }
}

function update(dt) {
  simTime += dt;
  pollGamepad();
  consumeMetaInput();
  updateMusic();
  updateParticles(dt);
  if (phase === "dead" && simTime >= respawnAt) respawn();
  if (phase !== "playing") return;

  stageTime += dt;
  runTime += dt;
  ball.prevX = ball.x;
  ball.prevY = ball.y;

  for (const runtime of runtimePlatforms) {
    platformPosition(runtime);
    if (!runtime.active && simTime >= runtime.restoreAt) {
      runtime.active = true;
      runtime.breakAt = 0;
    }
    if (runtime.active && runtime.breakAt > 0 && simTime >= runtime.breakAt) {
      runtime.active = false;
      runtime.restoreAt = simTime + 2.1;
    }
  }
  for (const springRuntime of runtimeSprings) {
    springRuntime.compression = Math.max(0, springRuntime.compression - dt / CONFIG.springRecoilTime);
  }

  const wantsLeft = input.keyLeft || input.touchLeft || input.padLeft;
  const wantsRight = input.keyRight || input.touchRight || input.padRight;
  const direction = wantsLeft === wantsRight ? 0 : wantsLeft ? -1 : 1;
  if (direction !== 0) {
    ball.vx += direction * CONFIG.acceleration * dt;
  } else {
    ball.vx *= Math.pow(CONFIG.idleDrag, dt * 60);
  }
  ball.vx *= Math.pow(CONFIG.airDrag, dt * 60);
  ball.vx = clamp(ball.vx, -CONFIG.maxSpeed, CONFIG.maxSpeed);
  ball.vy += CONFIG.gravity * dt;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.x = clamp(ball.x, ball.radius, level.width - ball.radius);

  const previousBottom = ball.prevY + ball.radius;
  const currentBottom = ball.y + ball.radius;
  let springLanding = null;
  if (ball.vy > 0) {
    for (const springRuntime of runtimeSprings) {
      const springDefinition = springRuntime.definition;
      const runtime = runtimePlatforms[springDefinition.platformIndex];
      if (!runtime?.active) continue;
      const springX = runtime.cx + springDefinition.offset;
      const springY = springSurface(runtime, springDefinition);
      const insideX = ball.x + ball.radius * 0.35 > springX &&
        ball.x - ball.radius * 0.35 < springX + springDefinition.width;
      const crossedTop = previousBottom <= springY + CONFIG.landingTolerance &&
        currentBottom >= springY;
      if (insideX && crossedTop) {
        if (!springLanding || springY < springLanding.y) {
          springLanding = { runtime, springRuntime, springDefinition, x: springX, y: springY };
        }
      }
    }
  }

  let landed = null;
  if (ball.vy > 0 && !springLanding) {
    for (let i = 0; i < runtimePlatforms.length; i += 1) {
      const runtime = runtimePlatforms[i];
      if (!runtime.active) continue;
      const definition = runtime.definition;
      const insideX = ball.x + ball.radius * 0.62 > runtime.cx &&
        ball.x - ball.radius * 0.62 < runtime.cx + definition.w;
      const crossedTop = previousBottom <= runtime.cy + CONFIG.landingTolerance &&
        currentBottom >= runtime.cy;
      if (insideX && crossedTop) {
        if (!landed || runtime.cy < landed.runtime.cy) landed = { runtime, index: i };
      }
    }
  }

  if (springLanding) {
    ball.y = springLanding.y - ball.radius;
    ball.vy = -CONFIG.springSpeed;
    ball.squash = 1.4;
    springLanding.springRuntime.compression = 1;
    soundBounce(true);
    spawnBurst(ball.x, springLanding.y, "#35e5f4", 12, 230);
    if (springLanding.runtime.definition.kind === "crumble" && springLanding.runtime.breakAt === 0) {
      springLanding.runtime.breakAt = simTime + 0.34;
    }
  } else if (landed) {
    ball.y = landed.runtime.cy - ball.radius;
    ball.vy = -CONFIG.bounceSpeed;
    ball.squash = 1;
    soundBounce(false);
    spawnBurst(ball.x, landed.runtime.cy, "#ffffff", 5, 120);
    if (landed.runtime.definition.kind === "crumble" && landed.runtime.breakAt === 0) {
      landed.runtime.breakAt = simTime + 0.34;
    }
  }

  ball.squash = Math.max(0, ball.squash - dt * 5.5);
  recordReplaySample();

  for (const spike of level.hazards) {
    const hitbox = {
      x: spike.x + 7,
      y: spike.y + 10,
      w: spike.w - 14,
      h: spike.h - 10
    };
    if (circleHitsRect(ball.x, ball.y, ball.radius * 0.64, hitbox)) {
      die();
      return;
    }
  }

  if (ball.y - ball.radius > CONFIG.worldHeight + 80) {
    die();
    return;
  }

  if (!checkpointActive && ball.x >= level.checkpoint.x &&
      Math.abs(ball.y - level.checkpoint.y) < 250) {
    checkpointActive = true;
    checkpointMessageUntil = simTime + 1.25;
    spawnBurst(level.checkpoint.x, level.checkpoint.y - 70, "#35e5f4", 18, 190);
    soundCollect();
  }

  for (const runtimeStar of runtimeStars) {
    if (runtimeStar.collected) continue;
    const dx = ball.x - runtimeStar.definition.x;
    const dy = ball.y - runtimeStar.definition.y;
    if (dx * dx + dy * dy < 48 * 48) {
      runtimeStar.collected = true;
      stageCollected += 1;
      soundCollect();
      spawnBurst(runtimeStar.definition.x, runtimeStar.definition.y, "#ffd83d", 14, 220);
    }
  }

  const goalDx = ball.x - level.goal.x;
  const goalDy = ball.y - level.goal.y;
  if (goalDx * goalDx + goalDy * goalDy < 72 * 72) {
    completeStage();
    return;
  }

  const desiredCamera = ball.x - viewWorldWidth * 0.38;
  cameraTargetX = clamp(desiredCamera, 0, Math.max(0, level.width - viewWorldWidth));
  cameraX += (cameraTargetX - cameraX) * Math.min(1, dt * 6.5);
  shake = Math.max(0, shake - dt * 24);
}

function completeStage() {
  completedStars += stageCollected;
  const replay = finishReplay();
  const best = bestTimes[currentLevelIndex];
  if (best === null || stageTime < best) {
    bestTimes[currentLevelIndex] = stageTime;
    saveBestTimes();
  }
  if (replayIsBetter(replay, localBestReplays[currentLevelIndex])) {
    localBestReplays[currentLevelIndex] = replay;
    saveReplaySlots("bounce-up-best-replays", localBestReplays);
  }
  if (replay) void submitOnlineReplay(replay);
  soundClear();
  spawnBurst(level.goal.x, level.goal.y, "#42efff", 28, 280);
  shake = 8;
  if (currentLevelIndex === LEVELS.length - 1) {
    phase = "complete";
  } else {
    phase = "stageClear";
    clearReadyAt = simTime + 0.65;
  }
}

function roundedRectPath(x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCrackPath(points, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.stroke();
}

function drawCrumbleCracks(x, y, w, h) {
  const cracks = [
    [
      [x + w * 0.12, y + h * 0.22],
      [x + w * 0.27, y + h * 0.48],
      [x + w * 0.41, y + h * 0.28],
      [x + w * 0.55, y + h * 0.72],
      [x + w * 0.71, y + h * 0.43],
      [x + w * 0.86, y + h * 0.68]
    ],
    [
      [x + w * 0.28, y + h * 0.18],
      [x + w * 0.34, y + h * 0.44],
      [x + w * 0.25, y + h * 0.78]
    ],
    [
      [x + w * 0.63, y + h * 0.16],
      [x + w * 0.58, y + h * 0.42],
      [x + w * 0.68, y + h * 0.86]
    ]
  ];
  for (const points of cracks) drawCrackPath(points, 9, "rgba(37,13,58,.72)");
  for (const points of cracks) drawCrackPath(points, 5, "#24113b");
  for (const points of cracks) drawCrackPath(points.map(([px, py]) => [px - 2, py - 2]), 2.5, "rgba(255,246,174,.86)");
}

function drawPlatform(runtime) {
  const definition = runtime.definition;
  if (!runtime.active) return;
  const fade = runtime.breakAt > 0
    ? clamp((runtime.breakAt - simTime) / 0.34, 0.15, 1)
    : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  roundedRectPath(runtime.cx, runtime.cy, definition.w, definition.h, 16);
  ctx.clip();
  if (definition.kind === "crumble") {
    const gradient = ctx.createLinearGradient(runtime.cx, runtime.cy, runtime.cx, runtime.cy + definition.h);
    gradient.addColorStop(0, "#ffcf63");
    gradient.addColorStop(0.55, "#c778d8");
    gradient.addColorStop(1, "#71398f");
    ctx.fillStyle = gradient;
    ctx.fillRect(runtime.cx, runtime.cy, definition.w, definition.h);
    ctx.fillStyle = "rgba(255,246,174,.72)";
    ctx.fillRect(runtime.cx, runtime.cy, definition.w, 7);
    ctx.fillStyle = "rgba(54,20,88,.42)";
    ctx.fillRect(runtime.cx, runtime.cy + definition.h * 0.58, definition.w, definition.h * 0.42);
    drawCrumbleCracks(runtime.cx, runtime.cy, definition.w, definition.h);
  } else {
    ctx.fillStyle = platformPattern || "#2768d8";
    ctx.fillRect(runtime.cx, runtime.cy, definition.w, definition.h);
    ctx.fillStyle = "rgba(6,26,78,.35)";
    ctx.fillRect(runtime.cx, runtime.cy + definition.h * 0.56, definition.w, definition.h * 0.44);
    ctx.fillStyle = "rgba(139,244,255,.84)";
    ctx.fillRect(runtime.cx, runtime.cy, definition.w, 7);
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.strokeStyle = definition.kind === "crumble" ? "#3b185a" : "#071c4b";
  ctx.lineWidth = 5;
  roundedRectPath(runtime.cx, runtime.cy, definition.w, definition.h, 16);
  ctx.stroke();
  if (definition.kind === "crumble") {
    ctx.fillStyle = "rgba(255,232,110,.92)";
    for (let x = runtime.cx + 17; x < runtime.cx + definition.w - 12; x += 40) {
      ctx.beginPath();
      ctx.arc(x, runtime.cy + 12, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (definition.kind === "moving") {
    ctx.strokeStyle = "rgba(58,229,246,.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(runtime.cx + definition.w * 0.38, runtime.cy + definition.h * 0.72);
    ctx.lineTo(runtime.cx + definition.w * 0.5, runtime.cy + definition.h * 0.45);
    ctx.lineTo(runtime.cx + definition.w * 0.62, runtime.cy + definition.h * 0.72);
    ctx.stroke();
  }
  ctx.restore();
  drawCalls += 1;
}

function drawCheckpoint() {
  const x = level.checkpoint.x;
  const y = level.checkpoint.y;
  const pulse = 0.75 + Math.sin(simTime * 5) * 0.14;
  ctx.save();
  ctx.globalAlpha = checkpointActive ? 0.95 : 0.72;
  ctx.shadowColor = "#26e4f4";
  ctx.shadowBlur = checkpointActive ? 24 : 13;
  const gradient = ctx.createLinearGradient(x, y - 120, x, y);
  gradient.addColorStop(0, "rgba(255,246,174,0)");
  gradient.addColorStop(0.45, "rgba(71,238,255,.9)");
  gradient.addColorStop(1, "rgba(17,72,157,.9)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(x, y - 125 * pulse);
  ctx.lineTo(x + 14, y - 20);
  ctx.lineTo(x + 36, y);
  ctx.lineTo(x - 36, y);
  ctx.lineTo(x - 14, y - 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = checkpointActive ? "#fff4a6" : "#36dfee";
  ctx.beginPath();
  ctx.arc(x, y - 52, 10 + pulse * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawCalls += 1;
}

function replaySampleAt(replay, time) {
  if (!isReplay(replay)) return null;
  const samples = replay.samples;
  if (time <= samples[0].t) return samples[0];
  const last = samples[samples.length - 1];
  if (time >= last.t) return last;
  let low = 0;
  let high = samples.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (samples[mid].t <= time) low = mid;
    else high = mid;
  }
  const a = samples[low];
  const b = samples[high];
  const ratio = clamp((time - a.t) / Math.max(0.001, b.t - a.t), 0, 1);
  return {
    t: time,
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio,
    vx: a.vx + (b.vx - a.vx) * ratio,
    vy: a.vy + (b.vy - a.vy) * ratio
  };
}

function activeGhosts() {
  const ghosts = [];
  const local = localBestReplays[currentLevelIndex];
  if (isReplay(local)) {
    ghosts.push({
      replay: local,
      label: STR.localBestGhost,
      color: "#7beeff",
      alpha: 0.48
    });
  }
  if (isReplay(onlineBestGhost) && onlineBestGhost.levelIndex === currentLevelIndex) {
    const duplicateLocal = local &&
      Math.abs((onlineBestGhost.time || 0) - (local.time || 0)) < 0.001 &&
      (onlineBestGhost.stars || 0) === (local.stars || 0);
    if (!duplicateLocal) {
      ghosts.push({
        replay: onlineBestGhost,
        label: onlineBestGhost.label || STR.onlineBestGhost,
        color: "#ffe86e",
        alpha: 0.44
      });
    }
  }
  return ghosts;
}

function drawGhosts() {
  const ghosts = activeGhosts();
  if (ghosts.length === 0) return;
  const size = 78;
  for (let i = 0; i < ghosts.length; i += 1) {
    const ghost = ghosts[i];
    const sample = replaySampleAt(ghost.replay, stageTime);
    if (!sample) continue;
    const pastFinish = stageTime > ghost.replay.time;
    const alpha = pastFinish ? ghost.alpha * 0.48 : ghost.alpha;
    const stretch = clamp(-sample.vy / 1700, -0.12, 0.12);
    const squashX = 1 - stretch * 0.25;
    const squashY = 1 + stretch;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sample.x, sample.y);
    ctx.rotate(sample.vx * 0.00038);
    ctx.scale(squashX, squashY);
    ctx.drawImage(images.hero, -size / 2, -size / 2, size, size);
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = ghost.color;
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha + 0.22;
    ctx.strokeStyle = ghost.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(sample.x, sample.y, 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alpha + 0.24;
    ctx.fillStyle = ghost.color;
    ctx.strokeStyle = "rgba(7,28,75,.9)";
    ctx.lineWidth = 4;
    ctx.font = "900 24px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelY = sample.y - 62 - i * 24;
    ctx.strokeText(ghost.label, sample.x, labelY);
    ctx.fillText(ghost.label, sample.x, labelY);
    ctx.restore();
    drawCalls += 1;
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function drawWorld() {
  const jitterX = shake > 0 ? (nextRandom() - 0.5) * shake : 0;
  const jitterY = shake > 0 ? (nextRandom() - 0.5) * shake * 0.6 : 0;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, (-cameraX + jitterX) * dpr * scale, jitterY * dpr * scale);

  for (const runtime of runtimePlatforms) drawPlatform(runtime);

  for (const springRuntime of runtimeSprings) {
    const springDefinition = springRuntime.definition;
    const runtime = runtimePlatforms[springDefinition.platformIndex];
    if (!runtime?.active) continue;
    const width = springDefinition.width;
    const height = springHeight(springDefinition);
    const t = springRuntime.compression;
    const recoil = Math.sin((1 - t) * Math.PI * 2) * t;
    const scaleX = 1 + t * 0.18 - recoil * 0.06;
    const scaleY = 1 - t * 0.26 + recoil * 0.34;
    const x = runtime.cx + springDefinition.offset;
    const y = runtime.cy - height + 8;
    ctx.save();
    ctx.translate(x + width / 2, runtime.cy + 8);
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(images.spring, -width / 2, -height, width, height);
    ctx.restore();
    drawCalls += 1;
  }

  for (const spike of level.hazards) {
    ctx.drawImage(images.spike, spike.x, spike.y, spike.w, spike.h);
    drawCalls += 1;
  }

  drawCheckpoint();

  for (let i = 0; i < runtimeStars.length; i += 1) {
    const runtimeStar = runtimeStars[i];
    if (runtimeStar.collected) continue;
    const bob = Math.sin(simTime * 3.2 + i * 1.7) * 7;
    const size = 76;
    ctx.drawImage(images.star, runtimeStar.definition.x - size / 2, runtimeStar.definition.y - size / 2 + bob, size, size);
    drawCalls += 1;
  }

  ctx.save();
  ctx.translate(level.goal.x, level.goal.y);
  ctx.rotate(Math.sin(simTime * 1.7) * 0.03);
  const portalSize = 148 + Math.sin(simTime * 4) * 4;
  ctx.drawImage(images.portal, -portalSize / 2, -portalSize / 2, portalSize, portalSize);
  ctx.restore();
  drawCalls += 1;

  for (const particle of particles) {
    if (!particle.active) continue;
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * ctx.globalAlpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawGhosts();

  if (phase !== "dead") {
    const stretch = clamp(-ball.vy / 1700, -0.16, 0.15);
    const squashX = 1 + ball.squash * 0.16 - stretch * 0.35;
    const squashY = 1 - ball.squash * 0.13 + stretch;
    const size = 82;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.vx * 0.00038);
    ctx.scale(squashX, squashY);
    ctx.drawImage(images.hero, -size / 2, -size / 2, size, size);
    ctx.restore();
    drawCalls += 1;
  }
}

function drawBackground(useCover = false) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const image = useCover ? images.cover : images.sky;
  if (image) {
    ctx.drawImage(image, 0, 0, viewportWidth, viewportHeight);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, viewportHeight);
    gradient.addColorStop(0, "#1798ef");
    gradient.addColorStop(1, "#8be8fa");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  }
  if (!useCover) {
    const parallax = -((cameraX * scale) % Math.max(300, viewportWidth));
    ctx.fillStyle = "rgba(25,86,189,.12)";
    for (let x = parallax - 300; x < viewportWidth + 300; x += 280) {
      const h = 50 + ((x / 17) % 70 + 70) % 70;
      ctx.fillRect(x, viewportHeight - h, 160, h);
    }
  }
  drawCalls += 1;
}

function drawPanel(x, y, w, h, alpha = 0.72) {
  ctx.fillStyle = `rgba(7,28,75,${alpha})`;
  roundedRectPath(x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function fitCanvasFont(text, weight, maxSize, minSize, maxWidth) {
  let size = maxSize;
  ctx.font = `${weight} ${size}px system-ui`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `${weight} ${size}px system-ui`;
  }
  return size;
}

function drawHud() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const compact = viewportWidth < 620;
  const margin = compact ? 10 : 18;
  const hudWidth = compact ? Math.min(viewportWidth - 120, 300) : 430;
  drawPanel(margin, margin, hudWidth, compact ? 72 : 82, 0.62);
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${compact ? 15 : 19}px system-ui`;
  ctx.textBaseline = "top";
  ctx.fillText(`${STR.stage} ${currentLevelIndex + 1} · ${STR.stageNames[currentLevelIndex]}`, margin + 16, margin + 11);
  ctx.font = `700 ${compact ? 13 : 16}px system-ui`;
  ctx.fillStyle = "#ffe86e";
  ctx.fillText(`★ ${STR.stars} ${stageCollected}/3`, margin + 16, margin + (compact ? 39 : 47));
  ctx.fillStyle = "#dffaff";
  const timeText = `${STR.time} ${formatTime(stageTime)}`;
  ctx.fillText(timeText, margin + (compact ? 130 : 165), margin + (compact ? 39 : 47));

  const progressX = margin;
  const progressY = compact ? 90 : 110;
  const progressWidth = Math.min(viewportWidth - margin * 2, compact ? viewportWidth - 20 : 430);
  drawPanel(progressX, progressY, progressWidth, 14, 0.4);
  const progress = clamp(ball.x / level.width, 0, 1);
  const innerWidth = (progressWidth - 4) * progress;
  if (innerWidth > 0) {
    const gradient = ctx.createLinearGradient(progressX, 0, progressX + progressWidth, 0);
    gradient.addColorStop(0, "#ffd83d");
    gradient.addColorStop(1, "#36e6f4");
    ctx.fillStyle = gradient;
    roundedRectPath(progressX + 2, progressY + 2, innerWidth, 10, 5);
    ctx.fill();
  }

  if (simTime < checkpointMessageUntil) {
    const width = Math.min(300, viewportWidth - 30);
    drawPanel((viewportWidth - width) / 2, viewportHeight * 0.2, width, 58, 0.72);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff4a6";
    ctx.font = "900 24px system-ui";
    ctx.fillText(STR.checkpoint, viewportWidth / 2, viewportHeight * 0.2 + 15);
    ctx.textAlign = "left";
  } else if (simTime < deathMessageUntil) {
    const width = Math.min(390, viewportWidth - 30);
    drawPanel((viewportWidth - width) / 2, viewportHeight * 0.2, width, 58, 0.72);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 19px system-ui";
    ctx.fillText(STR.died, viewportWidth / 2, viewportHeight * 0.2 + 17);
    ctx.textAlign = "left";
  }
}

function drawCenteredOverlay(title, subtitle, actionText) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "rgba(3,17,54,.55)";
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  const width = Math.min(620, viewportWidth - 28);
  const height = Math.min(330, viewportHeight - 80);
  const textWidth = width - 48;
  const x = (viewportWidth - width) / 2;
  const y = (viewportHeight - height) / 2;
  drawPanel(x, y, width, height, 0.84);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(7,28,75,.6)";
  ctx.shadowBlur = 10;
  fitCanvasFont(title, 950, clamp(viewportWidth * 0.075, 34, 68), 22, textWidth);
  ctx.fillText(title, viewportWidth / 2, y + height * 0.28);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#dffaff";
  fitCanvasFont(subtitle, 700, clamp(viewportWidth * 0.027, 16, 24), 12, textWidth);
  ctx.fillText(subtitle, viewportWidth / 2, y + height * 0.49);
  ctx.fillStyle = "#ffe86e";
  fitCanvasFont(actionText, 800, clamp(viewportWidth * 0.025, 15, 22), 12, textWidth);
  ctx.fillText(actionText, viewportWidth / 2, y + height * 0.69);
  ctx.fillStyle = "rgba(255,255,255,.82)";
  const controlsText = matchMedia("(pointer: coarse)").matches ? STR.touchControls : STR.controls;
  fitCanvasFont(controlsText, 600, clamp(viewportWidth * 0.017, 12, 16), 10, textWidth);
  ctx.fillText(controlsText, viewportWidth / 2, y + height * 0.84);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function render() {
  drawCalls = 0;
  if (phase === "loading") {
    drawBackground(false);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "800 22px system-ui";
    ctx.fillText(STR.loading, viewportWidth / 2, viewportHeight / 2);
    ctx.textAlign = "left";
    return;
  }

  if (phase === "menu") {
    drawBackground(true);
    drawCenteredOverlay(STR.title, STR.subtitle, STR.start);
    return;
  }

  drawBackground(false);
  drawWorld();
  drawHud();

  if (phase === "paused") {
    drawCenteredOverlay(STR.paused, STR.restartHint, STR.resume);
  } else if (phase === "stageClear") {
    const best = bestTimes[currentLevelIndex];
    const summary = `${STR.stars} ${stageCollected}/3 · ${STR.time} ${formatTime(stageTime)} · ${STR.best} ${formatTime(best ?? stageTime)}`;
    drawCenteredOverlay(STR.stageClear, summary, simTime >= clearReadyAt ? STR.continue : STR.stageClear);
  } else if (phase === "complete") {
    const summary = `${STR.stars} ${completedStars}/${LEVELS.length * 3} · ${STR.time} ${formatTime(runTime)}`;
    drawCenteredOverlay(STR.allClear, `${STR.finalMessage}  ${summary}`, STR.replay);
  } else if (phase === "dead") {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "rgba(255,78,69,.16)";
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
  }
}

const keyBindings = Object.freeze({
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right"
});

addEventListener("keydown", (event) => {
  const command = keyBindings[event.code];
  if (command === "left") input.keyLeft = true;
  if (command === "right") input.keyRight = true;
  if (command) event.preventDefault();
  if ((event.code === "Space" || event.code === "Enter") && !event.repeat) {
    input.actionPulse = true;
    ensureAudio();
    event.preventDefault();
  }
  if (event.code === "KeyR" && !event.repeat) input.restartPulse = true;
  if (event.code === "Escape" && !event.repeat) input.pausePulse = true;
  if (event.code === "KeyM" && !event.repeat) toggleSound();
});

addEventListener("keyup", (event) => {
  const command = keyBindings[event.code];
  if (command === "left") input.keyLeft = false;
  if (command === "right") input.keyRight = false;
});

function bindHoldButton(button, property) {
  const start = (event) => {
    ensureAudio();
    input[property] = true;
    button.classList.add("active");
    button.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };
  const end = (event) => {
    input[property] = false;
    button.classList.remove("active");
    event.preventDefault();
  };
  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", end);
  button.addEventListener("pointercancel", end);
  button.addEventListener("lostpointercapture", end);
}

bindHoldButton(touchLeft, "touchLeft");
bindHoldButton(touchRight, "touchRight");

canvas.addEventListener("pointerdown", () => {
  ensureAudio();
  if (phase !== "playing" && phase !== "dead") input.actionPulse = true;
});

pauseButton.addEventListener("click", () => {
  ensureAudio();
  input.pausePulse = true;
});
soundButton.addEventListener("click", toggleSound);

addEventListener("blur", () => {
  input.keyLeft = false;
  input.keyRight = false;
  input.touchLeft = false;
  input.touchRight = false;
  if (phase === "playing") {
    previousPhase = phase;
    phase = "paused";
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && phase === "playing") {
    previousPhase = phase;
    phase = "paused";
  }
});

const devEnabled = new URLSearchParams(location.search).has("dev");
if (devEnabled) devBox.style.display = "block";
if (devEnabled) {
  window.__bounceDebug = () => ({
    phase,
    currentLevelIndex,
    stageCollected,
    checkpointActive,
    stageTime,
    viewportWidth,
    viewportHeight,
    dpr,
    scale,
    viewWorldWidth,
    cameraX,
    cameraTargetX,
    ball: { ...ball },
    ghosts: activeGhosts().map((ghost) => ({
      label: ghost.label,
      time: ghost.replay.time,
      stars: ghost.replay.stars,
      samples: ghost.replay.samples.length
    })),
    audioBuffers: Object.keys(audioBuffers),
    musicPlaying: Boolean(musicSource),
    localBestReplayCount: localBestReplays.filter(Boolean).length,
    onlineGhostEnabled: Boolean(onlineConfig()),
    platformCount: runtimePlatforms.length,
    platformStates: runtimePlatforms.map((runtime) => ({
      kind: runtime.definition.kind,
      x: runtime.cx,
      y: runtime.cy,
      active: runtime.active,
      breakAt: runtime.breakAt,
      restoreAt: runtime.restoreAt
    })),
    springStates: runtimeSprings.map((springRuntime) => {
      const springDefinition = springRuntime.definition;
      const runtime = runtimePlatforms[springDefinition.platformIndex];
      return {
        platformIndex: springDefinition.platformIndex,
        x: runtime ? runtime.cx + springDefinition.offset : 0,
        y: runtime ? springSurface(runtime, springDefinition) : 0,
        compression: springRuntime.compression
      };
    }),
    starCount: runtimeStars.length,
    imageSizes: Object.fromEntries(
      Object.entries(images).map(([key, image]) => [key, [image.naturalWidth, image.naturalHeight]])
    ),
    transform: ctx.getTransform().toJSON(),
    globalAlpha: ctx.globalAlpha,
    drawCalls
  });
  window.__bounceTest = Object.freeze({
    loadLevel(index) {
      loadLevel(clamp(Math.trunc(index), 0, LEVELS.length - 1), false);
    },
    placeBall(x, y, vx = 0, vy = 0) {
      ball.x = x;
      ball.y = y;
      ball.prevX = x;
      ball.prevY = y;
      ball.vx = vx;
      ball.vy = vy;
      ball.graceUntil = 0;
      phase = "playing";
    },
    collectAllStars() {
      for (const runtimeStar of runtimeStars) runtimeStar.collected = true;
      stageCollected = runtimeStars.length;
    },
    seedBestReplay(index = currentLevelIndex) {
      const levelIndex = clamp(Math.trunc(index), 0, LEVELS.length - 1);
      const seedLevel = LEVELS[levelIndex];
      const replay = {
        version: 1,
        levelIndex,
        levelName: STR.stageNames[levelIndex],
        time: 18,
        stars: 3,
        samples: [
          { t: 0, x: seedLevel.start.x, y: seedLevel.start.y, vx: 0, vy: -CONFIG.bounceSpeed },
          { t: 6, x: seedLevel.width * 0.28, y: 560, vx: 160, vy: -280 },
          { t: 12, x: seedLevel.width * 0.62, y: 440, vx: 210, vy: -210 },
          { t: 18, x: seedLevel.goal.x, y: seedLevel.goal.y, vx: 160, vy: 0 }
        ]
      };
      localBestReplays[levelIndex] = replay;
      saveReplaySlots("bounce-up-best-replays", localBestReplays);
      return replay;
    },
    clearGhostReplays() {
      localBestReplays = emptyReplaySlots();
      localLastReplays = emptyReplaySlots();
      saveReplaySlots("bounce-up-best-replays", localBestReplays);
      saveReplaySlots("bounce-up-last-replays", localLastReplays);
      onlineBestGhost = null;
    },
    step(frames = 1) {
      const count = clamp(Math.trunc(frames), 1, 600);
      for (let i = 0; i < count; i += 1) update(CONFIG.stepMs / 1000);
      render();
    },
    pulseAction() {
      input.actionPulse = true;
    },
    pulsePause() {
      input.pausePulse = true;
    }
  });
}
let accumulator = 0;
let lastFrame = performance.now();
let frameCount = 0;
let fpsWindowStart = lastFrame;
let fps = 0;
let frameMs = 0;

function frame(now) {
  requestAnimationFrame(frame);
  frameMs = Math.min(100, now - lastFrame);
  accumulator = Math.min(250, accumulator + frameMs);
  lastFrame = now;
  while (accumulator >= CONFIG.stepMs) {
    update(CONFIG.stepMs / 1000);
    accumulator -= CONFIG.stepMs;
  }
  render();
  if (devEnabled) {
    frameCount += 1;
    if (now - fpsWindowStart >= 500) {
      fps = Math.round(frameCount * 1000 / (now - fpsWindowStart));
      frameCount = 0;
      fpsWindowStart = now;
      const activeParticles = particles.reduce((total, item) => total + Number(item.active), 0);
      devBox.textContent = `${fps} fps\n${frameMs.toFixed(1)} ms\n${drawCalls} draws\n${runtimePlatforms.length + runtimeStars.length + activeParticles + 1} entities\n${STYLE_FORMULA.length} style chars`;
    }
  }
}

loadAssets().catch((error) => {
  console.error("Asset load failed", error);
  phase = "menu";
});
requestAnimationFrame(frame);
