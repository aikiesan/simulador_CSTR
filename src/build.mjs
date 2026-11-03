// The page: the farm tank (Fig 1) and the bench reactor (Fig 2) side by side on a wide screen, stacked on a phone,
// both driven by one panel and one plant clock. Both figures are proved by the Anatomy audit.
// node src/build.mjs [--light] [--pt] [--audit]  ->  site/cstr[-pt][-light].html (the Portuguese light page is also site/index.html)
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { k, A, HERE, kitScript, SHELL_SRC, MODEL_SRC, theme, lang, L, esc } from "./kit.mjs";
import * as M from "./model.mjs";
import * as farm from "./farm.mjs";
import * as lab from "./lab.mjs";

const OUT = resolve(HERE, "..", "site");

// The model is checked before anything is written: the page runs the same code.
{
  const a = M.steady(M.DESIGN), b = M.steady(M.DESIGN, M.LAB_VOLUME);
  const near = (x, y, tol) => Math.abs(x - y) <= tol;
  const checks = [
    ["farm volume 520 m³", near(M.VOLUME, 520.3, 0.5)],
    ["lab volume 5.0 L", near(M.LAB_VOLUME * 1000, 5, 0.01)],
    ["same share of B₀ at both scales", near(a.share, b.share, 1e-12)],
    ["same CH₄ per m³ of reactor at both scales", near(a.ch4PerM3, b.ch4PerM3, 1e-12)],
    ["same organic load at both scales", near(a.olr, b.olr, 1e-12)],
    ["washout at μm·HRT = 1", M.steady({ ...M.DESIGN, hrt: 1 / M.muMax(37) }).share === 0],
  ];
  const bad = checks.filter(([, ok]) => !ok);
  if (bad.length) { console.error("model checks failed:", bad.map(([n]) => n).join("; ")); process.exit(1); }
}

const T = {
  title: ["CSTR digester at two scales", "Biodigestor CSTR em duas escalas"],
  lede: [
    "The same completely mixed digester, as a 520 m³ farm tank and as a 5 L bench reactor. One panel runs both on one plant clock: change the temperature, the retention time or the feed and watch both answer.",
    "O mesmo biodigestor de mistura completa, como um tanque de 520 m³ na fazenda e como um reator de bancada de 5 L. Um só painel comanda os dois num mesmo relógio: mude a temperatura, o tempo de retenção ou a alimentação e veja os dois responderem.",
  ],
  hint: ["← → speed · M mixer · F feed", "← → velocidade · M agitador · F alimentar"],
  model: [
    "Both run a teaching model: Chen and Hashimoto's kinetics for a completely mixed reactor, with Hashimoto's K for dairy manure and CP2b's dairy parameters (BMP 200 Nm³ CH₄/t VS, VS 78 % of TS). The kinetics know no size, so at one HRT both reach the same share of B₀; what scale changes is everything around them: how fast heat comes and goes, how the feed arrives, how the gas is measured. Plant time runs about 10 minutes per second. The model has no acidification or ammonia inhibition: below an HRT that loads more than about 4 kg VS/m³·d, real digesters fail before they reach its numbers.",
    "Os dois rodam um modelo didático: a cinética de Chen e Hashimoto para um reator de mistura completa, com o K de Hashimoto para esterco leiteiro e os parâmetros de leite do CP2b (BMP 200 Nm³ CH₄/t SV, SV 78 % do ST). A cinética não conhece tamanho: no mesmo TRH os dois atingem a mesma fração do B₀; o que a escala muda é tudo à volta: a rapidez com que o calor entra e sai, como chega a alimentação, como se mede o gás. O tempo da planta corre cerca de 10 minutos por segundo. O modelo não tem acidificação nem inibição por amônia: abaixo do TRH que carrega mais de uns 4 kg SV/m³·d, um digestor real falha antes de chegar aos seus números.",
  ],
};
const t = (key) => T[key][L];

// ── Panel ───────────────────────────────────────────────────────────────────
const U = [
  {
    temperature: "Temperature", hrt: "Retention time (HRT)", ts: "Feed solids (TS)", mixer: "Mixers", speed: "Plant time",
    auto: "auto, 15 min/h", on: "always on", off: "off", perSec: "min per second",
    feedNow: "Feed now", emptyBag: "Empty the gas bag", controls: "Operation",
    quantity: "", farm: "Farm · 520 m³", lab: "Lab · 5 L", both: "Both scales",
    volume: "Working volume", feed: "Feed", olr: "Organic load", share: "Of B₀ reached", ch4: "Methane", biogas: "Biogas", perM3: "CH₄ per m³ of reactor",
    power: "Electric equivalent", cows: "Dairy cows", turns: "Gas meter", washout: "Washout below", scale: "Volume ratio",
    warnOlr: "Organic load above 4 kg VS/m³·d: real digesters acidify here; this model cannot show it.",
    warnWash: "HRT at or below washout: the methanogens leave faster than they grow, and gas stops.",
    chart: "Methane against retention time, at this temperature and feed: one curve, two scales", xAxis: "HRT (d)", yFarm: "farm, Nm³ CH₄/d", yLab: "bench, NL CH₄/d", zoneWash: "washout", zoneOlr: "OLR > 4", now: "now",
    table: "Show as a table", turnsUnit: "turns/d", bagFull: "bag emptied for analysis",
  },
  {
    temperature: "Temperatura", hrt: "Tempo de retenção (TRH)", ts: "Sólidos na alimentação (ST)", mixer: "Agitadores", speed: "Tempo da planta",
    auto: "automático, 15 min/h", on: "sempre ligado", off: "desligado", perSec: "min por segundo",
    feedNow: "Alimentar agora", emptyBag: "Esvaziar a bolsa de gás", controls: "Operação",
    quantity: "", farm: "Fazenda · 520 m³", lab: "Bancada · 5 L", both: "As duas escalas",
    volume: "Volume útil", feed: "Alimentação", olr: "Carga orgânica", share: "Do B₀ atingido", ch4: "Metano", biogas: "Biogás", perM3: "CH₄ por m³ de reator",
    power: "Equivalente elétrico", cows: "Vacas leiteiras", turns: "Medidor de gás", washout: "Lavagem abaixo de", scale: "Razão de volumes",
    warnOlr: "Carga orgânica acima de 4 kg SV/m³·d: digestores reais acidificam aqui; este modelo não mostra isso.",
    warnWash: "TRH no limite de lavagem ou abaixo: as metanogênicas saem mais rápido do que crescem, e o gás para.",
    chart: "Metano em função do tempo de retenção, nesta temperatura e alimentação: uma curva, duas escalas", xAxis: "TRH (d)", yFarm: "fazenda, Nm³ CH₄/d", yLab: "bancada, NL CH₄/d", zoneWash: "lavagem", zoneOlr: "COV > 4", now: "agora",
    table: "Ver como tabela", turnsUnit: "voltas/d", bagFull: "bolsa esvaziada para análise",
  },
][L];
const slider = (key, min, max, step, value) => `<label class="cstr-ctl"><span>${esc(U[key])} <output data-out="${key}"></output></span><input type="range" data-in="${key}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
const ROWS = [
  ["volume", "both3"], ["feed", "pair"], ["olr", "same"], ["share", "same"], ["ch4", "pair"], ["biogas", "pair"], ["perM3", "same"], ["power", "pair"], ["cows", "farm"], ["turns", "lab"], ["washout", "same"],
];
const row = ([key, kind]) => `<tr data-row="${key}"><th scope="row">${esc(U[key])}</th>${kind === "same" ? `<td colspan="2" class="cstr-same"><output data-cell="${key}"></output></td>` : `<td><output data-cell="${key}.farm"></output></td><td><output data-cell="${key}.lab"></output></td>`}</tr>`;
const panel = `
<section class="cstr-panel" aria-label="${esc(t("title"))}">
  <div class="cstr-ctls">
    <h2>${esc(U.controls)}</h2>
    ${slider("temperature", 20, 55, 1, M.DESIGN.temperature)}
    ${slider("hrt", 3, 60, 1, M.DESIGN.hrt)}
    ${slider("ts", 4, 12, 0.5, M.DESIGN.ts * 100)}
    <label class="cstr-ctl"><span>${esc(U.mixer)}</span><select data-in="mixer"><option value="auto">${esc(U.auto)}</option><option value="on">${esc(U.on)}</option><option value="off">${esc(U.off)}</option></select></label>
    <label class="cstr-ctl"><span>${esc(U.speed)}</span><select data-in="speed">${[2.5, 5, 10, 30, 60].map((v) => `<option value="${v}"${v === 10 ? " selected" : ""}>${String(v).replace(".", L ? "," : ".")} ${esc(U.perSec)}</option>`).join("")}</select></label>
    <div class="cstr-btns"><button type="button" data-act="feed">${esc(U.feedNow)}</button><button type="button" data-act="bag">${esc(U.emptyBag)}</button></div>
  </div>
  <div class="cstr-nums">
    <table class="cstr-cmp"><thead><tr><th></th><th scope="col">${esc(U.farm)}</th><th scope="col">${esc(U.lab)}</th></tr></thead><tbody>${ROWS.map(row).join("")}</tbody></table>
    <p class="cstr-warn" role="status" aria-live="polite" data-warn></p>
  </div>
  <figure class="cstr-chart">
    <figcaption>${esc(U.chart)}</figcaption>
    <div class="cstr-plot" data-plot><svg viewBox="0 0 640 260" role="img" aria-label="${esc(U.chart)}"></svg><div class="cstr-tip" data-tip hidden></div></div>
    <details><summary>${esc(U.table)}</summary><table data-table><thead><tr><th>${esc(U.xAxis)}</th><th>${esc(U.olr)}</th><th>${esc(U.share)}</th><th>${esc(U.yFarm)}</th><th>${esc(U.yLab)}</th></tr></thead><tbody></tbody></table></details>
  </figure>
</section>`;

// ── Live: one clock, one panel, two figures ─────────────────────────────────
const shellLive = SHELL_SRC.replace(/^import .*$/m, "").replace(/^export /gm, "");
const modelLive = MODEL_SRC.replace(/^export /gm, "");
const live = `
${shellLive}
${modelLive}
const U = ${JSON.stringify(U)};
const LANG = ${JSON.stringify(lang)};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clockText = (h) => { const day = Math.floor(h / 24) + 1, hh = Math.floor(h % 24), mm = Math.floor((h * 60) % 60); return ${JSON.stringify(L ? "Dia " : "Day ")} + day + " · " + String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"); };
${farm.live}
${lab.live}
const clock = { hour: 6, minutesPerSecond: 10, mixerMode: "auto" };
const roots = { farm: document.querySelector('[data-fig="farm"]'), lab: document.querySelector('[data-fig="lab"]') };
const figs = { farm: farmLive(${JSON.stringify(farm.data)}, roots.farm, clock), lab: labLive(${JSON.stringify(lab.data)}, roots.lab, clock) };
const still = matchMedia("(prefers-reduced-motion: reduce)");
const seen = { farm: false, lab: false };
let frame = 0, last = 0, wall = 0;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  wall += dt;
  const calm = still.matches;
  const dtH = calm ? 0 : (dt * clock.minutesPerSecond) / 60;
  clock.hour += dtH;
  // Both plants run on the clock; only the ones on screen are drawn.
  for (const name of Object.keys(figs)) figs[name].tick(dt, dtH, wall, calm, seen[name]);
  frame = seen.farm || seen.lab ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && (seen.farm || seen.lab)) { last = 0; frame = requestAnimationFrame(tick); } };
for (const name of Object.keys(roots)) new IntersectionObserver((entries) => { seen[name] = entries[entries.length - 1].isIntersecting; run(); }, { rootMargin: "120px 0px" }).observe(roots[name]);

// ── Panel ──
const nf = (d) => new Intl.NumberFormat(LANG === "pt" ? "pt-BR" : "en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
const f0 = nf(0), f1 = nf(1), f2 = nf(2), f3 = nf(3);
const sig = (v) => (v === 0 ? f0 : v >= 100 ? f0 : v >= 10 ? f1 : v >= 1 ? f2 : f3).format(v);
const ins = Object.fromEntries([...document.querySelectorAll("[data-in]")].map((el) => [el.dataset.in, el]));
const outs = Object.fromEntries([...document.querySelectorAll("[data-out]")].map((el) => [el.dataset.out, el]));
const cells = Object.fromEntries([...document.querySelectorAll("[data-cell]")].map((el) => [el.dataset.cell, el]));
const warn = document.querySelector("[data-warn]");
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
  outs.temperature.textContent = f0.format(plant.temperature) + " °C";
  outs.hrt.textContent = f0.format(plant.hrt) + " d";
  outs.ts.textContent = f1.format(plant.ts * 100) + " %";
  const a = farmNow, b = labNow;
  cells["volume.farm"].textContent = f0.format(VOLUME) + " m³";
  cells["volume.lab"].textContent = f1.format(LAB_VOLUME * 1000) + " L";
  cells["feed.farm"].textContent = f1.format(a.q) + " m³/d";
  cells["feed.lab"].textContent = f0.format(b.q * 1e6) + " mL/d";
  cells.olr.textContent = f2.format(a.olr) + " kg VS/m³·d";
  cells.share.textContent = f0.format(a.share * 100) + " %";
  cells["ch4.farm"].textContent = f0.format(a.ch4) + " Nm³/d";
  cells["ch4.lab"].textContent = f2.format(b.ch4 * 1000) + " NL/d";
  cells["biogas.farm"].textContent = f0.format(a.biogas) + " Nm³/d";
  cells["biogas.lab"].textContent = f2.format(b.biogas * 1000) + " NL/d";
  cells.perM3.textContent = f2.format(a.ch4PerM3) + " Nm³/m³·d";
  cells["power.farm"].textContent = f1.format(a.kwe) + " kW";
  cells["power.lab"].textContent = sig(b.kwe * 1000) + " W";
  cells["cows.farm"].textContent = "≈ " + f0.format(Math.round(a.cows / 5) * 5);
  cells["cows.lab"].textContent = "—";
  cells["turns.farm"].textContent = "—";
  cells["turns.lab"].textContent = f0.format((b.biogas * 1e6) / LAB.meterMl) + " " + U.turnsUnit;
  cells.washout.textContent = Number.isFinite(a.washoutHrt) ? f1.format(a.washoutHrt) + " d" : "—";
  const notes = [];
  if (plant.hrt <= a.washoutHrt) notes.push('<span class="cstr-badge" data-level="critical" aria-hidden="true">✕</span> ' + U.warnWash);
  else if (a.olr > 4) notes.push('<span class="cstr-badge" data-level="warning" aria-hidden="true">!</span> ' + U.warnOlr);
  warn.innerHTML = notes.join("<br>");
  cells.olr.dataset.level = a.olr > 4 ? "warning" : "";
  drawChart();
}
Object.values(ins).forEach((el) => el.addEventListener("input", readPanel));
const feedNow = () => { figs.farm.feedNow(); figs.lab.feedNow(); };
document.querySelector('[data-act="feed"]').addEventListener("click", feedNow);
document.querySelector('[data-act="bag"]').addEventListener("click", () => figs.lab.emptyBag && figs.lab.emptyBag());
document.querySelectorAll(".iso-stage").forEach((stage) => stage.addEventListener("keydown", (event) => {
  const speeds = [...ins.speed.options].map((o) => o.value);
  let i = speeds.indexOf(ins.speed.value);
  if (event.key === "ArrowRight") i = Math.min(speeds.length - 1, i + 1);
  else if (event.key === "ArrowLeft") i = Math.max(0, i - 1);
  else if (event.key === "m" || event.key === "M") { const o = ["auto", "off", "on"]; ins.mixer.value = o[(o.indexOf(ins.mixer.value) + 1) % 3]; readPanel(); event.preventDefault(); return; }
  else if (event.key === "f" || event.key === "F") { feedNow(); event.preventDefault(); return; }
  else return;
  ins.speed.value = speeds[i];
  readPanel();
  event.preventDefault();
}));

// ── Chart: one CH4 curve against HRT, read on two axes: farm on the left, bench on the right ──
const plot = document.querySelector("[data-plot]");
const chartSvg = plot.querySelector("svg");
const tip = plot.querySelector("[data-tip]");
const W = 640, H = 260, Mg = { l: 56, r: 60, t: 22, b: 34 };
const X0 = 2, X1 = 60;
const RATIO = (LAB_VOLUME * 1000) / VOLUME;   // NL at the bench per Nm3 at the farm
const sx = (h) => Mg.l + ((h - X0) / (X1 - X0)) * (W - Mg.l - Mg.r);
const hx = (px) => X0 + ((px - Mg.l) / (W - Mg.l - Mg.r)) * (X1 - X0);
let sy = () => 0;
function drawChart() {
  const curve = Array.from({ length: 233 }, (_, i) => { const h = X0 + (i / 232) * (X1 - X0); return { h, s: steady({ ...plant, hrt: h }) }; });
  const yMax = Math.max(50, ...curve.map((p) => p.s.ch4)) * 1.12;
  const step = [50, 100, 200, 250, 500, 1000].find((v) => yMax / v <= 5) || 2000;
  sy = (v) => H - Mg.b - (v / yMax) * (H - Mg.t - Mg.b);
  const wash = farmNow.washoutHrt, olr4 = farmNow.s0 / 4;
  let g = "";
  for (let v = 0; v <= yMax; v += step) g += '<line class="grid" x1="' + Mg.l + '" x2="' + (W - Mg.r) + '" y1="' + sy(v) + '" y2="' + sy(v) + '"/><text class="tick" x="' + (Mg.l - 8) + '" y="' + (sy(v) + 4) + '" text-anchor="end">' + f0.format(v) + '</text><text class="tick" x="' + (W - Mg.r + 8) + '" y="' + (sy(v) + 4) + '" text-anchor="start">' + sig(v * RATIO) + "</text>";
  for (let h = 10; h <= X1; h += 10) g += '<text class="tick" x="' + sx(h) + '" y="' + (H - Mg.b + 18) + '" text-anchor="middle">' + h + "</text>";
  const zone = (a, b, level, label) => {
    if (b <= X0 || a >= b) return "";
    const xa = sx(Math.max(X0, a)), xb = sx(Math.min(X1, b));
    return '<rect class="zone" data-level="' + level + '" x="' + xa + '" y="' + Mg.t + '" width="' + (xb - xa) + '" height="' + (H - Mg.t - Mg.b) + '"/>' + (xb - xa > 26 ? '<text class="zone-label" x="' + (xa + 5) + '" y="' + (H - Mg.b - 7) + '">' + label + "</text>" : "");
  };
  g += zone(X0, wash, "critical", U.zoneWash) + zone(wash, olr4, "warning", U.zoneOlr);
  g += '<line class="axis" x1="' + Mg.l + '" x2="' + (W - Mg.r) + '" y1="' + sy(0) + '" y2="' + sy(0) + '"/>';
  g += '<path class="series" d="' + curve.map((p, i) => (i ? "L" : "M") + sx(p.h).toFixed(1) + " " + sy(p.s.ch4).toFixed(1)).join("") + '"/>';
  const cx = sx(plant.hrt), cy = sy(farmNow.ch4);
  const flip = cx > W - Mg.r - 150;
  const ly = Math.max(Mg.t + 22, cy - 9);
  g += '<circle class="now" cx="' + cx + '" cy="' + cy + '" r="5"/><text class="now-label" x="' + (flip ? cx - 9 : cx + 9) + '" y="' + ly + '" text-anchor="' + (flip ? "end" : "start") + '">' + U.now + " · " + f0.format(farmNow.ch4) + " Nm³ · " + f2.format(labNow.ch4 * 1000) + " NL</text>";
  g += '<text class="axis-title" x="' + (W - Mg.r) + '" y="' + (H - 4) + '" text-anchor="end">' + U.xAxis + '</text><text class="axis-title" x="' + Mg.l + '" y="' + (Mg.t - 8) + '" text-anchor="start">' + U.yFarm + '</text><text class="axis-title" x="' + (W - Mg.r + 50) + '" y="' + (Mg.t - 8) + '" text-anchor="end">' + U.yLab + "</text>";
  g += '<line class="cross" data-cross x1="0" x2="0" y1="' + Mg.t + '" y2="' + (H - Mg.b) + '" style="display:none"/><circle class="cross-dot" data-cross-dot r="4" style="display:none"/>';
  chartSvg.innerHTML = g;
  const rows = [5, 10, 15, 20, 25, 30, 40, 60].map((h) => { const s = steady({ ...plant, hrt: h }); return "<tr><td>" + h + "</td><td>" + f2.format(s.olr) + "</td><td>" + f0.format(s.share * 100) + " %</td><td>" + f0.format(s.ch4) + "</td><td>" + f2.format(s.ch4 * RATIO) + "</td></tr>"; });
  document.querySelector("[data-table] tbody").innerHTML = rows.join("");
}
plot.addEventListener("pointermove", (event) => {
  const box = chartSvg.getBoundingClientRect();
  const px = ((event.clientX - box.left) / box.width) * W;
  const h = clamp(hx(px), X0, X1);
  const s = steady({ ...plant, hrt: h });
  const cross = chartSvg.querySelector("[data-cross]"), dot = chartSvg.querySelector("[data-cross-dot]");
  cross.setAttribute("x1", sx(h)); cross.setAttribute("x2", sx(h)); cross.style.display = "";
  dot.setAttribute("cx", sx(h)); dot.setAttribute("cy", sy(s.ch4)); dot.style.display = "";
  tip.hidden = false;
  tip.innerHTML = "<b>" + U.xAxis.replace(" (d)", "") + " " + f1.format(h) + " d</b><br>" + U.farm + ": " + f0.format(s.ch4) + " Nm³ CH₄/d<br>" + U.lab + ": " + f2.format(s.ch4 * RATIO) + " NL CH₄/d<br>" + U.olr + " " + f2.format(s.olr) + " · " + U.share + " " + f0.format(s.share * 100) + " %";
  const left = (sx(h) / W) * box.width;
  tip.style.left = Math.max(0, Math.min(box.width - 220, left + 12)) + "px";
  tip.style.top = ((sy(s.ch4) / H) * box.height - 10) + "px";
});
plot.addEventListener("pointerleave", () => { tip.hidden = true; chartSvg.querySelectorAll("[data-cross],[data-cross-dot]").forEach((el) => (el.style.display = "none")); });

readPanel();
for (const name of Object.keys(figs)) figs[name].tick(0, 0, 0, true, true);
`;

const CSS = `
.iso{--cstr-slurry:#b7aa98;--cstr-slurry-top:#c9bead;--cstr-slurry-dark:#8f8270;--cstr-scum:#9d8f78;--cstr-sediment:#7f7362;--cstr-insul:#f1ead2;--cstr-heat:#d8d8d4;--cstr-heat-on:#d9622b;--cstr-under:#d6d6d2;--cstr-bubble:#fbfbfa;--cstr-gas-0:#a9adb0;--cstr-gas-1:#b4b8bb;--cstr-gas-2:#bfc3c6;--cstr-gas-3:#cacdd0;--cstr-gas-under:#8e9295;--cstr-flame:#ec835a;--cstr-lamp-on:#0ca30c;--cstr-series:#2a78d6;--cstr-grid:#e1e0d9;--cstr-critical:#d03b3b;--cstr-warning:#fab219;--cstr-surface:#fcfcfb;--cstr-screen:#2a2d2a;--cstr-screen-text:#9fe0a8}
.iso[data-theme="dark"]{--cstr-slurry:#4a4339;--cstr-slurry-top:#5a5246;--cstr-slurry-dark:#3a342c;--cstr-scum:#62584a;--cstr-sediment:#2f2a23;--cstr-insul:#4d4a3d;--cstr-heat:#2a2a2a;--cstr-heat-on:#e0773f;--cstr-under:#101010;--cstr-bubble:#cfd3d6;--cstr-gas-0:#30343a;--cstr-gas-1:#363b41;--cstr-gas-2:#3d4249;--cstr-gas-3:#444a51;--cstr-gas-under:#24272b;--cstr-flame:#ec835a;--cstr-lamp-on:#0ca30c;--cstr-series:#3987e5;--cstr-grid:#2c2c2a;--cstr-surface:#1a1a19;--cstr-screen:#070807;--cstr-screen-text:#7fd08a}
.cstr-slurry .iso-fill,.cstr-slurry .iso-shade{fill:var(--cstr-slurry)}
.cstr-slurry .iso-shade[data-shade="0"],.cstr-slurry .iso-shade[data-shade="1"]{fill:var(--cstr-slurry-dark)}
.cstr-slurry .iso-top{fill:var(--cstr-slurry-top)}
.cstr-scum{fill:var(--cstr-scum)}
.cstr-sediment{fill:var(--cstr-sediment)}
.cstr-insul{fill:var(--cstr-insul)}
.cstr-heat{fill:var(--cstr-heat);transition:fill .6s}
.cstr-heat.on{fill:var(--cstr-heat-on)}
.cstr-under.iso-shade{fill:var(--cstr-under)}
.cstr-inner .iso-shade[data-shade="0"]{fill:var(--cstr-gas-0)}
.cstr-inner .iso-shade[data-shade="1"]{fill:var(--cstr-gas-1)}
.cstr-inner .iso-shade[data-shade="2"]{fill:var(--cstr-gas-2)}
.cstr-inner .iso-shade[data-shade="3"]{fill:var(--cstr-gas-3)}
.cstr-inner .cstr-gas-under.iso-shade{fill:var(--cstr-gas-under)}
.cstr-cut{stroke-width:1.4}
.cstr-outer-cut .iso-line{stroke-width:1.4}
.cstr-louvre{fill:var(--anatomy-shade-0)}
.cstr-screen{fill:var(--cstr-screen)}
.iso .iso-face-text.cstr-screen-text{fill:var(--cstr-screen-text);font-family:var(--anatomy-mono);font-weight:600}
[data-part="bubbles"] circle{fill:var(--cstr-bubble);stroke:var(--anatomy-lo);stroke-width:.35}
[data-part="exhaust"] circle{fill:var(--anatomy-lo)}
.cstr-needle{fill:var(--anatomy-lit);stroke:var(--anatomy-lit);stroke-width:.4;stroke-linejoin:round}
.cstr-flame{fill:var(--cstr-flame);stroke:none}
.cstr-lamp{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo);stroke-width:.4;transition:fill .4s}
.cstr-lamp.on{fill:var(--cstr-lamp-on)}
.cstr-flow{opacity:0;transition:opacity .5s;stroke-width:.9}
.on>.cstr-flow{opacity:.9}
[data-part="swirl"]{opacity:0;transition:opacity 1s}
[data-part="swirl"].on{opacity:.8}
.cstr-switch{margin:0 0 18px;font-size:13px;color:var(--anatomy-muted);white-space:pre-wrap}
.cstr-switch a{color:var(--anatomy-text)}
.cstr-switch b{font-weight:600;color:var(--anatomy-text)}
.cstr-head{margin:0 0 22px;max-width:860px}
.cstr-head h1{margin:0 0 6px;font-size:22px;line-height:1.25;font-weight:600;color:var(--anatomy-strong);letter-spacing:-.01em}
.cstr-head p{margin:0;color:var(--anatomy-text)}
.cstr-figs{display:grid;grid-template-columns:1fr;gap:28px}
@media (min-width:1100px){.cstr-figs{grid-template-columns:1fr 1fr;gap:24px}}
.cstr-figs .iso-figure{margin:0}
.cstr-model{margin:18px 0 0;color:var(--anatomy-muted);font-size:13px;max-width:1100px}
.iso-stage{outline:none}
.iso-stage:focus-visible{box-shadow:0 0 0 1px var(--anatomy-lo)}
.cstr-panel{margin:22px 0 0;padding:18px;box-shadow:0 0 0 1px var(--anatomy-mid);background:var(--anatomy-card);font-size:13px;color:var(--anatomy-text);display:grid;grid-template-columns:1fr;gap:20px}
@media (min-width:760px){.cstr-panel{grid-template-columns:minmax(220px,280px) 1fr}.cstr-chart{grid-column:1 / -1}}
@media (min-width:1280px){.cstr-panel{grid-template-columns:minmax(230px,270px) minmax(380px,1fr) minmax(460px,1.25fr)}.cstr-chart{grid-column:auto}}
.cstr-panel h2{margin:0 0 2px;font-size:13px;font-weight:600;color:var(--anatomy-strong)}
.cstr-ctls{display:flex;flex-direction:column;gap:12px}
.cstr-ctl{display:flex;flex-direction:column;gap:4px}
.cstr-ctl span{font-weight:500;color:var(--anatomy-muted)}
.cstr-ctl output{color:var(--anatomy-text);font-family:var(--anatomy-mono,ui-monospace,monospace)}
.cstr-ctl input{width:100%;accent-color:var(--cstr-series)}
.cstr-ctl select,.cstr-btns button{font:inherit;color:var(--anatomy-text);background:var(--anatomy-page);border:1px solid var(--anatomy-mid);border-radius:4px;padding:5px 8px}
.cstr-btns{display:flex;flex-wrap:wrap;gap:8px}
.cstr-btns button{cursor:pointer}
.cstr-btns button:hover{border-color:var(--anatomy-text)}
.cstr-btns button:focus-visible{outline:2px solid var(--cstr-series);outline-offset:1px}
.cstr-cmp{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.cstr-cmp th,.cstr-cmp td{padding:5px 8px 5px 0;text-align:left;border-bottom:1px solid var(--cstr-grid);vertical-align:baseline}
.cstr-cmp thead th{font-weight:600;color:var(--anatomy-strong)}
.cstr-cmp tbody th{font-weight:500;color:var(--anatomy-muted)}
.cstr-cmp output{font:500 13.5px/1.3 var(--anatomy-mono,ui-monospace,monospace);color:var(--anatomy-text);white-space:nowrap}
.cstr-same{text-align:center!important;background:linear-gradient(90deg,transparent,var(--cstr-grid) 50%,transparent)}
.cstr-cmp output[data-level="warning"]{text-decoration:underline 2px var(--cstr-warning);text-underline-offset:4px}
.cstr-warn{min-height:1.4em;margin:12px 0 0;color:var(--anatomy-text)}
.cstr-badge{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;font-size:11px;font-weight:700;color:#fff;vertical-align:-3px}
.cstr-badge[data-level="critical"]{background:var(--cstr-critical)}
.cstr-badge[data-level="warning"]{background:var(--cstr-warning);color:#0b0b0b}
.cstr-chart{margin:0;min-width:0}
.cstr-chart figcaption{color:var(--anatomy-muted);margin-bottom:6px}
.cstr-plot{position:relative}
.cstr-plot svg{display:block;width:100%;height:auto;background:var(--cstr-surface);font:12px ui-sans-serif,system-ui,sans-serif}
.cstr-plot .grid{stroke:var(--cstr-grid);stroke-width:1}
.cstr-plot .axis{stroke:var(--anatomy-lo);stroke-width:1}
.cstr-plot .tick,.cstr-plot .axis-title{fill:var(--anatomy-muted)}
.cstr-plot .series{fill:none;stroke:var(--cstr-series);stroke-width:2;stroke-linejoin:round}
.cstr-plot .zone[data-level="critical"]{fill:var(--cstr-critical);opacity:.12}
.cstr-plot .zone[data-level="warning"]{fill:var(--cstr-warning);opacity:.16}
.cstr-plot .zone-label{fill:var(--anatomy-text);font-weight:600}
.cstr-plot .now{fill:var(--cstr-series);stroke:var(--cstr-surface);stroke-width:2}
.cstr-plot .now-label{fill:var(--anatomy-text);font-weight:600}
.cstr-plot .cross{stroke:var(--anatomy-lo);stroke-dasharray:3 3}
.cstr-plot .cross-dot{fill:var(--cstr-surface);stroke:var(--cstr-series);stroke-width:2}
.cstr-tip{position:absolute;pointer-events:none;background:var(--anatomy-card);box-shadow:0 0 0 1px var(--anatomy-mid),0 4px 14px rgba(0,0,0,.12);padding:6px 9px;font-size:12px;line-height:1.45;white-space:nowrap;color:var(--anatomy-text)}
@media (max-width:600px){.cstr-plot svg{font-size:21px}}
.cstr-chart details{margin-top:8px;color:var(--anatomy-muted)}
.cstr-chart table{border-collapse:collapse;margin-top:6px;font-variant-numeric:tabular-nums;color:var(--anatomy-text)}
.cstr-chart th,.cstr-chart td{padding:3px 12px 3px 0;text-align:right;border-bottom:1px solid var(--cstr-grid)}
.cstr-chart th{font-weight:500;color:var(--anatomy-muted)}
`;

const plate = (name, fig, mod) => `<div data-fig="${name}">${k.plateHtml({
  fig, title: mod.text.title, hint: t("hint"), readout: "", keys: mod.text.keys, caption: mod.text.caption,
  body: `<div class="iso-stage" tabindex="0" role="img" aria-label="${esc(mod.text.title)}">${mod.svg}</div>`,
})}</div>`;
// The four versions of the page link to each other.
const variant = (pt, light) => `cstr${pt ? "-pt" : ""}${light ? "-light" : ""}.html`;
const switcher = `<nav class="cstr-switch">${[["English", 0, theme === "light"], ["Português", 1, theme === "light"]].map(([label, pt, light]) => (pt === L ? `<b>${label}</b>` : `<a href="${variant(pt, light)}">${label}</a>`)).join(" · ")}  |  ${[[L ? "claro" : "light", true], [L ? "escuro" : "dark", false]].map(([label, light]) => (light === (theme === "light") ? `<b>${label}</b>` : `<a href="${variant(L, light)}">${label}</a>`)).join(" · ")}  |  <a href="https://github.com/aikiesan/simulador_CSTR">GitHub</a></nav>`;
const head = `<header class="cstr-head"><h1>${esc(t("title"))}</h1><p>${esc(t("lede"))}</p></header>`;
const body = switcher + head + `<div class="cstr-figs">${plate("farm", "Fig 1", farm)}${plate("lab", "Fig 2", lab)}</div>` + panel + `<p class="cstr-model">${esc(t("model"))}</p>`;
const page = k.pageHtml({ title: t("title"), theme, body, script: kitScript() + live, width: 1480 })
  .replace("</style>", `${CSS}</style>`)
  .replace('<html lang="en">', `<html lang="${lang === "pt" ? "pt-BR" : "en"}">`)
  .replace("margin:64px auto 96px", "margin:40px auto 80px");
mkdirSync(OUT, { recursive: true });
const name = variant(lang === "pt", theme === "light");
writeFileSync(join(OUT, name), page);
if (lang === "pt" && theme === "light") writeFileSync(join(OUT, "index.html"), page);
console.log("wrote", join("site", name), `${(page.length / 1024).toFixed(0)} KB`, `farm ${farm.R.items.length} items`, `lab ${lab.R.items.length} items`);
if (process.argv.includes("--audit")) {
  console.log("── audit: Fig 1, farm ──");
  A.auditOrExit(farm.R, farm.P);
  console.log("── audit: Fig 2, bench ──");
  A.auditOrExit(lab.R, lab.P);
}
