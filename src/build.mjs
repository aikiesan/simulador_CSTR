// The page: the bench reactor and the farm tank, one at a time behind two tabs, both run by one panel on one plant clock;
// every part can be picked, zoomed and read; every run is logged, charted and downloadable. Both figures pass the Anatomy audit.
// node src/build.mjs --light [--audit]  ->  site/index.html (Portuguese)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { k, A, HERE, kitScript, SHELL_SRC, MODEL_SRC, theme, esc } from "./kit.mjs";
import * as M from "./model.mjs";
import * as farm from "./farm.mjs";
import * as lab from "./lab.mjs";
import { topics, badgesFor } from "./topics.mjs";

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

// The site is published in Portuguese only.
const T = {
  title: "Biodigestor CSTR: da bancada à fazenda",
  lede: "O mesmo biodigestor de mistura completa (CSTR) em duas escalas: um reator de bancada de 5 L e um tanque de fazenda de 520 m³. Escolha a escala na aba, clique em qualquer peça para destacá-la, ampliá-la e ler suas dimensões, e rode o processo: cada corrida é registrada a cada 15 minutos de tempo da planta, em gráficos, numa tabela diária e em CSV para analisar à parte.",
  hint: "clique numa peça · ← → velocidade",
  model: "Modelo didático: a cinética de Chen e Hashimoto para um reator de mistura completa, com o K de Hashimoto para esterco leiteiro e os parâmetros de leite do CP2b (BMP 200 Nm³ CH₄/t SV, SV 78 % do ST). Fora do equilíbrio, a mesma cinética é integrada na forma de Contois: a biomassa ativa b cresce consumindo o SV degradável S, com μ = μm·S/(K·b + S), e sai com o efluente; em regime ela cai exatamente no estado estacionário de Chen e Hashimoto. A biomassa é contada pela massa de SV que a formou, então nenhum parâmetro novo entra. A cinética não conhece tamanho: no mesmo TRH as duas escalas atingem a mesma fração do B₀; o que a escala muda é tudo à volta: a rapidez com que o calor entra e sai, como chega a alimentação, como se mede o gás. O modelo não tem acidificação nem inibição por amônia: acima de uns 4 kg SV/m³·d, um digestor real falha antes de chegar aos seus números.",
};
const t = (key) => T[key];

const U = {
  temperature: "Temperatura", hrt: "Tempo de retenção (TRH)", ts: "Sólidos na alimentação (ST)", mixer: "Agitadores", speed: "Tempo da planta por segundo",
  auto: "automático, 15 min/h", on: "sempre ligado", off: "desligado", dayPerSec: "dia/s",
  feedNow: "Alimentar agora", emptyBag: "Esvaziar a bolsa de gás", controls: "Operação",
  farm: "Fazenda · 520 m³", lab: "Bancada · 5 L", tabsLabel: "Escala do reator", tabLabSub: "reator de laboratório", tabFarmSub: "tanque em escala real",
  volume: "Volume útil", feed: "Alimentação", olr: "Carga orgânica", share: "Do B₀ atingido", ch4: "Metano", biogas: "Biogás", perM3: "CH₄ por m³ de reator",
  power: "Equivalente elétrico", cows: "Vacas leiteiras", turns: "Medidor de gás", washout: "Lavagem abaixo de",
  warnOlr: "Carga orgânica acima de 4 kg SV/m³·d: digestores reais acidificam aqui; este modelo não mostra isso.",
  warnWash: "TRH no limite de lavagem ou abaixo: as metanogênicas saem mais rápido do que crescem, e o gás para.",
  chart: "Metano por m³ de reator em função do TRH, nesta temperatura e alimentação: uma curva serve às duas escalas", xAxis: "TRH (d)", yFarm: "fazenda, Nm³ CH₄/d", yLab: "bancada, NL CH₄/d", zoneWash: "lavagem", zoneOlr: "COV > 4", now: "agora",
  table: "Ver como tabela", turnsUnit: "voltas/d",
  heatFail: "Falha no aquecimento", scenarios: "Cenários prontos", other: "Na outra escala", watch: "O que observar", pause: "Pausar", resume: "Continuar",
  diameter: "Diâmetro interno", depth: "Profundidade do líquido",
  ratios: "Da bancada à fazenda: tamanho ×{lin} · superfície molhada ×{area} · volume ×{vol}. No mesmo TRH, toda vazão cresce com o volume; a perda de calor cresce só com a superfície.",
  presets: {
    design: ["Ponto de projeto", "37 °C, 25 d, 8 % de ST: cerca de 90 % do B₀ com 2,5 kg SV/m³·d. O gasômetro enche e o motor funciona em blocos."],
    cold: ["Digestor frio", "25 °C, como um tanque sem aquecimento num clima ameno. Em 25 d a fração do B₀ cai só de 90 para 82 %, mas a lavagem passa de 2,8 para 5,1 d. Veja a bancada esfriar em horas e o tanque da fazenda levar dias."],
    thermo: ["Termofílico", "52 °C. Neste modelo o crescimento sobe em linha reta com a temperatura, então em 25 d há pouco a ganhar (94 %); um reator mais quente compensa em TRH curto."],
    short: ["TRH curto", "8 d: mais que o dobro do gás no papel, mas com 7,8 kg SV/m³·d digestores reais acidificam, e este modelo não mostra isso."],
    dilute: ["Alimentação diluída", "4 % de ST: água de lavagem demais. A mesma fração do B₀, metade do metano: o mesmo tanque agora guarda metade do esterco."],
    still: ["Agitadores desligados", "A crosta sobe e a areia assenta. A cinética continua supondo mistura completa, então o gás não muda aqui; num tanque real, zonas mortas reduzem o volume útil."],
  },
  facts: {
    volume: "Volume útil", hrt: "Tempo de retenção", temp: "Temperatura", surface: "Parede e piso por m³", olr: "Carga orgânica", share: "Do B₀ atingido",
    layers: "Crosta e sedimento", state: "Estado", mode: "Modo", on: "ligado", off: "desligado", failed: "em falha", set: "Ajuste", stored: "Gás armazenado",
    biogasIn: "Biogás produzido", biogasOut: "Consumo do motor", pumping: "bombeando", waiting: "aguardando", perDay: "Por dia", pulse: "Cada alimentação",
    methane: "Metano no biogás", toEngine: "Para o motor", power: "Potência", uses: "Consumo de gás ligado", burning: "queimando", flowing: "escoando",
    heating: "aquecendo", bottle: "Na garrafa", counted: "Contado", turns: "Ponteiro", capacity: "Capacidade",
    left: "SV degradável restante (S)", biomass: "Biomassa ativa (b)", converted: "SV já convertido", pulseVol: "Volume por pulso", next: "Próximo pulso em",
  },
  partsTitle: "Peças, uma a uma", numbers: "Números no desenho", zoomOut: "Ver o conjunto",
  pick: "Clique em qualquer peça, no desenho, no número ou na lista abaixo, para destacá-la, ampliá-la e ler para que serve, suas dimensões e o que está fazendo agora. Esc ou “Ver o conjunto” volta à vista inteira.",
  specs: "Dimensões (como desenhado)", nowLabel: "Agora",
  tempNow: "Temperatura agora", gasNow: "Biogás agora", surface: "Parede e piso por m³",
  yAxis: "Nm³ CH₄ por m³ de reator por dia",
  map: "Mapa do estado estacionário: cada célula é um reator em regime, nesta alimentação", mapMetric: "Mostrar", yMap: "Temperatura (°C)", ofB0: "do B₀",
  mapClick: "clique para operar aqui", mapCsv: "Baixar a grade (CSV)",
  metrics: { perM3: "CH₄ por m³ de reator por dia", share: "Fração do B₀ atingida", left: "SV degradável que sobra (S)" },
  space: "O espaço de operação", spaceLede: "Os mesmos números em regime permanente, para qualquer combinação de TRH e temperatura. A curva corta o mapa na temperatura atual.",
  run: "Análise da corrida", runLede: "Tudo o que o reator fez desde a partida: o gás que sai, o metano acumulado contra o máximo que o SV alimentado permitiria (B₀ × SV), o rendimento de cada dia, o que há dentro do líquido e a temperatura. Passe o cursor sobre os gráficos para ler um instante. As duas escalas correm juntas; a aba escolhe qual se vê.",
  legendMain: "medida principal de cada painel", legendB: "b, biomassa ativa", legendRef: "referência: máximo (B₀ × SV), B₀, ajuste",
  cRate: "Biogás produzido", cCum: "Metano acumulado", cYield: "Rendimento de cada dia", cInside: "Dentro do reator: S, SV degradável restante; b, biomassa ativa", cInsideShort: "Dentro do reator: S e b", cTemp: "Temperatura do líquido",
  sBiogas: "biogás", sProduced: "produzido", sMaxShort: "máximo", sTemp: "líquido", sSet: "ajuste",
  runAxis: "dias desde a partida", day: "Dia", waitDay: "O primeiro dia fecha às 24 h de corrida.", waitRun: "A corrida acabou de começar.",
  ofMax: "do máximo", dayYield: "rendimento do dia",
  runDay: "Dia da corrida", sumCh4: "Metano acumulado", sumVs: "SV alimentado", sumShare: "Do máximo (B₀ × SV)", sumFed: "Alimentado",
  log: "Registro diário (tabela)", csvSamples: "Baixar a corrida (CSV, a cada 15 min)", csvDays: "Baixar o registro diário (CSV)",
  dCols: ["Dia", "T média, °C", "Alimentado", "SV", "CH₄", "Rendimento", "Do B₀", "S", "b"],
  runCtl: "Corrida", startFrom: "Partida", startRunning: "Reator em operação (estado estacionário)", startFresh: "Pouco inóculo (1 % da biomassa ativa)",
  newRun: "Nova corrida", overfeed: "Sobrecarga por um dia", overfeedOn: "Sobrecarga até",
  events: "Eventos", evHeatOff: "Aquecimento falha", evHeatOn: "Aquecimento volta", evOverfeed: "Sobrecarga: alimentação dobrada por 24 h",
  experiments: "Experimentos guiados", expLede: "Cada experimento prepara o reator, começa uma corrida nova e muda uma coisa no momento certo. Leia a pergunta, observe os gráficos e responda com o cursor.",
  question: "Pergunta", lookFor: "O que procurar",
  exps: {
    startup: ["Partida do reator", "O reator é enchido com esterco e só 1 % da biomassa ativa de um reator maduro. Quantos dias até o biogás se estabilizar?", "Em “Dentro do reator”, b cresce como uma exponencial enquanto S cai; o biogás sobe em forma de S. Com o cursor, ache o dia em que o biogás chega a 90 % do valor final. O rendimento diário começa baixo, porque o SV sai sem ser degradado; depois passa do B₀ por alguns dias, porque o reator consome também o estoque de SV com que foi enchido."],
    washout: ["Lavagem", "No dia 1 o TRH cai de 25 para 2 d, abaixo do limite de lavagem (2,8 d a 37 °C). O que acontece com a biomassa?", "b cai dia após dia: as metanogênicas saem com o efluente mais rápido do que crescem. S sobe em direção ao SV da alimentação e o gás some, embora entre muito mais esterco. Voltar o TRH a 25 d não basta de imediato: a biomassa precisa crescer de novo."],
    heating: ["Falha no aquecimento", "Às 6 h o aquecimento falha e volta um dia depois. Quem esfria mais rápido, a bancada ou a fazenda, e quanto o gás sente?", "Na bancada a temperatura cai vários graus em horas; troque para a aba Fazenda (a mesma corrida roda lá) e veja o tanque mal se mexer. O biogás acompanha a temperatura. Repare que, neste modelo, a cinética é pouco sensível à temperatura em TRH longo."],
    shock: ["Sobrecarga", "No dia 1 a bomba entrega o dobro por 24 h. Como respondem S, o biogás e o rendimento?", "S sobe e o biogás tem um pico, mas o rendimento por kg de SV cai nesse dia: parte da carga extra sai pelo efluente sem ser degradada. Depois, tudo volta. Num reator real, uma sobrecarga pode acidificar o meio, e este modelo não mostra isso."],
    tradeoff: ["Produção × rendimento", "No dia 4 o TRH cai para 8 d; no dia 24 sobe para 40 d. O que muda no gás por dia e no gás por kg de SV?", "Com 8 d o biogás por dia mais que dobra, mas a barra de rendimento fica abaixo da linha do B₀ e o “produzido” se afasta do “máximo”. Com 40 d há menos gás por dia, porém cada kg de SV rende mais perto do B₀. A carga orgânica a 8 d (7,8 kg SV/m³·d) acidificaria um reator real."],
    cold: ["Digestor frio", "No dia 3 o ajuste cai para 25 °C; no dia 23 volta a 37 °C. Quanto gás se perde?", "Na bancada o líquido chega a 25 °C em horas; na fazenda, em dias. O gás cai pouco, porque a 25 d de TRH ainda sobra folga sobre a lavagem (5,1 d a 25 °C). Compare b e S antes e depois."],
    dilute: ["Alimentação diluída", "No dia 3 o ST da alimentação cai de 8 para 4 %. A fração do B₀ muda? E o metano por dia?", "O rendimento por kg de SV quase não muda, mas o metano por dia cai pela metade: o mesmo volume de reator agora trata metade do SV. S e b caem juntos para a metade."],
  },
};
const slider = (key, min, max, step, value) => `<label class="cstr-ctl"><span>${esc(U[key])} <output data-out="${key}"></output></span><input type="range" data-in="${key}" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
const ROWS = [
  ["tempNow", "pair"], ["gasNow", "pair"],
  ["diameter", "pair"], ["depth", "pair"], ["volume", "pair"], ["surface", "pair"], ["feed", "pair"], ["olr", "same"], ["share", "same"], ["ch4", "pair"], ["biogas", "pair"], ["perM3", "same"], ["power", "pair"], ["cows", "pair"], ["turns", "pair"], ["washout", "same"],
];
const row = ([key, kind]) => `<tr data-row="${key}"><th scope="row">${esc(U[key])}</th>${kind === "same" ? `<td colspan="2" class="cstr-same"><output data-cell="${key}"></output></td>` : `<td><output data-cell="${key}.lab"></output></td><td><output data-cell="${key}.farm"></output></td>`}</tr>`;
const SPEEDS = [2.5, 5, 10, 30, 60, 180, 360, 720, 1440];
const speedLabel = (v) => (v < 60 ? `${String(v).replace(".", ",")} min/s` : v < 1440 ? `${v / 60} h/s` : `1 ${U.dayPerSec}`);
const panel = `
<section class="cstr-panel" aria-label="${esc(U.controls)}">
  <div class="cstr-ctls">
    <h2>${esc(U.controls)}</h2>
    ${slider("temperature", 20, 55, 1, M.DESIGN.temperature)}
    ${slider("hrt", 2, 60, 1, M.DESIGN.hrt)}
    ${slider("ts", 2, 12, 0.5, M.DESIGN.ts * 100)}
    <label class="cstr-ctl"><span>${esc(U.mixer)}</span><select data-in="mixer"><option value="auto">${esc(U.auto)}</option><option value="on">${esc(U.on)}</option><option value="off">${esc(U.off)}</option></select></label>
    <label class="cstr-ctl"><span>${esc(U.speed)}</span><select data-in="speed">${SPEEDS.map((v) => `<option value="${v}"${v === 30 ? " selected" : ""}>${speedLabel(v)}</option>`).join("")}</select></label>
    <div class="cstr-btns"><button type="button" data-act="feed">${esc(U.feedNow)}</button><button type="button" data-act="bag">${esc(U.emptyBag)}</button><button type="button" data-act="heat" aria-pressed="false" aria-keyshortcuts="H" title="H">${esc(U.heatFail)} <kbd>H</kbd></button><button type="button" data-act="pause" aria-pressed="false" aria-keyshortcuts="Space">${esc(U.pause)}</button></div>
    <h2 class="cstr-sub">${esc(U.scenarios)}</h2>
    <div class="cstr-presets" role="group" aria-label="${esc(U.scenarios)}">${Object.entries(U.presets).map(([key, [label]]) => `<button type="button" data-preset="${key}" aria-pressed="false">${esc(label)}</button>`).join("")}</div>
    <p class="cstr-preset-note" data-preset-note aria-live="polite"></p>
  </div>
  <div class="cstr-nums">
    <table class="cstr-cmp"><thead><tr><th></th><th scope="col">${esc(U.lab)}</th><th scope="col">${esc(U.farm)}</th></tr></thead><tbody>${ROWS.map(row).join("")}</tbody></table>
    <p class="cstr-ratios" data-ratios></p>
    <p class="cstr-warn" role="status" aria-live="polite" data-warn></p>
  </div>
</section>`;

const run = `
<section class="cstr-run" aria-labelledby="cstr-run-title">
  <h2 id="cstr-run-title">${esc(U.run)} · <span data-run-scale>${esc(U.lab)}</span></h2>
  <p class="cstr-lede">${esc(U.runLede)}</p>
  <div class="cstr-run-grid">
    <div class="cstr-run-main">
      <div class="cstr-legend"><span class="cstr-key" data-series="s1">${esc(U.legendMain)}</span><span class="cstr-key" data-series="s2">${esc(U.legendB)}</span><span class="cstr-key" data-series="ref">${esc(U.legendRef)}</span></div>
      <p class="cstr-readline" data-run-read></p>
      <div class="cstr-plot cstr-plot-px" data-run><svg viewBox="0 0 640 700" role="img" aria-label="${esc(U.run)}"></svg></div>
      <details class="cstr-log"><summary>${esc(U.log)}</summary><div class="cstr-tablewrap"><table data-days><thead><tr>${U.dCols.map((c, i) => `<th scope="col">${esc(c)}${[2, 3, 4].includes(i) ? `, <span data-unit="${["fed", "vs", "vol"][i - 2]}"></span>` : i === 5 ? `, <span data-unit="yieldU"></span>` : i >= 7 ? `, <span data-unit="conc"></span>` : ""}</th>`).join("")}</tr></thead><tbody></tbody></table></div></details>
      <div class="cstr-btns cstr-dl"><button type="button" data-csv="samples">${esc(U.csvSamples)}</button><button type="button" data-csv="days">${esc(U.csvDays)}</button></div>
    </div>
    <aside class="cstr-run-side">
      <h3>${esc(U.experiments)}</h3>
      <p class="cstr-muted">${esc(U.expLede)}</p>
      <div class="cstr-presets cstr-exps" role="group" aria-label="${esc(U.experiments)}">${Object.entries(U.exps).map(([key, [label]]) => `<button type="button" data-exp="${key}" aria-pressed="false">${esc(label)}</button>`).join("")}</div>
      <div class="cstr-exp-card" data-exp-card aria-live="polite" hidden></div>
      <h3>${esc(U.runCtl)}</h3>
      <label class="cstr-ctl"><span>${esc(U.startFrom)}</span><select data-start><option value="running">${esc(U.startRunning)}</option><option value="fresh">${esc(U.startFresh)}</option></select></label>
      <div class="cstr-btns"><button type="button" data-act="run">${esc(U.newRun)}</button><button type="button" data-act="overfeed" aria-pressed="false">${esc(U.overfeed)}</button></div>
      <dl class="cstr-facts cstr-sum" data-run-sum></dl>
      <h3>${esc(U.events)}</h3>
      <ol class="cstr-events" start="0" data-events></ol>
    </aside>
  </div>
</section>`;

const space = `
<section class="cstr-space" aria-labelledby="cstr-space-title">
  <h2 id="cstr-space-title">${esc(U.space)}</h2>
  <p class="cstr-lede">${esc(U.spaceLede)}</p>
  <div class="cstr-space-grid">
    <figure class="cstr-chart">
      <figcaption>${esc(U.chart)}</figcaption>
      <div class="cstr-plot cstr-plot-px" data-plot><svg viewBox="0 0 640 260" role="img" aria-label="${esc(U.chart)}"></svg><div class="cstr-tip" data-tip hidden></div></div>
      <details><summary>${esc(U.table)}</summary><table data-table><thead><tr><th>${esc(U.xAxis)}</th><th>${esc(U.olr)}</th><th>${esc(U.share)}</th><th>Nm³/m³·d</th><th>${esc(U.yFarm)}</th><th>${esc(U.yLab)}</th></tr></thead><tbody></tbody></table></details>
    </figure>
    <figure class="cstr-chart">
      <figcaption>${esc(U.map)}</figcaption>
      <label class="cstr-ctl cstr-inline"><span>${esc(U.mapMetric)}</span><select data-map-metric>${Object.entries(U.metrics).map(([key, label]) => `<option value="${key}">${esc(label)}</option>`).join("")}</select></label>
      <div class="cstr-plot cstr-plot-px" data-map><svg viewBox="0 0 640 300" role="img" aria-label="${esc(U.map)}"></svg></div>
      <div class="cstr-ramp"><span data-map-lo></span><i aria-hidden="true"></i><span data-map-hi></span></div>
      <p class="cstr-readline" data-map-read></p>
      <div class="cstr-btns cstr-dl"><button type="button" data-csv="map">${esc(U.mapCsv)}</button></div>
    </figure>
  </div>
</section>`;

// ── Live: the model, the two figures' live code and the page script, with the data they need ──
const shellLive = SHELL_SRC.replace(/^import .*$/m, "").replace(/^export /gm, "");
const modelLive = MODEL_SRC.replace(/^export /gm, "");
const PAGE_SRC = readFileSync(join(HERE, "page.js"), "utf8");
const BADGES = { farm: badgesFor(farm.anchors), lab: badgesFor(lab.anchors) };
const live = `
${shellLive}
${modelLive}
const U = ${JSON.stringify(U)};
const LANG = "pt";
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmtCache = {};
const fmt = (v, d) => (fmtCache[d] ??= new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d })).format(v);
const TOPICS = ${JSON.stringify({ farm: topics("farm"), lab: topics("lab") })};
const BADGES = ${JSON.stringify(BADGES)};
const DATA = { farm: ${JSON.stringify(farm.data)}, lab: ${JSON.stringify(lab.data)} };
const clockText = (h) => { const day = Math.floor(h / 24) + 1, hh = Math.floor(h % 24), mm = Math.floor((h * 60) % 60); return "Dia " + day + " · " + String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"); };
// Hours a timer that runs len hours every per hours is on between t0 and t1.
function onHours(t0, t1, per, len) { let s = 0; for (let k = Math.floor(t0 / per); k * per < t1; k++) { const a = Math.max(t0, k * per), b = Math.min(t1, k * per + len); if (b > a) s += b - a; } return s; }
${farm.live}
${lab.live}
${PAGE_SRC}
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
.cstr-head{margin:0 0 22px;max-width:860px}
.cstr-head h1{margin:0 0 6px;font-size:22px;line-height:1.25;font-weight:600;color:var(--anatomy-strong);letter-spacing:-.01em}
.cstr-head p{margin:0;color:var(--anatomy-text)}
.cstr-model{margin:18px 0 0;color:var(--anatomy-muted);font-size:13px;max-width:1100px}
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
.cstr-panel h2.cstr-sub{margin-top:8px}
.cstr-presets{display:flex;flex-wrap:wrap;gap:6px}
.cstr-presets button{font:inherit;font-size:13px;line-height:1.3;color:var(--anatomy-text);background:var(--anatomy-page);border:1px solid var(--anatomy-mid);border-radius:999px;padding:4px 10px;cursor:pointer}
.cstr-presets button:hover{border-color:var(--anatomy-text)}
.cstr-presets button:focus-visible{outline:2px solid var(--cstr-series);outline-offset:1px}
.cstr-presets button[aria-pressed="true"]{background:var(--anatomy-strong);color:var(--anatomy-page);border-color:var(--anatomy-strong)}
.cstr-preset-note{margin:0;min-height:4.8em;color:var(--anatomy-text)}
.cstr-ratios{margin:10px 0 0;color:var(--anatomy-muted)}
.cstr-btns button{cursor:pointer}
.cstr-btns kbd{font:500 13px var(--anatomy-mono,ui-monospace,monospace);opacity:.7;margin-left:4px}
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
.cstr-plot.cstr-plot-px svg{font-size:13px}
.iso{--cstr-series-2:#eb6834}
.iso[data-theme="dark"]{--cstr-series-2:#d95926}
.cstr-plot .series[data-series="lab"]{stroke:var(--cstr-series-2)}
.cstr-plot .end-label{fill:var(--anatomy-text);font-weight:600}
.cstr-legend{display:flex;flex-wrap:wrap;gap:4px 18px;margin:0 0 6px;color:var(--anatomy-text)}
.cstr-key::before{content:"";display:inline-block;width:18px;border-top:2px solid var(--cstr-series);vertical-align:middle;margin-right:6px}
.cstr-key[data-series="lab"]::before{border-color:var(--cstr-series-2)}
.cstr-facts{display:grid;grid-template-columns:max-content 1fr;gap:3px 14px;margin:0}
.cstr-facts dt{color:var(--anatomy-muted)}
.cstr-facts dd{margin:0;font:500 13px/1.6 var(--anatomy-mono,ui-monospace,monospace);color:var(--anatomy-text);font-variant-numeric:tabular-nums}
.cstr-exploring [data-topic]:not(.hl):not(.hl-in),.cstr-exploring .hl-in>:not([data-topic]){opacity:.2!important}
.cstr-chart details{margin-top:8px;color:var(--anatomy-muted)}
.cstr-chart table{border-collapse:collapse;margin-top:6px;font-variant-numeric:tabular-nums;color:var(--anatomy-text)}
.cstr-chart th,.cstr-chart td{padding:3px 12px 3px 0;text-align:right;border-bottom:1px solid var(--cstr-grid)}
.cstr-chart th{font-weight:500;color:var(--anatomy-muted)}
.cstr-btns button[aria-pressed="true"]{background:var(--anatomy-strong);color:var(--anatomy-page);border-color:var(--anatomy-strong)}
.iso-plate-corner{font-size:13px}
@media (max-width:560px){.iso-plate{padding-bottom:92px}.iso-plate-corner[data-corner="readout"]{left:0;white-space:normal;text-align:right;line-height:1.35}.iso-plate-corner[data-corner="hint"]{bottom:44px}}
.cstr-top{display:flex;justify-content:flex-end;margin:0 0 6px;font-size:13px}
.cstr-top a{color:var(--anatomy-muted)}
.cstr-lede{margin:0 0 14px;max-width:900px;color:var(--anatomy-text)}
.cstr-muted{color:var(--anatomy-muted);margin:0 0 8px}
.cstr-tabs{display:flex;gap:4px;margin:0 0 -1px;position:relative;z-index:1;overflow-x:auto}
.cstr-tabs button{font:inherit;font-size:15px;font-weight:600;color:var(--anatomy-muted);background:transparent;border:1px solid transparent;border-bottom:none;padding:10px 18px 9px;cursor:pointer;text-align:left;line-height:1.25}
.cstr-tabs button small{display:block;font-size:13px;font-weight:400}
.cstr-tabs button:hover{color:var(--anatomy-text)}
.cstr-tabs button[aria-selected="true"]{color:var(--anatomy-strong);background:var(--anatomy-card);border-color:var(--anatomy-mid);box-shadow:inset 0 3px 0 var(--cstr-series)}
.cstr-tabs button:focus-visible{outline:2px solid var(--cstr-series);outline-offset:-2px}
.cstr-view{display:grid;grid-template-columns:minmax(0,1fr);gap:18px;padding:16px;box-shadow:0 0 0 1px var(--anatomy-mid);background:var(--anatomy-page)}
.cstr-view[hidden]{display:none}
@media (min-width:1100px){.cstr-view{grid-template-columns:minmax(0,1fr) 400px}}
.cstr-view .iso-figure{margin:0}
.cstr-view .iso-svg{overflow:hidden}
.cstr-figcol{min-width:0}
.iso-stage{position:relative;outline:none}
.iso-stage:focus-visible{box-shadow:0 0 0 1px var(--anatomy-lo)}
.cstr-leaders{position:absolute;pointer-events:none;overflow:hidden}
.cstr-leaders line{stroke:var(--anatomy-mid);stroke-width:calc(.7px / var(--z,1));opacity:.75}
.cstr-leaders circle{fill:var(--anatomy-strong);transform-box:fill-box;transform-origin:center;transform:scale(calc(1 / var(--z,1)))}
.cstr-leaders .on line{stroke:var(--cstr-series);stroke-width:calc(1.4px / var(--z,1));opacity:1}
.cstr-leaders .on circle{fill:var(--cstr-series)}
.cstr-badges{position:absolute;pointer-events:none}
.cstr-badges button{position:absolute;transform:translate(-50%,-50%);pointer-events:auto;min-width:24px;height:24px;padding:0 4px;border-radius:12px;border:1px solid var(--anatomy-mid);background:var(--anatomy-card);color:var(--anatomy-strong);font:600 13px/22px ui-sans-serif,system-ui,sans-serif;font-variant-numeric:tabular-nums;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.12);transition:background .15s,color .15s}
.cstr-badges button:hover,.cstr-badges button.on{background:var(--cstr-series);border-color:var(--cstr-series);color:#fff}
.cstr-badges button[aria-pressed="true"]{background:var(--anatomy-strong);border-color:var(--anatomy-strong);color:var(--anatomy-page)}
.cstr-no-numbers .cstr-badges,.cstr-no-numbers .cstr-leaders{display:none}
@media (max-width:759px){.cstr-view:not(.cstr-zoomed) .cstr-badges,.cstr-view:not(.cstr-zoomed) .cstr-leaders{display:none}}
.cstr-zoomed .iso-svg .iso-line{vector-effect:non-scaling-stroke}
.cstr-side{min-width:0;font-size:13px;color:var(--anatomy-text)}
.cstr-side-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:6px 12px;margin:0 0 8px}
.cstr-side-head h2{margin:0;font-size:15px;font-weight:600;color:var(--anatomy-strong)}
.cstr-side-head label{display:inline-flex;gap:6px;align-items:center;color:var(--anatomy-muted);cursor:pointer}
.cstr-side-head input{accent-color:var(--cstr-series)}
.cstr-card{padding:12px 14px;box-shadow:0 0 0 1px var(--anatomy-mid);background:var(--anatomy-card);min-height:9em}
.cstr-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin:0 0 6px}
.cstr-card h3{margin:0;font-size:15px;font-weight:600;color:var(--anatomy-strong);display:flex;gap:8px;align-items:center}
.cstr-card h4{margin:12px 0 4px;font-size:13px;font-weight:600;color:var(--anatomy-strong)}
.cstr-num{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 4px;border-radius:12px;background:var(--anatomy-strong);color:var(--anatomy-page);font:600 13px/1 ui-sans-serif,system-ui,sans-serif;font-variant-numeric:tabular-nums;flex:none}
.cstr-back{font:inherit;font-size:13px;color:var(--anatomy-text);background:var(--anatomy-page);border:1px solid var(--anatomy-mid);border-radius:4px;padding:3px 8px;cursor:pointer;white-space:nowrap}
.cstr-back:hover{border-color:var(--anatomy-text)}
.cstr-card .cstr-facts{grid-template-columns:max-content 1fr}
.cstr-list{list-style:none;margin:12px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:2px 8px}
@media (max-width:420px){.cstr-list{grid-template-columns:1fr}}
.cstr-list button{display:flex;gap:8px;align-items:center;width:100%;text-align:left;font:inherit;font-size:13px;line-height:1.3;color:var(--anatomy-text);background:transparent;border:1px solid transparent;border-radius:4px;padding:3px 6px 3px 3px;cursor:pointer}
.cstr-list .cstr-num{background:var(--anatomy-card);color:var(--anatomy-strong);box-shadow:0 0 0 1px var(--anatomy-mid)}
.cstr-list button:hover,.cstr-list button.on{background:var(--anatomy-card);border-color:var(--anatomy-mid)}
.cstr-list button.on .cstr-num{background:var(--cstr-series);color:#fff;box-shadow:none}
.cstr-list button[aria-pressed="true"]{border-color:var(--anatomy-strong)}
.cstr-list button[aria-pressed="true"] .cstr-num{background:var(--anatomy-strong);color:var(--anatomy-page);box-shadow:none}
.cstr-list button:focus-visible{outline:2px solid var(--cstr-series);outline-offset:1px}
.cstr-run,.cstr-space{margin:22px 0 0;padding:18px;box-shadow:0 0 0 1px var(--anatomy-mid);background:var(--anatomy-card);font-size:13px;color:var(--anatomy-text)}
.cstr-run h2,.cstr-space h2{margin:0 0 4px;font-size:17px;font-weight:600;color:var(--anatomy-strong)}
.cstr-run h3{margin:16px 0 6px;font-size:14px;font-weight:600;color:var(--anatomy-strong)}
.cstr-run h3:first-child{margin-top:0}
.cstr-run-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:22px}
@media (min-width:1100px){.cstr-run-grid{grid-template-columns:minmax(0,1fr) 380px}}
.cstr-run-side .cstr-ctl{margin:0 0 8px}
.cstr-readline{margin:4px 0 6px;min-height:2.9em;font:500 13px/1.45 var(--anatomy-mono,ui-monospace,monospace);color:var(--anatomy-text);font-variant-numeric:tabular-nums}
.cstr-plot .series.s1{stroke:var(--cstr-series)}
.cstr-plot .series.s2{stroke:var(--cstr-series-2)}
.cstr-plot .series.ref,.cstr-plot .ref{fill:none;stroke:var(--anatomy-muted);stroke-width:1.5;stroke-dasharray:5 4}
.cstr-plot .cross-dot.s2{stroke:var(--cstr-series-2)}
.cstr-plot .cross-dot.ref{stroke:var(--anatomy-muted)}
.cstr-plot .bar{fill:var(--cstr-series)}
.cstr-plot .bar.on{fill:var(--cstr-series-2)}
.cstr-plot .event{stroke:var(--anatomy-strong);stroke-width:1;stroke-dasharray:2 3;opacity:.6}
.cstr-plot .event-label{fill:var(--anatomy-strong);font-weight:600}
.cstr-key[data-series="s2"]::before{border-color:var(--cstr-series-2)}
.cstr-key[data-series="ref"]::before{border-top:2px dashed var(--anatomy-muted)}
.cstr-log{margin-top:10px}
.cstr-log summary,.cstr-chart details summary{cursor:pointer;color:var(--anatomy-text)}
.cstr-tablewrap{max-height:340px;overflow:auto;margin-top:6px}
.cstr-tablewrap table{border-collapse:collapse;font-variant-numeric:tabular-nums;width:100%}
.cstr-tablewrap th,.cstr-tablewrap td{padding:3px 10px 3px 0;text-align:right;border-bottom:1px solid var(--cstr-grid);white-space:nowrap}
.cstr-tablewrap th{font-weight:500;color:var(--anatomy-muted);position:sticky;top:0;background:var(--anatomy-card)}
.cstr-dl{margin-top:10px}
.cstr-exps{margin:0 0 10px}
.cstr-exp-card{padding:10px 12px;margin:0 0 6px;background:var(--anatomy-page);box-shadow:0 0 0 1px var(--anatomy-mid);border-left:3px solid var(--cstr-series)}
.cstr-exp-card h4{margin:0 0 4px;font-size:14px;color:var(--anatomy-strong)}
.cstr-exp-card p{margin:0 0 6px}
.cstr-exp-card ol{margin:0 0 6px;padding-left:18px;font-family:var(--anatomy-mono,ui-monospace,monospace)}
.cstr-exp-card b{color:var(--anatomy-strong);font-weight:600}
.cstr-sum{margin:10px 0 0}
.cstr-events{margin:0;padding-left:22px;max-height:220px;overflow:auto}
.cstr-events li{margin:0 0 3px}
.cstr-ev-t{font-family:var(--anatomy-mono,ui-monospace,monospace);color:var(--anatomy-muted)}
.cstr-space-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:24px}
@media (min-width:1100px){.cstr-space-grid{grid-template-columns:1fr 1fr}}
.cstr-inline{flex-direction:row;align-items:center;gap:8px;margin:0 0 6px}
.cstr-plot .map-edge{fill:none;stroke:var(--cstr-critical);stroke-width:2}
.cstr-plot .map-olr{stroke:var(--anatomy-strong);stroke-width:1.5;stroke-dasharray:5 4}
.cstr-plot .map-label{fill:var(--anatomy-strong);font-weight:600;paint-order:stroke;stroke:var(--cstr-surface);stroke-width:3px;stroke-linejoin:round}
.cstr-plot .map-now{fill:none;stroke:var(--cstr-series-2);stroke-width:3}
.cstr-plot .map-hover{fill:none;stroke:var(--anatomy-strong);stroke-width:2}
.cstr-plot[data-map] svg{cursor:crosshair}
.cstr-ramp{display:flex;align-items:center;gap:8px;margin:6px 0 0;font-variant-numeric:tabular-nums}
.cstr-ramp i{flex:1;max-width:260px;height:10px;background:linear-gradient(90deg,#eef4fb,#c4daf3,#8fbbe9,#5596dd,#2a78d6,#1b5aa8,#103d75)}
.cstr-panel{grid-template-columns:1fr!important}
@media (min-width:860px){.cstr-panel{grid-template-columns:minmax(260px,340px) 1fr!important}}
`;

const views = (name, fig, mod) => {
  const tps = topics(name);
  const badges = `<svg class="cstr-leaders" aria-hidden="true"></svg><div class="cstr-badges">${tps.map((tp, i) => `<button type="button" data-chip="${tp.key}" aria-pressed="false" tabindex="-1" aria-label="${i + 1}. ${esc(tp.name)}" title="${esc(tp.name)}">${i + 1}</button>`).join("")}</div>`;
  const plateHtml = k.plateHtml({
    fig, title: mod.text.title, hint: t("hint"), readout: "", keys: mod.text.keys, caption: mod.text.caption,
    body: `<div class="iso-stage" tabindex="0" role="group" aria-label="${esc(mod.text.title)}">${mod.svg}${badges}</div>`,
  });
  const side = `<aside class="cstr-side" aria-label="${esc(U.partsTitle)}"><div class="cstr-side-head"><h2>${esc(U.partsTitle)}</h2><label><input type="checkbox" data-numbers checked> ${esc(U.numbers)}</label></div><div class="cstr-card" data-card aria-live="polite"></div><ol class="cstr-list">${tps.map((tp, i) => `<li><button type="button" data-chip="${tp.key}" aria-pressed="false"><span class="cstr-num">${i + 1}</span>${esc(tp.name)}</button></li>`).join("")}</ol></aside>`;
  return `<section class="cstr-view" id="cstr-view-${name}" role="tabpanel" aria-labelledby="cstr-tab-${name}" data-fig="${name}"${name === "farm" ? " hidden" : ""}><div class="cstr-figcol">${plateHtml}</div>${side}</section>`;
};
const tabs = `<div class="cstr-tabs" role="tablist" aria-label="${esc(U.tabsLabel)}">${[["lab", U.lab, U.tabLabSub], ["farm", U.farm, U.tabFarmSub]].map(([name, label, sub], i) => `<button type="button" role="tab" id="cstr-tab-${name}" data-tab="${name}" aria-controls="cstr-view-${name}" aria-selected="${!i}"${i ? ' tabindex="-1"' : ""}>${esc(label)}<small>${esc(sub)}</small></button>`).join("")}</div>`;
const top = `<nav class="cstr-top"><a href="https://github.com/aikiesan/simulador_CSTR">Código no GitHub</a></nav>`;
const head = `<header class="cstr-head"><h1>${esc(t("title"))}</h1><p>${esc(t("lede"))}</p></header>`;
const body = top + head + tabs + views("lab", "Fig 1", lab) + views("farm", "Fig 2", farm) + panel + run + space + `<p class="cstr-model">${esc(t("model"))}</p>`;
const page = k.pageHtml({ title: t("title"), theme, body, script: kitScript() + live, width: 1480 })
  .replace("</style>", `${CSS}</style>`)
  .replace('<html lang="en">', '<html lang="pt-BR">')
  .replace("margin:64px auto 96px", "margin:28px auto 80px");
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), page);
console.log("wrote", join("site", "index.html"), `${(page.length / 1024).toFixed(0)} KB`, `farm ${farm.R.items.length} items`, `lab ${lab.R.items.length} items`);
if (process.argv.includes("--audit")) {
  console.log("── audit: bancada ──");
  A.auditOrExit(lab.R, lab.P);
  console.log("── audit: fazenda ──");
  A.auditOrExit(farm.R, farm.P);
}
