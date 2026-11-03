// The page's own script, run in the browser after the model, the two figures' live code and the data the build
// injects (U, TOPICS, BADGES, DATA, fmt, clamp, clockText). One clock drives both plants; the tabs choose which one
// is drawn; every run is logged at both scales so it can be charted, tabulated and downloaded.
const NAMES = ["lab", "farm"];
const clock = { hour: 6, minutesPerSecond: 30, mixerMode: "auto", heaterFail: false, paused: false, overfeedUntil: -1 };
const roots = { farm: document.querySelector('[data-fig="farm"]'), lab: document.querySelector('[data-fig="lab"]') };
const figs = { farm: farmLive(DATA.farm, roots.farm, clock), lab: labLive(DATA.lab, roots.lab, clock) };
const still = matchMedia("(prefers-reduced-motion: reduce)");
const seen = { farm: false, lab: false };
let active = "lab";
// How each scale shows the same per-m³ numbers: the bench in normal litres, mL and grams; the farm in m³ and kg.
const SCALE = {
  lab: { m3: LAB_VOLUME, gasK: 1000, gas: "NL/d", vol: "NL", fedK: 1e6, fed: "mL", vsK: 1000, vs: "g", yieldU: "NL CH₄/g SV", conc: "g/L" },
  farm: { m3: VOLUME, gasK: 1, gas: "Nm³/d", vol: "Nm³", fedK: 1, fed: "m³", vsK: 1, vs: "kg", yieldU: "Nm³ CH₄/kg SV", conc: "kg/m³" },
};
const sig = (v) => (!Number.isFinite(v) ? "—" : v === 0 ? "0" : Math.abs(v) >= 100 ? fmt(v, 0) : Math.abs(v) >= 10 ? fmt(v, 1) : Math.abs(v) >= 1 ? fmt(v, 2) : fmt(v, 3));
const dayText = (d) => U.day + " " + fmt(d, d < 10 ? 2 : 1);
const decimalsOf = (step) => { let d = 0; while (d < 4 && Math.abs(step * 10 ** d - Math.round(step * 10 ** d)) > 1e-9) d++; return d; };
function niceStep(span, n) { const raw = Math.max(span, 1e-9) / n, mag = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= raw); }
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ── The loop: always running, so a run keeps going while you read the charts; a figure is drawn only when on screen ──
let last = 0, wall = 0, lastSlow = -1;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  wall += dt;
  const calm = still.matches || clock.paused;
  const dtH = clock.paused ? 0 : (dt * clock.minutesPerSecond) / 60;
  clock.hour += dtH;
  for (const name of NAMES) { figs[name].tick(dt, dtH, wall, calm, seen[name]); logRun(name); }
  runPlan();
  if (wall - lastSlow > 0.4) { lastSlow = wall; slow(); }
  requestAnimationFrame(tick);
}
for (const name of NAMES) new IntersectionObserver((entries) => { seen[name] = entries[entries.length - 1].isIntersecting; }, { rootMargin: "120px 0px" }).observe(roots[name]);

// ── Panel ──
const ins = Object.fromEntries($$("[data-in]").map((el) => [el.dataset.in, el]));
const outs = Object.fromEntries($$("[data-out]").map((el) => [el.dataset.out, el]));
const cells = Object.fromEntries($$("[data-cell]").map((el) => [el.dataset.cell, el]));
const warn = $("[data-warn]"), ratiosEl = $("[data-ratios]");
const plant = { ...DESIGN };
let farmNow = steady(plant), labNow = steady(plant, LAB_VOLUME);
function readPanel() {
  plant.temperature = +ins.temperature.value;
  plant.hrt = +ins.hrt.value;
  plant.ts = +ins.ts.value / 100;
  clock.mixerMode = ins.mixer.value;
  clock.minutesPerSecond = +ins.speed.value;
  farmNow = steady(plant);
  labNow = steady(plant, LAB_VOLUME);
  figs.farm.update({ ...plant });
  figs.lab.update({ ...plant });
  outs.temperature.textContent = fmt(plant.temperature, 0) + " °C";
  outs.hrt.textContent = fmt(plant.hrt, 0) + " d";
  outs.ts.textContent = fmt(plant.ts * 100, 1) + " %";
  const a = farmNow, b = labNow;
  cells["volume.farm"].textContent = fmt(VOLUME, 0) + " m³";
  cells["volume.lab"].textContent = fmt(LAB_VOLUME * 1000, 1) + " L";
  cells["feed.farm"].textContent = fmt(a.q, 1) + " m³/d";
  cells["feed.lab"].textContent = fmt(b.q * 1e6, 0) + " mL/d";
  cells.olr.textContent = fmt(a.olr, 2) + " kg SV/m³·d";
  cells.share.textContent = fmt(a.share * 100, 0) + " %";
  cells["ch4.farm"].textContent = fmt(a.ch4, 0) + " Nm³/d";
  cells["ch4.lab"].textContent = fmt(b.ch4 * 1000, 2) + " NL/d";
  cells["biogas.farm"].textContent = fmt(a.biogas, 0) + " Nm³/d";
  cells["biogas.lab"].textContent = fmt(b.biogas * 1000, 2) + " NL/d";
  cells.perM3.textContent = fmt(a.ch4PerM3, 2) + " Nm³/m³·d";
  cells["power.farm"].textContent = fmt(a.kwe, 1) + " kW";
  cells["power.lab"].textContent = sig(b.kwe * 1000) + " W";
  cells["diameter.farm"].textContent = fmt(PLANT.radius * 2, 0) + " m";
  cells["diameter.lab"].textContent = fmt(LAB.radius * 2000, 0) + " mm";
  cells["depth.farm"].textContent = fmt(PLANT.level, 1) + " m";
  cells["depth.lab"].textContent = fmt(LAB.level * 1000, 1) + " mm";
  const wetted = (r, h) => 2 * Math.PI * r * h + Math.PI * r * r;
  ratiosEl.textContent = U.ratios.replace("{lin}", fmt(PLANT.radius / LAB.radius, 0)).replace("{area}", fmt(Math.round(wetted(PLANT.radius, PLANT.level) / wetted(LAB.radius, LAB.level) / 100) * 100, 0)).replace("{vol}", fmt(Math.round(VOLUME / LAB_VOLUME / 1000) * 1000, 0));
  cells["surface.farm"].textContent = fmt(surfacePerVolume(PLANT.radius, PLANT.level), 2) + " m²/m³";
  cells["surface.lab"].textContent = fmt(surfacePerVolume(LAB.radius, LAB.level), 1) + " m²/m³";
  cells["cows.farm"].textContent = "≈ " + fmt(Math.round(a.cows / 5) * 5, 0);
  cells["cows.lab"].textContent = "—";
  cells["turns.farm"].textContent = "—";
  cells["turns.lab"].textContent = fmt((b.biogas * 1e6) / LAB.meterMl, 0) + " " + U.turnsUnit;
  cells.washout.textContent = Number.isFinite(a.washoutHrt) ? fmt(a.washoutHrt, 1) + " d" : "—";
  const notes = [];
  if (plant.hrt <= a.washoutHrt) notes.push('<span class="cstr-badge" data-level="critical" aria-hidden="true">✕</span> ' + U.warnWash);
  else if (a.olr > 4) notes.push('<span class="cstr-badge" data-level="warning" aria-hidden="true">!</span> ' + U.warnOlr);
  warn.innerHTML = notes.join("<br>");
  cells.olr.dataset.level = a.olr > 4 ? "warning" : "";
  drawChart();
  drawMap();
}
Object.values(ins).forEach((el) => el.addEventListener("input", readPanel));
// A setting changed by hand goes into the run's event list, once it is let go.
const describe = (set) => Object.entries(set).map(([k, v]) => k === "temperature" ? U.temperature + " " + fmt(+v, 0) + " °C" : k === "hrt" ? "TRH " + fmt(+v, 0) + " d" : k === "ts" ? "ST " + fmt(+v, 1) + " %" : k === "mixer" ? U.mixer + ": " + U[v] : "").filter(Boolean).join(" · ");
["temperature", "hrt", "ts", "mixer"].forEach((k) => ins[k].addEventListener("change", () => note(describe({ [k]: ins[k].value }))));
const feedNow = (quiet) => { figs.farm.feedNow(); figs.lab.feedNow(); if (quiet !== true) note(U.feedNow); };
$('[data-act="feed"]').addEventListener("click", feedNow);
$('[data-act="bag"]').addEventListener("click", () => figs.lab.emptyBag());
const speedText = (v) => (v < 60 ? fmt(v, v % 1 ? 1 : 0) + " min/s" : v < 1440 ? fmt(v / 60, 0) + " h/s" : fmt(v / 1440, 0) + " " + U.dayPerSec);

// ── Heating, pause, overfeed, presets ──
const heatBtn = $('[data-act="heat"]');
function setHeat(fail, quiet) { if (clock.heaterFail === fail) return; clock.heaterFail = fail; heatBtn.setAttribute("aria-pressed", String(fail)); if (!quiet) note(fail ? U.evHeatOff : U.evHeatOn); }
heatBtn.addEventListener("click", () => setHeat(!clock.heaterFail));
const pauseBtn = $('[data-act="pause"]');
const togglePause = () => { clock.paused = !clock.paused; pauseBtn.setAttribute("aria-pressed", String(clock.paused)); pauseBtn.textContent = clock.paused ? U.resume : U.pause; };
pauseBtn.addEventListener("click", togglePause);
const overBtn = $('[data-act="overfeed"]');
function overfeed(quiet) { clock.overfeedUntil = clock.hour + 24; if (!quiet) note(U.evOverfeed); slow(); }
overBtn.addEventListener("click", () => overfeed());
const PRESETS = {
  design: { temperature: 37, hrt: 25, ts: 8, mixer: "auto" },
  cold: { temperature: 25, hrt: 25, ts: 8, mixer: "auto" },
  thermo: { temperature: 52, hrt: 25, ts: 8, mixer: "auto" },
  short: { temperature: 37, hrt: 8, ts: 8, mixer: "auto" },
  dilute: { temperature: 37, hrt: 25, ts: 4, mixer: "auto" },
  still: { temperature: 37, hrt: 25, ts: 8, mixer: "off" },
};
const presetBtns = $$("[data-preset]"), presetNote = $("[data-preset-note]");
const markPreset = (key) => { presetBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === key))); presetNote.textContent = key ? U.presets[key][1] : ""; };
function applySet(set) { for (const [k, v] of Object.entries(set)) ins[k].value = v; readPanel(); }
presetBtns.forEach((b) => b.addEventListener("click", () => { applySet(PRESETS[b.dataset.preset]); markPreset(b.dataset.preset); note(U.presets[b.dataset.preset][0]); }));
["temperature", "hrt", "ts", "mixer"].forEach((k) => ins[k].addEventListener("input", () => markPreset(null)));

// Keys on a figure: ← → speed, M mixer, F feed, H heating, space pause.
function stageKey(e) {
  if (e.target !== e.currentTarget) return;
  const speeds = [...ins.speed.options].map((o) => o.value);
  let i = speeds.indexOf(ins.speed.value);
  switch (e.key) {
    case "ArrowRight": ins.speed.value = speeds[Math.min(speeds.length - 1, i + 1)]; readPanel(); break;
    case "ArrowLeft": ins.speed.value = speeds[Math.max(0, i - 1)]; readPanel(); break;
    case "m": case "M": { const o = ["auto", "off", "on"]; ins.mixer.value = o[(o.indexOf(ins.mixer.value) + 1) % 3]; readPanel(); note(describe({ mixer: ins.mixer.value })); break; }
    case "f": case "F": feedNow(); break;
    case "h": case "H": setHeat(!clock.heaterFail); break;
    case " ": togglePause(); break;
    default: return;
  }
  e.preventDefault();
}
$$(".iso-stage").forEach((stage) => stage.addEventListener("keydown", stageKey));

// ── Chart: methane per m³ of reactor against HRT. One axis: the kinetics know no size, so one curve serves both
// scales; the tooltip turns it into each scale's own daily volume. ──
const plot = $("[data-plot]"), chartSvg = plot.querySelector("svg"), tip = plot.querySelector("[data-tip]");
let W = 640;
const H = 260, Mg = { l: 48, r: 24, t: 24, b: 34 };
const X0 = 2, X1 = 60;
const RATIO = (LAB_VOLUME * 1000) / VOLUME;   // NL at the bench per Nm³ at the farm
const sx = (h) => Mg.l + ((h - X0) / (X1 - X0)) * (W - Mg.l - Mg.r);
const hx = (px) => X0 + ((px - Mg.l) / (W - Mg.l - Mg.r)) * (X1 - X0);
let sy = () => 0;
function drawChart() {
  W = Math.max(300, Math.round(plot.clientWidth || 640));
  chartSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
  const curve = Array.from({ length: 233 }, (_, i) => { const h = X0 + (i / 232) * (X1 - X0); return { h, s: steady({ ...plant, hrt: h }) }; });
  const yMax = Math.max(0.1, ...curve.map((p) => p.s.ch4PerM3)) * 1.12;
  const step = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2].find((v) => yMax / v <= 5) || 5;
  sy = (v) => H - Mg.b - (v / yMax) * (H - Mg.t - Mg.b);
  const wash = farmNow.washoutHrt, olr4 = farmNow.s0 / 4;
  let g = "";
  for (let v = 0; v <= yMax; v += step) g += `<line class="grid" x1="${Mg.l}" x2="${W - Mg.r}" y1="${sy(v)}" y2="${sy(v)}"/><text class="tick" x="${Mg.l - 8}" y="${sy(v) + 4}" text-anchor="end">${fmt(v, decimalsOf(step))}</text>`;
  for (let h = 10; h <= X1; h += 10) g += `<text class="tick" x="${sx(h)}" y="${H - Mg.b + 18}" text-anchor="middle">${h}</text>`;
  const zone = (a, b, level, label) => {
    if (b <= X0 || a >= b) return "";
    const xa = sx(Math.max(X0, a)), xb = sx(Math.min(X1, b));
    return `<rect class="zone" data-level="${level}" x="${xa}" y="${Mg.t}" width="${xb - xa}" height="${H - Mg.t - Mg.b}"/>` + (xb - xa > 26 ? `<text class="zone-label" x="${xa + 5}" y="${H - Mg.b - 7}">${label}</text>` : "");
  };
  g += zone(X0, wash, "critical", U.zoneWash) + zone(wash, olr4, "warning", U.zoneOlr);
  g += `<line class="axis" x1="${Mg.l}" x2="${W - Mg.r}" y1="${sy(0)}" y2="${sy(0)}"/>`;
  g += `<path class="series" d="${curve.map((p, i) => (i ? "L" : "M") + sx(p.h).toFixed(1) + " " + sy(p.s.ch4PerM3).toFixed(1)).join("")}"/>`;
  const cx = sx(plant.hrt), cy = sy(farmNow.ch4PerM3), flip = cx > W - Mg.r - 150, ly = Math.max(Mg.t + 22, cy - 9);
  g += `<circle class="now" cx="${cx}" cy="${cy}" r="5"/><text class="now-label" x="${flip ? cx - 9 : cx + 9}" y="${ly}" text-anchor="${flip ? "end" : "start"}">${U.now} · ${fmt(farmNow.ch4PerM3, 2)}</text>`;
  g += `<text class="axis-title" x="${W - Mg.r}" y="${H - 4}" text-anchor="end">${U.xAxis}</text><text class="axis-title" x="${Mg.l}" y="${Mg.t - 10}">${U.yAxis}</text>`;
  g += `<line class="cross" data-cross x1="0" x2="0" y1="${Mg.t}" y2="${H - Mg.b}" style="display:none"/><circle class="cross-dot" data-cross-dot r="4" style="display:none"/>`;
  chartSvg.innerHTML = g;
  $("[data-table] tbody").innerHTML = [5, 10, 15, 20, 25, 30, 40, 60].map((h) => { const s = steady({ ...plant, hrt: h }); return `<tr><td>${h}</td><td>${fmt(s.olr, 2)}</td><td>${fmt(s.share * 100, 0)} %</td><td>${fmt(s.ch4PerM3, 2)}</td><td>${fmt(s.ch4, 0)}</td><td>${fmt(s.ch4 * RATIO, 2)}</td></tr>`; }).join("");
}
plot.addEventListener("pointermove", (event) => {
  const box = chartSvg.getBoundingClientRect();
  const h = clamp(hx(((event.clientX - box.left) / box.width) * W), X0, X1), s = steady({ ...plant, hrt: h });
  const cross = $("[data-cross]", chartSvg), dot = $("[data-cross-dot]", chartSvg);
  cross.setAttribute("x1", sx(h)); cross.setAttribute("x2", sx(h)); cross.style.display = "";
  dot.setAttribute("cx", sx(h)); dot.setAttribute("cy", sy(s.ch4PerM3)); dot.style.display = "";
  tip.hidden = false;
  tip.innerHTML = `<b>TRH ${fmt(h, 1)} d</b><br><b>${fmt(s.ch4PerM3, 2)}</b> Nm³ CH₄/m³·d<br>${U.farm}: ${fmt(s.ch4, 0)} Nm³ CH₄/d<br>${U.lab}: ${fmt(s.ch4 * RATIO, 2)} NL CH₄/d<br>${U.olr} ${fmt(s.olr, 2)} · ${U.share} ${fmt(s.share * 100, 0)} %`;
  tip.style.left = Math.max(0, Math.min(box.width - 220, (sx(h) / W) * box.width + 12)) + "px";
  tip.style.top = ((sy(s.ch4PerM3) / H) * box.height - 10) + "px";
});
plot.addEventListener("pointerleave", () => { tip.hidden = true; $$("[data-cross],[data-cross-dot]", chartSvg).forEach((el) => (el.style.display = "none")); });

// ── Map: the steady state over every HRT and temperature, at this feed. One hue, light to dark; click a cell to run there. ──
const mapBox = $("[data-map]"), mapSvg = mapBox.querySelector("svg"), mapRead = $("[data-map-read]"), mapMetric = $("[data-map-metric]");
const MAP = { h0: 2, h1: 60, t0: 20, t1: 55 }, MM = { l: 48, r: 16, t: 30, b: 40 };
let MW = 640, MH = 300, mapScale = null;
const RAMP = [[238, 244, 251], [196, 218, 243], [143, 187, 233], [85, 150, 221], [42, 120, 214], [27, 90, 168], [16, 61, 117]];
const rampAt = (u) => { const x = clamp(u, 0, 1) * (RAMP.length - 1), i = Math.min(RAMP.length - 2, Math.floor(x)), f = x - i; return "rgb(" + RAMP[i].map((c, j) => Math.round(c + (RAMP[i + 1][j] - c) * f)).join(",") + ")"; };
const METRICS = {
  perM3: { get: (s) => s.ch4PerM3, d: 2, unit: "Nm³ CH₄/m³·d" },
  share: { get: (s) => s.share * 100, d: 0, unit: "% " + U.ofB0 },
  left: { get: (s) => s.s0 * (1 - s.share), d: 1, unit: "g/L" },
};
function drawMap() {
  MW = Math.max(300, Math.round(mapBox.clientWidth || 640));
  MH = Math.round(clamp(MW * 0.5, 240, 320));
  mapSvg.setAttribute("viewBox", "0 0 " + MW + " " + MH);
  const m = METRICS[mapMetric.value];
  const nx = MAP.h1 - MAP.h0 + 1, ny = MAP.t1 - MAP.t0 + 1;
  const cw = (MW - MM.l - MM.r) / nx, ch = (MH - MM.t - MM.b) / ny;
  const X = (h) => MM.l + (h - MAP.h0) * cw, Y = (t) => MH - MM.b - (t - MAP.t0 + 1) * ch;
  let lo = Infinity, hi = -Infinity;
  const grid = [];
  for (let t = MAP.t0; t <= MAP.t1; t++) for (let h = MAP.h0; h <= MAP.h1; h++) { const v = m.get(steady({ ...plant, temperature: t, hrt: h })); grid.push([h, t, v]); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  mapScale = { X, Y, cw, ch, m, lo, hi };
  let g = grid.map(([h, t, v]) => `<rect x="${X(h).toFixed(1)}" y="${Y(t).toFixed(1)}" width="${(cw + 0.4).toFixed(1)}" height="${(ch + 0.4).toFixed(1)}" fill="${rampAt((v - lo) / (hi - lo || 1))}"/>`).join("");
  // Washout edge: below this HRT the methanogens leave faster than they grow.
  const wash = [];
  for (let t = MAP.t0; t <= MAP.t1 + 1; t++) { const w = 1 / Math.max(1e-6, muMax(t - 0.5)); if (w <= MAP.h1 + 1) wash.push([clamp(MM.l + (w - MAP.h0 + 0.5) * cw, MM.l, MW - MM.r), Y(t - 1)]); }
  if (wash.length > 1) g += `<path class="map-edge" d="${wash.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("")}"/><text class="map-label" x="${(wash[wash.length - 1][0] + 6).toFixed(1)}" y="${MM.t + 16}">${U.zoneWash}</text>`;
  const olr4 = steady(plant).s0 / 4;
  if (olr4 > MAP.h0 && olr4 < MAP.h1) { const x = X(olr4) + cw / 2; g += `<line class="map-olr" x1="${x}" x2="${x}" y1="${MM.t}" y2="${MH - MM.b}"/><text class="map-label" x="${x + 5}" y="${MH - MM.b - 8}">${U.zoneOlr}</text>`; }
  for (let h = 10; h <= MAP.h1; h += 10) g += `<text class="tick" x="${X(h) + cw / 2}" y="${MH - MM.b + 18}" text-anchor="middle">${h}</text>`;
  for (let t = 20; t <= MAP.t1; t += 5) g += `<text class="tick" x="${MM.l - 8}" y="${Y(t) + ch / 2 + 4}" text-anchor="end">${t}</text>`;
  g += `<text class="axis-title" x="${MW - MM.r}" y="${MH - 4}" text-anchor="end">${U.xAxis}</text><text class="axis-title" x="${MM.l}" y="${MM.t - 10}">${U.yMap}</text>`;
  const px = X(clamp(plant.hrt, MAP.h0, MAP.h1)) + cw / 2, py = Y(clamp(plant.temperature, MAP.t0, MAP.t1)) + ch / 2;
  g += `<circle class="map-now" cx="${px}" cy="${py}" r="6"/><rect class="map-hover" data-map-hover width="${cw + 0.4}" height="${ch + 0.4}" style="display:none"/>`;
  mapSvg.innerHTML = g;
  $("[data-map-lo]").textContent = fmt(lo, m.d);
  $("[data-map-hi]").textContent = fmt(hi, m.d) + " " + m.unit;
  mapRead.textContent = mapText(plant.hrt, plant.temperature, true);
}
function mapText(h, t, now) {
  const s = steady({ ...plant, temperature: t, hrt: h });
  return (now ? U.now + ": " : "") + "TRH " + fmt(h, 0) + " d · " + fmt(t, 0) + " °C → " + fmt(s.ch4PerM3, 2) + " Nm³ CH₄/m³·d · " + fmt(s.share * 100, 0) + " % " + U.ofB0 + " · S " + fmt(s.s0 * (1 - s.share), 1) + " g/L" + (now ? "" : " · " + U.mapClick);
}
const mapCell = (event) => {
  if (!mapScale) return null;
  const box = mapSvg.getBoundingClientRect(), x = ((event.clientX - box.left) / box.width) * MW, y = ((event.clientY - box.top) / box.height) * MH;
  const h = MAP.h0 + Math.floor((x - MM.l) / mapScale.cw), t = MAP.t0 + Math.floor((MH - MM.b - y) / mapScale.ch);
  return h < MAP.h0 || h > MAP.h1 || t < MAP.t0 || t > MAP.t1 ? null : [h, t];
};
mapSvg.addEventListener("pointermove", (event) => {
  const c = mapCell(event), hov = $("[data-map-hover]", mapSvg);
  if (!c) { hov.style.display = "none"; mapRead.textContent = mapText(plant.hrt, plant.temperature, true); return; }
  hov.setAttribute("x", mapScale.X(c[0])); hov.setAttribute("y", mapScale.Y(c[1])); hov.style.display = "";
  mapRead.textContent = mapText(c[0], c[1]);
});
mapSvg.addEventListener("pointerleave", () => { const hov = $("[data-map-hover]", mapSvg); if (hov) hov.style.display = "none"; mapRead.textContent = mapText(plant.hrt, plant.temperature, true); });
mapSvg.addEventListener("click", (event) => { const c = mapCell(event); if (!c) return; applySet({ hrt: c[0], temperature: c[1] }); markPreset(null); note(describe({ hrt: c[0], temperature: c[1] })); });
mapMetric.addEventListener("change", drawMap);
$('[data-csv="map"]').addEventListener("click", () => {
  const rows = [["TRH_d", "temperatura_C", "ST_%", "COV_kgSV_m3d", "fracao_B0_%", "CH4_Nm3_m3d", "S_restante_gL", "fazenda_CH4_Nm3d", "bancada_CH4_NLd"]];
  for (let t = MAP.t0; t <= MAP.t1; t++) for (let h = MAP.h0; h <= MAP.h1; h++) { const s = steady({ ...plant, temperature: t, hrt: h }); rows.push([h, t, plant.ts * 100, s.olr, s.share * 100, s.ch4PerM3, s.s0 * (1 - s.share), s.ch4, s.ch4 * RATIO]); }
  download("cstr-mapa-estado-estacionario.csv", rows);
});

// ── Parts: point at a part to light it up; click it (on the drawing, its number or the list) to zoom in on it and
// read its card: what it is for, its sizes as drawn, what it is doing now and what to watch. ──
function explorer(name) {
  const root = roots[name], stage = $(".iso-stage", root), svg = $("svg", stage);
  const card = $("[data-card]", root), chips = $$("[data-chip]", root);
  const leaders = $(".cstr-leaders", stage), badgeBox = $(".cstr-badges", stage), numbersBox = $("[data-numbers]", root);
  const info = Object.fromEntries(TOPICS[name].map((t, i) => [t.key, { ...t, n: i + 1 }]));
  const spots = BADGES[name];
  const FULL = svg.getAttribute("viewBox").split(" ").map(Number);
  let vb = [...FULL], anim = 0, pinned = null, shown = null, rows = [];
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  // Leaders from each number to its part, in figure units: the overlay always shares the figure's viewBox.
  leaders.setAttribute("viewBox", FULL.join(" "));
  leaders.innerHTML = Object.entries(spots).map(([key, s]) => `<g data-leader="${key}"><line x1="${s.badge[0]}" y1="${s.badge[1]}" x2="${s.at[0]}" y2="${s.at[1]}"/><circle cx="${s.at[0]}" cy="${s.at[1]}" r="1.6"/></g>`).join("");
  const badges = Object.fromEntries($$("[data-chip]", badgeBox).map((b) => [b.dataset.chip, b]));
  function place() {
    const s = svg.getBoundingClientRect(), st = stage.getBoundingClientRect();
    for (const o of [leaders, badgeBox]) Object.assign(o.style, { left: s.left - st.left + "px", top: s.top - st.top + "px", width: s.width + "px", height: s.height + "px" });
    const text = vb.map((v) => v.toFixed(2)).join(" ");
    svg.setAttribute("viewBox", text);
    leaders.setAttribute("viewBox", text);
    const zoom = FULL[2] / vb[2];
    leaders.style.setProperty("--z", zoom.toFixed(3));
    for (const [key, b] of Object.entries(badges)) {
      const [x, y] = spots[key].badge, l = (x - vb[0]) / vb[2], t = (y - vb[1]) / vb[3];
      b.style.left = (l * 100).toFixed(2) + "%"; b.style.top = (t * 100).toFixed(2) + "%";
      b.hidden = l < 0.02 || l > 0.98 || t < 0.03 || t > 0.97;
    }
  }
  function zoomTo(target) {
    cancelAnimationFrame(anim);
    const from = [...vb], t0 = performance.now(), dur = still.matches ? 0 : 520;
    root.classList.toggle("cstr-zoomed", target[2] < FULL[2] - 1);
    const step = (now) => {
      const u = dur ? Math.min(1, (now - t0) / dur) : 1, e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      vb = from.map((v, i) => v + (target[i] - v) * e);
      place();
      if (u < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  // The view that frames a part: its drawn bounds and its number with room around them, at the figure's proportions.
  function frameOf(topic) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    $$('[data-topic="' + topic + '"]', svg).forEach((e) => { const b = e.getBBox(); if (!b.width && !b.height) return; x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); });
    const s = spots[topic];
    if (s) { x0 = Math.min(x0, s.badge[0] - 10); x1 = Math.max(x1, s.badge[0] + 10); y0 = Math.min(y0, s.badge[1] - 10); y1 = Math.max(y1, s.badge[1] + 10); }
    if (!Number.isFinite(x0)) return [...FULL];
    const ar = FULL[2] / FULL[3];
    let w = (x1 - x0) * 1.35 + 30, h = (y1 - y0) * 1.35 + 30;
    if (w / h < ar) w = h * ar;
    w = Math.max(w, 190);
    if (w >= FULL[2] * 0.9) return [...FULL];
    h = w / ar;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return [clamp(cx - w / 2, FULL[0], FULL[0] + FULL[2] - w), clamp(cy - h / 2, FULL[1], FULL[1] + FULL[3] - h), w, h];
  }
  function render(topic) {
    card.replaceChildren();
    rows = [];
    if (!topic) { card.append(el("p", "cstr-card-hint", U.pick)); return; }
    const t = info[topic];
    const head = el("div", "cstr-card-head"), h3 = el("h3");
    h3.append(el("span", "cstr-num", String(t.n)), t.name);
    head.append(h3);
    if (topic === pinned) { const back = el("button", "cstr-back", "← " + U.zoomOut); back.type = "button"; back.addEventListener("click", () => pin(null)); head.append(back); }
    card.append(head, el("p", "", t.what));
    if (t.specs.length) {
      card.append(el("h4", "", U.specs));
      const dl = el("dl", "cstr-facts"); for (const [k, v] of t.specs) dl.append(el("dt", "", k), el("dd", "", v));
      card.append(dl);
    }
    const now = figs[name].facts(topic);
    if (now.length) {
      card.append(el("h4", "", U.nowLabel));
      const dl = el("dl", "cstr-facts"); for (const [k, v] of now) { const dd = el("dd", "", v); dl.append(el("dt", "", k), dd); rows.push(dd); }
      card.append(dl);
    }
    const note = el("p", "cstr-card-scale"); note.append(el("b", "", (name === "lab" ? U.watch : U.other) + ": "), t.scale); card.append(note);
  }
  // Light a part on the drawing, its number and its line in the list; show() also opens its card.
  let lit;
  function light(topic) {
    chips.forEach((c) => { c.setAttribute("aria-pressed", String(c.dataset.chip === pinned)); c.classList.toggle("on", c.dataset.chip === topic); });
    $$("[data-leader]", leaders).forEach((g) => g.classList.toggle("on", g.dataset.leader === topic));
    if (topic === lit) return;
    lit = topic;
    $$(".hl,.hl-in", svg).forEach((e) => e.classList.remove("hl", "hl-in"));
    svg.classList.toggle("cstr-exploring", !!topic);
    if (topic) $$('[data-topic="' + topic + '"]', svg).forEach((e) => {
      e.classList.add("hl");
      for (let p = e.parentElement.closest("[data-topic]"); p; p = p.parentElement.closest("[data-topic]")) p.classList.add("hl-in");
    });
  }
  function show(topic) { light(topic); if (topic === shown) return; shown = topic; render(topic); }
  function pin(topic) { pinned = topic; shown = undefined; show(pinned); zoomTo(topic ? frameOf(topic) : [...FULL]); }
  const topicAt = (target) => target.closest && target.closest("[data-topic]")?.dataset.topic;
  svg.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") show(topicAt(e.target) || pinned); });
  svg.addEventListener("pointerleave", () => show(pinned));
  svg.addEventListener("click", (e) => { const t = topicAt(e.target) || null; pin(t === pinned ? null : t); });
  svg.style.cursor = "pointer";
  chips.forEach((c) => {
    c.addEventListener("click", () => pin(pinned === c.dataset.chip ? null : c.dataset.chip));
    // Hovering the list only lights the part, so the card above it never moves the list under the pointer.
    c.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") light(c.dataset.chip); });
    c.addEventListener("pointerleave", () => light(pinned));
    c.addEventListener("focus", () => show(c.dataset.chip));
    c.addEventListener("blur", () => show(pinned));
  });
  root.addEventListener("keydown", (e) => { if (e.key === "Escape" && pinned) { pin(null); e.preventDefault(); } });
  numbersBox.addEventListener("change", () => root.classList.toggle("cstr-no-numbers", !numbersBox.checked));
  render(null);
  return {
    place,
    refresh() { if (shown && rows.length) figs[name].facts(shown).forEach(([, v], i) => { if (rows[i] && rows[i].textContent !== v) rows[i].textContent = v; }); },
  };
}
const explorers = { farm: explorer("farm"), lab: explorer("lab") };

// ── Tabs: one scale at a time ──
const tabs = $$('[role="tab"]');
function select(name, focus) {
  active = name;
  tabs.forEach((t) => { const on = t.dataset.tab === name; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
  for (const n of NAMES) roots[n].hidden = n !== name;
  figs[name].tick(0, 0, wall, true, true);
  explorers[name].place();
  $$("[data-run-scale]").forEach((e) => (e.textContent = U[name]));
  try { history.replaceState(null, "", "#" + (name === "lab" ? "bancada" : "fazenda")); } catch (_) {}
  drawRun();
}
tabs.forEach((t) => {
  t.addEventListener("click", () => select(t.dataset.tab));
  t.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = (tabs.indexOf(t) + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    select(tabs[i].dataset.tab, true);
    e.preventDefault();
  });
});

// ── The run: both scales logged from the same start. Every 15 min of plant time a sample; every day a line of the log. ──
const runs = {};
let plan = [], expOn = null;
const newRun = () => ({ start: clock.hour, every: 0.25, next: clock.hour, samples: [], days: [], events: [], cum: 0, cumVs: 0, cumFed: 0, acc: { ch4: 0, fed: 0, vs: 0, tH: 0, tSum: 0 } });
function logRun(name) {
  const R = runs[name], s = figs[name].sim.step, n = figs[name].now();
  if (s && s.dtH > 0) {
    R.cum += s.ch4; R.cumVs += s.vs; R.cumFed += s.fed;
    const a = R.acc; a.ch4 += s.ch4; a.fed += s.fed; a.vs += s.vs; a.tH += s.dtH; a.tSum += n.temp * s.dtH;
  }
  while (clock.hour >= R.next) {
    R.samples.push({ t: (R.next - R.start) / 24, gas: n.gas, cum: R.cum, max: R.cumVs * FEED.b0, fed: R.cumFed, vs: R.cumVs, S: n.S, b: n.b, temp: n.temp, set: n.set });
    R.next += R.every;
    // A long run keeps its whole history: past 4000 samples, every other one goes and the interval doubles.
    if (R.samples.length > 4000) { R.samples = R.samples.filter((_, i) => i % 2 === 0); R.every *= 2; R.next = R.start + (R.samples[R.samples.length - 1].t * 24) + R.every; }
  }
  while (clock.hour - R.start >= (R.days.length + 1) * 24) {
    const a = R.acc;
    R.days.push({ day: R.days.length + 1, temp: a.tH ? a.tSum / a.tH : n.temp, fed: a.fed, vs: a.vs, ch4: a.ch4, yield: a.vs > 0 ? a.ch4 / a.vs : 0, S: n.S, b: n.b });
    R.acc = { ch4: 0, fed: 0, vs: 0, tH: 0, tSum: 0 };
  }
}
const runDay = () => (clock.hour - runs.lab.start) / 24;
function note(label) { if (!label || !runs.lab) return; const t = runDay(); for (const n of NAMES) runs[n].events.push({ t, label }); drawEvents(); }
const startSel = $("[data-start]");
function startRun(kind) {
  const s0 = plant.ts * FEED.vsOfTs * 1000, st = contentsAt(plant), fresh = kind === "fresh";
  const start = fresh ? { S: s0, b: Math.max(B_FLOOR, st.b * 0.01) } : st;
  for (const n of NAMES) { figs[n].restart({ ...start }, fresh); runs[n] = newRun(); }
  note((fresh ? U.startFresh : U.startRunning) + " · " + describe({ temperature: plant.temperature, hrt: plant.hrt * 1, ts: plant.ts * 100 }));
  drawRun();
}
$('[data-act="run"]').addEventListener("click", () => { plan = []; markExp(null); startRun(startSel.value); });

// Guided experiments: each sets the plant, starts a run and changes one thing on a schedule, then says what to look for.
const D = { temperature: 37, hrt: 25, ts: 8, mixer: "auto" };
const EXPS = {
  startup: { set: D, start: "fresh", speed: 1440, plan: [] },
  washout: { set: D, start: "running", speed: 360, plan: [{ day: 1, set: { hrt: 2 } }] },
  heating: { set: D, start: "running", speed: 30, plan: [{ day: 0.25, heatFail: true }, { day: 1.25, heatFail: false }] },
  shock: { set: D, start: "running", speed: 360, plan: [{ day: 1, overfeed: true }] },
  tradeoff: { set: D, start: "running", speed: 1440, plan: [{ day: 4, set: { hrt: 8 } }, { day: 24, set: { hrt: 40 } }] },
  cold: { set: D, start: "running", speed: 1440, plan: [{ day: 3, set: { temperature: 25 } }, { day: 23, set: { temperature: 37 } }] },
  dilute: { set: D, start: "running", speed: 1440, plan: [{ day: 3, set: { ts: 4 } }] },
};
const expBtns = $$("[data-exp]"), expCard = $("[data-exp-card]");
const planText = (p) => [p.set ? describe(p.set) : "", p.heatFail === true ? U.evHeatOff : p.heatFail === false ? U.evHeatOn : "", p.overfeed ? U.evOverfeed : ""].filter(Boolean).join(" · ");
function markExp(key) {
  expOn = key;
  expBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.exp === key)));
  expCard.replaceChildren();
  if (!key) { expCard.hidden = true; return; }
  expCard.hidden = false;
  const [title, question, watch] = U.exps[key], e = EXPS[key];
  const h = document.createElement("h4"); h.textContent = title;
  const q = document.createElement("p"); q.innerHTML = "<b>" + U.question + ":</b> "; q.append(question);
  const steps = document.createElement("ol");
  const li = (text) => { const i = document.createElement("li"); i.textContent = text; steps.append(i); };
  li(U.day + " 0: " + (e.start === "fresh" ? U.startFresh : U.startRunning) + " · " + describe(e.set) + " · " + speedText(e.speed));
  e.plan.forEach((p) => li(U.day + " " + fmt(p.day, p.day % 1 ? 2 : 0) + ": " + planText(p)));
  const w = document.createElement("p"); w.innerHTML = "<b>" + U.lookFor + ":</b> "; w.append(watch);
  expCard.append(h, q, steps, w);
}
function startExp(key) {
  const e = EXPS[key];
  applySet(e.set); markPreset(null);
  setHeat(false, true); clock.overfeedUntil = -1;
  ins.speed.value = e.speed; readPanel();
  if (clock.paused) togglePause();
  startSel.value = e.start;
  plan = e.plan.map((p) => ({ ...p, done: false }));
  markExp(key);
  startRun(e.start);
}
expBtns.forEach((b) => b.addEventListener("click", () => startExp(b.dataset.exp)));
function runPlan() {
  if (!plan.length) return;
  const day = runDay();
  for (const p of plan) {
    if (p.done || day < p.day) continue;
    p.done = true;
    if (p.set) { applySet(p.set); markPreset(null); }
    if ("heatFail" in p) setHeat(p.heatFail, true);
    if (p.overfeed) overfeed(true);
    note(planText(p));
  }
}

// ── Run charts: five small multiples on one time axis, so one cursor reads them all ──
const runBox = $("[data-run]"), runSvg = runBox.querySelector("svg"), runRead = $("[data-run-read]");
let RW = 640, runX = null, runSeen = true, hoverT = null;
new IntersectionObserver((entries) => { runSeen = entries[entries.length - 1].isIntersecting; }, { rootMargin: "200px 0px" }).observe(runBox);
const RM = { l: 52, r: 86, top: 50, band: 92, gap: 46 };
function bandsFor(name, narrow) {
  const S = SCALE[name], k = S.m3 * S.gasK;
  return [
    { title: U.cRate + ", " + S.gas, lines: [{ v: (p) => p.gas * k, label: U.sBiogas, cls: "s1" }] },
    { title: U.cCum + ", " + S.vol + " CH₄", lines: [{ v: (p) => p.cum * k, label: U.sProduced, cls: "s1" }, { v: (p) => p.max * k, label: U.sMaxShort, cls: "ref" }] },
    { title: U.cYield + ", " + S.yieldU, bars: true },
    { title: (narrow ? U.cInsideShort : U.cInside) + ", " + S.conc, lines: [{ v: (p) => p.S, label: "S", cls: "s1" }, { v: (p) => p.b, label: "b", cls: "s2" }] },
    { title: U.cTemp + ", °C", lines: [{ v: (p) => p.temp, label: U.sTemp, cls: "s1" }, { v: (p) => p.set, label: U.sSet, cls: "ref" }], free: true },
  ];
}
function drawRun() {
  if (!runs[active]) return;
  const R = runs[active], data = R.samples;
  RW = Math.max(300, Math.round(runBox.clientWidth || 640));
  const narrow = RW < 520;
  RM.r = narrow ? 76 : 86;
  const bands = bandsFor(active, narrow);
  const RH = RM.top + bands.length * (RM.band + RM.gap) - RM.gap + 40;
  runSvg.setAttribute("viewBox", "0 0 " + RW + " " + RH);
  const tNow = (clock.hour - R.start) / 24, tMax = Math.max(1, tNow);
  const X = (t) => RM.l + (t / tMax) * (RW - RM.l - RM.r);
  runX = { X, tMax, bands: [] };
  const every = Math.max(1, Math.floor(data.length / (RW - RM.l - RM.r)));
  const pts = data.filter((_, i) => i % every === 0 || i === data.length - 1);
  let g = "";
  bands.forEach((band, bi) => {
    const top = RM.top + bi * (RM.band + RM.gap), bottom = top + RM.band;
    let vals = [];
    if (band.bars) { vals = R.days.map((d) => d.yield); vals.push(FEED.b0); }
    else for (const l of band.lines) for (const p of pts) vals.push(l.v(p));
    if (!vals.length) vals = [0, 1];
    let lo = band.free ? Math.min(...vals) : 0, hi = Math.max(...vals);
    if (band.free) { const pad = Math.max(0.5, (hi - lo) * 0.1); lo -= pad; hi += pad; }
    else hi = hi > 0 ? hi * 1.1 : 1;
    const step = niceStep(hi - lo, 3);
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const Y = (v) => bottom - ((v - lo) / (hi - lo || 1)) * RM.band;
    runX.bands.push({ band, Y, top, bottom });
    g += `<text class="axis-title" x="${RM.l}" y="${top - 10}">${band.title}</text>`;
    for (let v = lo; v <= hi + step / 2; v += step) g += `<line class="grid" x1="${RM.l}" x2="${RW - RM.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${RM.l - 8}" y="${Y(v) + 4}" text-anchor="end">${fmt(v, decimalsOf(step))}</text>`;
    g += `<line class="axis" x1="${RM.l}" x2="${RW - RM.r}" y1="${bottom}" y2="${bottom}"/>`;
    if (band.bars) {
      for (const d of R.days) { const x0 = X(d.day - 1), x1 = X(d.day), w = Math.max(1, x1 - x0 - 2); g += `<rect class="bar" data-day="${d.day}" x="${(x0 + (x1 - x0 - w) / 2).toFixed(1)}" y="${Y(d.yield).toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0, bottom - Y(d.yield)).toFixed(1)}" rx="${Math.min(2, w / 2)}"/>`; }
      g += `<line class="ref" x1="${RM.l}" x2="${RW - RM.r}" y1="${Y(FEED.b0)}" y2="${Y(FEED.b0)}"/><text class="end-label" x="${RW - RM.r + 6}" y="${Y(FEED.b0) + 4}">B₀</text>`;
      if (!R.days.length) g += `<text class="tick" x="${RW - RM.r}" y="${top + 20}" text-anchor="end">${U.waitDay}</text>`;
      return;
    }
    const ends = [];
    for (const l of band.lines) {
      if (!pts.length) continue;
      g += `<path class="series ${l.cls}" d="${pts.map((p, i) => (i ? "L" : "M") + X(p.t).toFixed(1) + " " + Y(l.v(p)).toFixed(1)).join("")}"/>`;
      const lp = pts[pts.length - 1];
      ends.push({ y: Y(l.v(lp)), label: l.label });
    }
    if (ends.length === 2 && Math.abs(ends[0].y - ends[1].y) < 15) { const mid = (ends[0].y + ends[1].y) / 2, up = ends[0].y <= ends[1].y ? 0 : 1; ends[up].y = mid - 7.5; ends[1 - up].y = mid + 7.5; }
    for (const e of ends) g += `<text class="end-label" x="${RW - RM.r + 6}" y="${e.y + 4}">${e.label}</text>`;
  });
  const last = runX.bands[runX.bands.length - 1].bottom;
  const tStep = niceStep(tMax, Math.max(2, Math.floor((RW - RM.l - RM.r) / 80)));
  for (let t = 0; t <= tMax + 1e-9; t += tStep) g += `<text class="tick" x="${X(t)}" y="${last + 18}" text-anchor="middle">${fmt(t, decimalsOf(tStep))}</text>`;
  g += `<text class="axis-title" x="${RW - RM.r}" y="${last + 36}" text-anchor="end">${U.runAxis}</text>`;
  // Events: a dashed line through every band, numbered as in the list beside the chart.
  R.events.forEach((ev, i) => { if (ev.t <= 0.001 && i === 0) return; const x = X(ev.t); g += `<line class="event" x1="${x}" x2="${x}" y1="18" y2="${last}"/><text class="event-label" x="${x + 3}" y="14">${i}</text>`; });
  g += `<line class="cross" data-cross x1="0" x2="0" y1="${RM.top - 4}" y2="${last}" style="display:none"/><g data-dots></g>`;
  runSvg.innerHTML = g;
  if (hoverT != null) cursorAt(hoverT); else runRead.textContent = readText(data[data.length - 1], true);
  drawDays();
}
function sampleAt(t) {
  const d = runs[active].samples;
  if (!d.length) return null;
  let a = 0, b = d.length - 1;
  while (b - a > 1) { const m = (a + b) >> 1; if (d[m].t < t) a = m; else b = m; }
  return Math.abs(d[a].t - t) <= Math.abs(d[b].t - t) ? d[a] : d[b];
}
function readText(p, now) {
  if (!p) return U.waitRun;
  const S = SCALE[active], k = S.m3 * S.gasK, R = runs[active];
  const day = R.days[Math.min(R.days.length - 1, Math.floor(p.t))];
  return (now ? U.now + " · " : "") + dayText(p.t) + " · " + U.sBiogas + " " + sig(p.gas * k) + " " + S.gas + " · CH₄ " + sig(p.cum * k) + " " + S.vol + (p.max > 0 ? " (" + fmt((p.cum / p.max) * 100, 0) + " % " + U.ofMax + ")" : "") + (day && !now ? " · " + U.dayYield + " " + fmt(day.yield, 3) : "") + " · S " + fmt(p.S, 1) + " · b " + fmt(p.b, 1) + " " + S.conc + " · " + fmt(p.temp, 1) + " °C";
}
function cursorAt(t) {
  const p = sampleAt(t);
  if (!p || !runX) return;
  const x = runX.X(p.t), cross = $("[data-cross]", runSvg);
  cross.setAttribute("x1", x); cross.setAttribute("x2", x); cross.style.display = "";
  let dots = "";
  for (const { band, Y } of runX.bands) if (band.lines) for (const l of band.lines) dots += `<circle class="cross-dot ${l.cls}" cx="${x}" cy="${Y(l.v(p))}" r="4"/>`;
  $("[data-dots]", runSvg).innerHTML = dots;
  $$(".bar", runSvg).forEach((b) => b.classList.toggle("on", +b.dataset.day === Math.floor(p.t) + 1));
  runRead.textContent = readText(p);
}
runSvg.addEventListener("pointermove", (event) => {
  if (!runX) return;
  const box = runSvg.getBoundingClientRect(), px = ((event.clientX - box.left) / box.width) * RW;
  hoverT = clamp(((px - RM.l) / (RW - RM.l - RM.r)) * runX.tMax, 0, runX.tMax);
  cursorAt(hoverT);
});
runSvg.addEventListener("pointerleave", () => { hoverT = null; drawRun(); });
const daysBody = $("[data-days] tbody"), eventsEl = $("[data-events]"), sumEl = $("[data-run-sum]");
let daysShown = -1, daysScale = "";
function drawDays() {
  const R = runs[active], S = SCALE[active];
  if (R.days.length !== daysShown || daysScale !== active) {
    daysShown = R.days.length; daysScale = active;
    $$("[data-unit]").forEach((e) => (e.textContent = S[e.dataset.unit]));
    daysBody.innerHTML = R.days.slice(-120).reverse().map((d) => `<tr><td>${d.day}</td><td>${fmt(d.temp, 1)}</td><td>${sig(d.fed * S.m3 * S.fedK)}</td><td>${sig(d.vs * S.m3 * S.vsK)}</td><td>${sig(d.ch4 * S.m3 * S.gasK)}</td><td>${fmt(d.yield, 3)}</td><td>${fmt((d.yield / FEED.b0) * 100, 0)} %</td><td>${fmt(d.S, 1)}</td><td>${fmt(d.b, 1)}</td></tr>`).join("") || `<tr><td colspan="9">${U.waitDay}</td></tr>`;
  }
  const n = figs[active].now(), k = S.m3 * S.gasK;
  const rows = [[U.runDay, fmt((clock.hour - R.start) / 24, 2)], [U.sumCh4, sig(R.cum * k) + " " + S.vol], [U.sumVs, sig(R.cumVs * S.m3 * S.vsK) + " " + S.vs], [U.sumShare, R.cumVs > 0 ? fmt((R.cum / (R.cumVs * FEED.b0)) * 100, 0) + " %" : "—"], [U.sumFed, sig(R.cumFed * S.m3 * S.fedK) + " " + S.fed], ["S · b", fmt(n.S, 1) + " · " + fmt(n.b, 1) + " " + S.conc]];
  sumEl.innerHTML = rows.map(([k2, v]) => `<dt>${k2}</dt><dd>${v}</dd>`).join("");
}
function drawEvents() {
  const R = runs[active];
  eventsEl.innerHTML = R.events.map((ev, i) => `<li value="${i}"><span class="cstr-ev-t">${dayText(ev.t)}</span> ${ev.label}</li>`).join("");
}
function download(name, rows) {
  const cell = (v) => (typeof v === "number" ? String(+v.toPrecision(6)).replace(".", ",") : '"' + String(v).replace(/"/g, '""') + '"');
  const blob = new Blob(["﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('[data-csv="samples"]').addEventListener("click", () => {
  const R = runs[active], S = SCALE[active], k = S.m3 * S.gasK;
  const rows = [["dia", "biogas_" + S.gas, "CH4_acumulado_" + S.vol, "maximo_B0xSV_" + S.vol, "SV_alimentado_" + S.vs, "alimentado_" + S.fed, "S_" + S.conc, "b_" + S.conc, "temperatura_C", "ajuste_C"]];
  for (const p of R.samples) rows.push([p.t, p.gas * k, p.cum * k, p.max * k, p.vs * S.m3 * S.vsK, p.fed * S.m3 * S.fedK, p.S, p.b, p.temp, p.set]);
  download("cstr-" + active + "-corrida.csv", rows);
});
$('[data-csv="days"]').addEventListener("click", () => {
  const R = runs[active], S = SCALE[active];
  const rows = [["dia", "temperatura_media_C", "alimentado_" + S.fed, "SV_" + S.vs, "CH4_" + S.vol, "rendimento_" + S.yieldU.replace(/ /g, "_"), "fracao_B0_%", "S_" + S.conc, "b_" + S.conc]];
  for (const d of R.days) rows.push([d.day, d.temp, d.fed * S.m3 * S.fedK, d.vs * S.m3 * S.vsK, d.ch4 * S.m3 * S.gasK, d.yield, (d.yield / FEED.b0) * 100, d.S, d.b]);
  rows.push([]); rows.push(["eventos"]);
  for (const ev of R.events) rows.push([ev.t, ev.label]);
  download("cstr-" + active + "-diario.csv", rows);
});
addEventListener("resize", () => { drawChart(); drawMap(); drawRun(); for (const n of NAMES) explorers[n].place(); });

// Every 0.4 s of wall time: the live rows, the open part card, the run's charts and log.
let eventsShown = -1;
function slow() {
  const a = figs.farm.now(), b = figs.lab.now();
  cells["tempNow.farm"].textContent = fmt(a.temp, 1) + " °C";
  cells["tempNow.lab"].textContent = fmt(b.temp, 1) + " °C";
  cells["gasNow.farm"].textContent = fmt(a.gas * VOLUME, 0) + " Nm³/d";
  cells["gasNow.lab"].textContent = fmt(b.gas * LAB_VOLUME * 1000, 2) + " NL/d";
  explorers[active].refresh();
  const over = clock.overfeedUntil > clock.hour;
  overBtn.setAttribute("aria-pressed", String(over));
  overBtn.textContent = over ? U.overfeedOn + " " + clockText(clock.overfeedUntil) : U.overfeed;
  if (runSeen) drawRun();
  const evN = runs[active].events.length;
  if (evN !== eventsShown) { eventsShown = evN; drawEvents(); }
}

readPanel();
for (const n of NAMES) runs[n] = newRun();
note(U.startRunning + " · " + describe({ temperature: plant.temperature, hrt: plant.hrt, ts: plant.ts * 100 }));
select(location.hash === "#fazenda" ? "farm" : "lab");
for (const n of NAMES) figs[n].tick(0, 0, 0, true, true);
slow();
requestAnimationFrame(tick);
