// The parts a reader can point at in each figure: which drawn items belong to which part, and what each part is for.
// Every drawn item is wrapped in <g data-topic="…">; the page highlights a part and opens its card with live values.
import { L } from "./kit.mjs";

// [topic, item-name prefixes]: the first prefix that matches an item's name wins; items that match none are scenery.
const PREFIXES = {
  farm: [
    ["flare", ["gas.flare", "flare"]],
    ["tank", ["tank", "ladder"]],
    ["heat", ["heat"]],
    ["feed", ["feed"]],
    ["gas", ["gas"]],
    ["chp", ["chp"]],
    ["digestate", ["digestate"]],
  ],
  lab: [
    ["bag", ["gas.bag", "bag"]],
    ["meter", ["gas.tube", "meter"]],
    ["vessel", ["vessel"]],
    ["jacket", ["jacket"]],
    ["circ", ["circ", "hose"]],
    ["stirrer", ["stirrer", "stand.base", "stand.socket", "stand.rod", "stand.boss", "stand.arm"]],
    ["lid", ["lid", "probe"]],
    ["feed", ["pump", "feed", "feedstir"]],
    ["effluent", ["effluent"]],
  ],
};

export function topicFor(fig, name) {
  for (const [topic, prefixes] of PREFIXES[fig]) {
    if (prefixes.some((p) => name === p || name.startsWith(p + ".") || name.startsWith(p + ":") || name.startsWith(p + "#") || name.startsWith(p + "-"))) return topic;
  }
  return null;
}

// Each drawn item in its part's group; the stand plate and other scenery stay outside every part.
export const wrapItems = (fig, items) => items.map((item) => {
  const topic = topicFor(fig, item.name);
  return topic ? `<g class="ci" data-topic="${topic}">${item.svg}</g>` : item.svg;
});

// What each part is and does, and what changes with scale. Values that move are added live by the page.
const T = {
  farm: {
    tank: [
      "Digester tank", "Tanque do digestor",
      "A round concrete tank, 12 m across inside, holds the slurry 4.6 m deep: 520 m³. Insulation and cladding outside the wall keep the heat in. The overflow fixes the level, so each cubic metre fed pushes a cubic metre out.",
      "Um tanque redondo de concreto, com 12 m de diâmetro interno, guarda o chorume a 4,6 m de profundidade: 520 m³. Isolamento e revestimento por fora da parede seguram o calor. O extravasor fixa o nível, então cada metro cúbico que entra empurra um metro cúbico para fora.",
      "Each m³ of slurry here has 0.55 m² of wall and floor around it; in the 5 L glass it is about 27 m². Fifty times less surface per volume is why the farm tank holds its temperature for days.",
      "Aqui cada m³ de chorume tem 0,55 m² de parede e piso em volta; no vidro de 5 L são cerca de 27 m². Cinquenta vezes menos superfície por volume: é por isso que o tanque da fazenda segura a temperatura por dias.",
    ],
    slurry: [
      "Slurry", "Chorume",
      "Dairy manure diluted with wash water to the feed solids. Microbes break its volatile solids down in steps (hydrolysis, acids, then methane), and only the last step is in this model. Left unmixed it separates: scum floats up and grit settles, as the cut faces show.",
      "Esterco leiteiro diluído com água de lavagem até o teor de sólidos da alimentação. Microrganismos degradam os sólidos voláteis em etapas (hidrólise, ácidos e, por fim, metano); só a última etapa está neste modelo. Sem mistura ele se separa: a crosta sobe e a areia assenta, como mostram as faces do corte.",
      "The kinetics know no size: at the same HRT, temperature and feed, both scales reach the same share of B₀ and make the same methane per m³ of reactor.",
      "A cinética não conhece tamanho: no mesmo TRH, temperatura e alimentação, as duas escalas atingem a mesma fração do B₀ e produzem o mesmo metano por m³ de reator.",
    ],
    mixer: [
      "Propeller mixer", "Agitador de hélice",
      "A submersible propeller mixer on a guide mast, which lets it be raised and turned from outside. In auto it runs 15 minutes each hour. It keeps solids suspended, breaks the scum and spreads heat and fresh feed through the tank.",
      "Um agitador submersível de hélice numa haste-guia, que permite erguê-lo e girá-lo por fora. No automático roda 15 minutos por hora. Mantém os sólidos em suspensão, quebra a crosta e espalha o calor e a alimentação fresca pelo tanque.",
      "A propeller cannot reach every corner of 520 m³: real tanks keep dead zones and short-circuit paths. At 5 L an overhead impeller comes close to the ideal of a completely mixed reactor that the model assumes.",
      "Uma hélice não alcança todos os cantos de 520 m³: tanques reais têm zonas mortas e caminhos preferenciais. Em 5 L, um impelidor de haste chega perto do ideal de mistura completa que o modelo supõe.",
    ],
    heat: [
      "Heating loops", "Serpentinas de aquecimento",
      "Hot water piped from the engine container runs through stainless loops on the inside of the wall. A thermostat switches it on below the set point and off above it.",
      "Água quente vinda do contêiner do motor passa por serpentinas de inox na face interna da parede. Um termostato liga abaixo da temperatura ajustada e desliga acima.",
      "The tank loses heat slowly and gains it slowly: a change of set point takes days to arrive, and a heating failure takes days to hurt. Try it with “heating fails”.",
      "O tanque perde e ganha calor devagar: uma nova temperatura leva dias para chegar, e uma falha de aquecimento leva dias para fazer estrago. Teste com “falha no aquecimento”.",
    ],
    roof: [
      "Double-membrane gas roof", "Cobertura de dupla membrana",
      "The inner membrane is the gas store: it rises as biogas collects and falls as the engine draws it. The outer membrane is held taut by air and keeps out wind and weather. The central mast carries the inner membrane when the store is empty.",
      "A membrana interna é o gasômetro: sobe quando o biogás se acumula e desce quando o motor o consome. A externa é mantida esticada por ar e protege do vento e do tempo. A haste central sustenta a membrana interna quando o estoque está vazio.",
      "The bench reactor has no store of its own: its gas goes through the meter into a bag.",
      "O reator de bancada não tem estoque próprio: seu gás passa pelo medidor e vai para uma bolsa.",
    ],
    feed: [
      "Feed pit and pump", "Poço e bomba de alimentação",
      "An agitator keeps the manure in the pit stirred; an eccentric-screw pump pushes it into the tank eight times a day. Feeding little and often keeps the load steady for the microbes.",
      "Um agitador mantém o esterco do poço misturado; uma bomba helicoidal o empurra para o tanque oito vezes por dia. Alimentar pouco e com frequência mantém a carga estável para os microrganismos.",
      "The bench is fed by a peristaltic pump at 2 mL/min: the same daily share of its volume, through a tube a few millimetres wide.",
      "A bancada é alimentada por uma bomba peristáltica a 2 mL/min: a mesma fração diária do volume, por um tubo de poucos milímetros.",
    ],
    gas: [
      "Gas line", "Linha de gás",
      "Biogas leaves the roof, passes a condensate trap (it is saturated with water that condenses as it cools) and a water seal that guards against over- and under-pressure, and goes on to the engine.",
      "O biogás sai da cobertura, passa por um purgador de condensado (sai saturado de água, que condensa ao esfriar) e por um selo hídrico que protege contra sobre e subpressão, e segue para o motor.",
      "At the bench the same gas runs through a few millimetres of tube into a drum meter that counts every 100 mL.",
      "Na bancada o mesmo gás passa por poucos milímetros de tubo até um medidor de tambor que conta cada 100 mL.",
    ],
    chp: [
      "Engine (CHP)", "Motor (cogeração)",
      "A 50 kWe gas engine with a generator in a container: power to the grid, heat back to the tank. It starts when the store is 70 % full and stops at 30 %, so it runs in blocks.",
      "Um motor a gás de 50 kWe com gerador num contêiner: energia para a rede, calor de volta para o tanque. Liga quando o gasômetro chega a 70 % e desliga em 30 %, então funciona em blocos.",
      "The bench reactor's gas would run a few watts: it is measured and analysed, never burned.",
      "O gás da bancada daria poucos watts: ele é medido e analisado, nunca queimado.",
    ],
    flare: [
      "Flare", "Flare",
      "When the store is full and the engine cannot take the gas, the flare burns it, so methane, a strong greenhouse gas, is never vented.",
      "Quando o gasômetro está cheio e o motor não dá conta, o flare queima o gás, para que o metano, um gás de efeito estufa forte, nunca seja liberado.",
      "Raise the temperature or the feed until the engine cannot keep up, and the flare lights.",
      "Aumente a temperatura ou a alimentação até o motor não dar conta, e o flare acende.",
    ],
    digestate: [
      "Overflow and digestate pit", "Extravasor e caixa de digestato",
      "Each feed lifts the level and the overflow lets the same volume out to a covered pit. The digestate keeps the nutrients of the manure and goes back to the fields as fertiliser.",
      "Cada alimentação eleva o nível e o extravasor deixa sair o mesmo volume para uma caixa coberta. O digestato mantém os nutrientes do esterco e volta para a lavoura como fertilizante.",
      "At the bench, a side arm lets the effluent drip into a bottle, which is sampled for solids, pH and acids.",
      "Na bancada, um braço lateral deixa o efluente pingar numa garrafa, que é amostrada para sólidos, pH e ácidos.",
    ],
  },
  lab: {
    vessel: [
      "Jacketed glass vessel", "Reator de vidro encamisado",
      "Borosilicate glass, 180 mm across inside, with the liquid 196.5 mm deep: 5.0 L. A flanged lid is clamped and sealed so no air gets in and no gas gets out.",
      "Vidro borossilicato, 180 mm de diâmetro interno, com o líquido a 196,5 mm de profundidade: 5,0 L. Uma tampa flangeada é presa e vedada para que não entre ar nem saia gás.",
      "The glass is the point: you can see foaming, scum and settling that the farm tank hides.",
      "O vidro é o ponto: dá para ver espuma, crosta e sedimentação que o tanque da fazenda esconde.",
    ],
    slurry: [
      "Reactor liquid", "Líquido do reator",
      "Inoculum from a running digester, fed with the same manure at the same solids. The bench runs the same kinetics as the farm tank.",
      "Inóculo de um digestor em operação, alimentado com o mesmo esterco e os mesmos sólidos. A bancada roda a mesma cinética do tanque da fazenda.",
      "Same HRT, temperature and feed: same share of B₀ and same methane per m³ of reactor as the farm tank.",
      "Mesmo TRH, temperatura e alimentação: mesma fração do B₀ e mesmo metano por m³ de reator que o tanque da fazenda.",
    ],
    jacket: [
      "Water jacket", "Camisa d’água",
      "Warm water flows between two glass walls, all around the liquid, so the reactor heats evenly from every side.",
      "Água morna circula entre duas paredes de vidro, em volta de todo o líquido, e o reator aquece por igual de todos os lados.",
      "5 L warms and cools in an hour or two, where the farm tank takes days. Try “heating fails” and compare the two temperature traces.",
      "5 L aquece e esfria em uma ou duas horas; o tanque da fazenda leva dias. Teste “falha no aquecimento” e compare as duas curvas de temperatura.",
    ],
    circ: [
      "Heating circulator", "Banho termostatizado",
      "A water bath with a heater, a pump and a thermostat. It pumps water through the jacket and back; its display shows the temperature.",
      "Um banho com resistência, bomba e termostato. Bombeia água pela camisa e de volta; o visor mostra a temperatura.",
      "It switches on and off many times an hour; the farm heating cycles over days.",
      "Liga e desliga várias vezes por hora; o aquecimento da fazenda cicla ao longo de dias.",
    ],
    stirrer: [
      "Overhead stirrer", "Agitador de haste",
      "A motor on a stand turns a shaft through a gas-tight gland in the lid, down to a four-blade impeller pitched at 45°. In auto it runs 15 minutes each hour, like the farm mixer.",
      "Um motor num suporte gira uma haste que atravessa um selo estanque na tampa até um impelidor de quatro pás inclinadas a 45°. No automático roda 15 minutos por hora, como o agitador da fazenda.",
      "In 5 L the impeller reaches the whole volume; that is the ideal of a completely mixed reactor that the model assumes.",
      "Em 5 L o impelidor alcança todo o volume: é o ideal de mistura completa que o modelo supõe.",
    ],
    lid: [
      "Lid and ports", "Tampa e portas",
      "Four ports through the lid: feed in, a temperature probe that tells the circulator what to do, gas out, and a sampling port with a septum cap for a syringe.",
      "Quatro portas na tampa: entrada da alimentação, uma sonda de temperatura que comanda o banho, saída de gás e uma porta de amostragem com septo para seringa.",
      "Sampling a few millilitres is trivial here; at the farm, samples come from a valve on the wall.",
      "Amostrar alguns mililitros é trivial aqui; na fazenda, as amostras saem de uma válvula na parede.",
    ],
    feed: [
      "Peristaltic feed pump", "Bomba peristáltica",
      "Rollers squeeze a tube, so the feed never touches the pump. On a timer it pumps at 2 mL/min four times a day from a bottle kept stirred on a magnetic stirrer. Its display counts down to the next feed.",
      "Roletes apertam um tubo, então a alimentação nunca toca a bomba. Num temporizador, bombeia 2 mL/min quatro vezes por dia, de uma garrafa mantida agitada num agitador magnético. O visor conta o tempo até a próxima alimentação.",
      "The farm pumps cubic metres eight times a day; the share of the volume fed each day is the same.",
      "A fazenda bombeia metros cúbicos oito vezes por dia; a fração do volume alimentada por dia é a mesma.",
    ],
    effluent: [
      "Overflow and effluent bottle", "Extravasor e garrafa de efluente",
      "A side arm at the liquid level lets out what each feed pushes in. The bottle is emptied for analysis: solids, pH, volatile acids.",
      "Um braço lateral no nível do líquido deixa sair o que cada alimentação empurra para dentro. A garrafa é esvaziada para análise: sólidos, pH, ácidos voláteis.",
      "The same overflow principle as the farm tank, at the scale of drops.",
      "O mesmo princípio de extravasor do tanque da fazenda, na escala de gotas.",
    ],
    meter: [
      "Drum gas meter", "Medidor de gás de tambor",
      "Gas turns a drum: each turn of the needle is 100 mL, and the counter adds them up. At the bench gas is counted, not estimated.",
      "O gás gira um tambor: cada volta do ponteiro são 100 mL, e o contador soma. Na bancada o gás é contado, não estimado.",
      "Biogas at the bench is a few litres a day; the farm makes hundreds of cubic metres. The same methane per m³ of reactor.",
      "Na bancada são poucos litros de biogás por dia; a fazenda faz centenas de metros cúbicos. O mesmo metano por m³ de reator.",
    ],
    bag: [
      "Gas sampling bag", "Bolsa de amostragem de gás",
      "Collects the counted gas for composition analysis (methane, CO₂, H₂S). When it is full it is taken away and emptied; “empty the gas bag” does it now.",
      "Coleta o gás medido para análise de composição (metano, CO₂, H₂S). Quando enche, é retirada e esvaziada; “esvaziar a bolsa de gás” faz isso agora.",
      "The farm stores gas under its roof to feed an engine; the bench only keeps it to analyse it.",
      "A fazenda armazena gás sob a cobertura para alimentar o motor; a bancada só o guarda para analisar.",
    ],
  },
};

export const topics = (fig) => Object.entries(T[fig]).map(([key, v]) => ({ key, name: v[L], what: v[2 + L], scale: v[4 + L] }));
