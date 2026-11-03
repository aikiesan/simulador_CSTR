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
    ["gastube", ["gas.tube"]],
    ["meter", ["meter"]],
    ["vessel", ["vessel"]],
    ["jacket", ["jacket"]],
    ["circ", ["circ"]],
    ["hoses", ["hose"]],
    ["impeller", ["stirrer.shaft"]],
    ["motor", ["stirrer"]],
    ["stand", ["stand.base", "stand.socket", "stand.rod", "stand.boss", "stand.arm"]],
    ["probe", ["probe", "lid.probe"]],
    ["feedport", ["lid.feed"]],
    ["gasport", ["lid.gas"]],
    ["sample", ["lid.sample"]],
    ["pump", ["pump"]],
    ["tubing", ["feed.suck", "feed.in"]],
    ["feedbottle", ["feed.bottle", "feed.cap"]],
    ["magstir", ["feedstir"]],
    ["overflow", ["effluent.arm", "effluent.drop"]],
    ["effbottle", ["effluent.bottle", "effluent.cap"]],
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
  // The bench reactor, part by part, in the order a reader would follow it: the vessel, how it is mixed and heated,
  // how feed goes in and effluent out, and how the gas is measured. Sizes are as drawn: a typical 5 L set-up, not a product.
  lab: {
    vessel: [
      "Glass vessel", "Vaso de vidro",
      "The reactor itself: a borosilicate glass cylinder, flanged at the top. The liquid is held at a fixed depth by the overflow arm, so its volume never changes; the space above it is the headspace where the gas collects before it leaves.",
      "O reator em si: um cilindro de vidro borossilicato, flangeado no topo. O líquido fica numa profundidade fixa, mantida pelo braço de extravasamento, então o volume nunca muda; o espaço acima é o headspace, onde o gás se junta antes de sair.",
      "Through the glass you see what a steel tank hides: foam, a floating scum when the stirrer stops, sediment at the bottom.",
      "Pelo vidro se vê o que um tanque de aço esconde: espuma, crosta flutuando quando o agitador para, sedimento no fundo.",
      [["Inside diameter", "Diâmetro interno", "180 mm", "180 mm"], ["Liquid depth", "Profundidade do líquido", "196.5 mm", "196,5 mm"], ["Working volume", "Volume útil", "5.0 L", "5,0 L"], ["Headspace", "Headspace", "≈ 2.2 L", "≈ 2,2 L"], ["Glass wall", "Parede de vidro", "4 mm", "4 mm"]],
    ],
    jacket: [
      "Water jacket", "Camisa d’água",
      "A second glass wall around the first, with warm water flowing in the gap. The water enters at the bottom and leaves at the top, so no air is trapped, and the whole wetted wall heats the liquid evenly.",
      "Uma segunda parede de vidro em volta da primeira, com água morna circulando no vão. A água entra por baixo e sai por cima, para não prender ar, e toda a parede molhada aquece o líquido por igual.",
      "The section turns warm-coloured while the circulator heats. With “heating fails” the liquid cools in hours.",
      "O corte fica alaranjado enquanto o banho aquece. Com “falha no aquecimento” o líquido esfria em horas.",
      [["Water gap", "Vão de água", "14 mm", "14 mm"], ["Outside diameter", "Diâmetro externo", "224 mm", "224 mm"], ["Flow", "Fluxo", "in low, out high", "entra embaixo, sai em cima"]],
    ],
    slurry: [
      "Reactor liquid", "Líquido do reator",
      "Inoculum from a running digester, fed with diluted dairy manure. Two things in it decide everything: the degradable solids still left (S) and the active microbes that eat them (b). Both are drawn on the run charts below.",
      "Inóculo de um digestor em operação, alimentado com esterco leiteiro diluído. Duas coisas nele decidem tudo: os sólidos degradáveis que restam (S) e os microrganismos ativos que os consomem (b). As duas aparecem nos gráficos da corrida, abaixo.",
      "The colour follows S: dark while much VS is left (at start-up, in a washout), light when the reactor digests well; the feed bottle shows raw manure, the effluent bottle the reactor liquid. When the gas comes much faster than at the design point (short HRT, overload), foam rises. Start a run from little inoculum to watch b grow and the liquid clear.",
      "A cor segue S: escura quando há muito SV por degradar (na partida, numa lavagem), clara quando o reator digere bem; a garrafa de alimentação mostra o esterco cru, a de efluente o líquido do reator. Quando o gás vem bem mais rápido que no ponto de projeto (TRH curto, sobrecarga), sobe espuma. Comece uma corrida com pouco inóculo para ver b crescer e o líquido clarear.",
      [["Volume", "Volume", "5.0 L", "5,0 L"], ["Feed solids", "Sólidos na alimentação", "set in the panel", "ajustados no painel"]],
    ],
    impeller: [
      "Shaft and impeller", "Haste e impelidor",
      "A stainless shaft carries a four-blade impeller, pitched at 45° so it pushes liquid down and around. It sits about a third of the way up the liquid, where it lifts settled solids and pulls down the scum.",
      "Uma haste de inox leva um impelidor de quatro pás, inclinadas a 45° para empurrar o líquido para baixo e em volta. Fica a cerca de um terço da altura do líquido, onde levanta o sedimento e puxa a crosta para baixo.",
      "The blades turn in the open wedge only while the stirrer runs; scum and sediment fade as it mixes.",
      "As pás giram na fatia aberta só quando o agitador funciona; crosta e sedimento somem com a mistura.",
      [["Impeller diameter", "Diâmetro do impelidor", "78 mm (0.43 of the vessel)", "78 mm (0,43 do vaso)"], ["Height above the floor", "Altura acima do fundo", "54 mm", "54 mm"], ["Blades", "Pás", "4, at 45°", "4, a 45°"], ["Shaft", "Haste", "6 mm", "6 mm"]],
    ],
    lid: [
      "Lid, flange and clamp", "Tampa, flange e braçadeira",
      "A flat stainless lid on the glass flange, sealed with a gasket and held by a ring clamp. Everything that enters or leaves the reactor, except the effluent, goes through it, and a centre seal lets the shaft turn without letting gas out.",
      "Uma tampa plana de inox sobre o flange de vidro, vedada com junta e presa por uma braçadeira. Tudo o que entra ou sai do reator, menos o efluente, passa por ela, e um selo central deixa a haste girar sem deixar o gás escapar.",
      "A leak here is the commonest bench failure: gas escapes, the meter counts less, and air gets in.",
      "Um vazamento aqui é a falha mais comum na bancada: o gás escapa, o medidor conta menos e entra ar.",
      [["Flange diameter", "Diâmetro do flange", "252 mm", "252 mm"], ["Lid thickness", "Espessura da tampa", "10.5 mm", "10,5 mm"], ["Ports", "Portas", "4 + shaft seal", "4 + selo da haste"]],
    ],
    feedport: [
      "Feed port", "Porta de alimentação",
      "Where the feed tube enters the lid. Each pulse of the pump drops fresh manure into the liquid.",
      "Onde o tubo de alimentação entra na tampa. Cada pulso da bomba despeja esterco fresco no líquido.",
      "Its tube shows dashes while the pump runs.",
      "O tubo mostra tracejado enquanto a bomba funciona.",
      [["Neck", "Gargalo", "19 mm", "19 mm"]],
    ],
    probe: [
      "Temperature probe", "Sonda de temperatura",
      "A sensor in a thin sheath dipping into the liquid. It reports the liquid's temperature to the circulator, which heats until it reads the set point.",
      "Um sensor numa bainha fina mergulhada no líquido. Informa a temperatura do líquido ao banho, que aquece até ler a temperatura ajustada.",
      "Its reading is the temperature on the circulator's display and on the run chart.",
      "A leitura dela é a temperatura do visor do banho e do gráfico da corrida.",
      [["Sheath", "Bainha", "6 mm", "6 mm"], ["Control band", "Faixa de controle", "± 0.1 °C", "± 0,1 °C"]],
    ],
    gasport: [
      "Gas outlet", "Saída de gás",
      "The only way out for the gas: from the headspace, through the lid, to the gas meter.",
      "A única saída do gás: do headspace, pela tampa, até o medidor de gás.",
      "Its tube shows dashes whenever gas is flowing.",
      "O tubo mostra tracejado sempre que há gás passando.",
      [["Neck", "Gargalo", "19 mm", "19 mm"]],
    ],
    sample: [
      "Sampling port", "Porta de amostragem",
      "A port closed by a rubber septum: a syringe takes a few millilitres of liquid without letting air in. Samples are analysed for pH, volatile acids, solids and ammonia.",
      "Uma porta fechada por um septo de borracha: uma seringa retira alguns mililitros de líquido sem deixar entrar ar. As amostras vão para análise de pH, ácidos voláteis, sólidos e amônia.",
      "The model's residual solids (S) are what a solids analysis of a sample would track.",
      "Os sólidos residuais do modelo (S) são o que a análise de sólidos de uma amostra acompanharia.",
      [["Neck", "Gargalo", "14 mm", "14 mm"], ["Closure", "Fechamento", "septum cap", "tampa com septo"]],
    ],
    motor: [
      "Stirrer motor", "Motor do agitador",
      "An overhead motor with a chuck that grips the shaft. A knob sets the speed; a timer runs it 15 minutes each hour, like the farm mixer.",
      "Um motor de haste com mandril que prende a haste. Um botão ajusta a velocidade; um temporizador o faz rodar 15 minutos por hora, como o agitador da fazenda.",
      "Switch the mixers off in the panel: the scum and sediment build up on the cut faces.",
      "Desligue os agitadores no painel: crosta e sedimento se formam nas faces do corte.",
      [["Body", "Corpo", "51 mm × 114 mm", "51 mm × 114 mm"], ["Duty", "Regime", "15 min each hour (auto)", "15 min por hora (auto)"]],
    ],
    stand: [
      "Lab stand", "Suporte de laboratório",
      "A heavy base, a vertical rod and a boss clamp with an arm: it holds the motor exactly above the vessel so the shaft runs straight through the seal.",
      "Uma base pesada, uma haste vertical e uma mufa com braço: segura o motor exatamente sobre o vaso, para que a haste passe reta pelo selo.",
      "If the shaft is not centred, the seal wears and starts to leak.",
      "Se a haste não estiver centrada, o selo se desgasta e começa a vazar.",
      [["Rod", "Haste", "11 mm × 600 mm", "11 mm × 600 mm"], ["Base", "Base", "102 × 72 mm", "102 × 72 mm"]],
    ],
    circ: [
      "Heating circulator", "Banho termostatizado",
      "A water bath with a heater, a pump and a controller. It pumps warm water through the jacket and back, switching the heater on and off to hold the probe at the set point. Its display shows the temperature.",
      "Um banho com resistência, bomba e controlador. Bombeia água morna pela camisa e de volta, ligando e desligando a resistência para manter a sonda na temperatura ajustada. O visor mostra a temperatura.",
      "Its lamp shows when it heats: it cycles many times an hour, where the farm's heating cycles over days.",
      "A lâmpada mostra quando aquece: cicla várias vezes por hora, enquanto o aquecimento da fazenda cicla ao longo de dias.",
      [["Footprint", "Base", "138 × 120 mm", "138 × 120 mm"], ["Height", "Altura", "168 mm", "168 mm"]],
    ],
    hoses: [
      "Jacket hoses", "Mangueiras da camisa",
      "Two hoses on barbed fittings: flow from the circulator to the bottom of the jacket, return from the top of the jacket back to the bath.",
      "Duas mangueiras em conexões de espiga: ida do banho até o fundo da camisa, volta do alto da camisa até o banho.",
      "The water circulates all the time; only the heater switches.",
      "A água circula o tempo todo; só a resistência liga e desliga.",
      [["Outside diameter", "Diâmetro externo", "10 mm", "10 mm"]],
    ],
    pump: [
      "Peristaltic pump", "Bomba peristáltica",
      "Three rollers squeeze a soft tube against the pump head, pushing a fixed volume per turn. The feed never touches the pump, and nothing flows back when it stops. A timer runs it four times a day; its display counts down to the next feed.",
      "Três roletes apertam um tubo macio contra o cabeçote, empurrando um volume fixo por volta. A alimentação nunca toca a bomba, e nada volta quando ela para. Um temporizador a liga quatro vezes por dia; o visor conta o tempo até a próxima alimentação.",
      "The rotor turns while it pumps. Each pulse lasts minutes; “overfeed for a day” doubles them.",
      "O rotor gira enquanto bombeia. Cada pulso dura minutos; “sobrecarga por um dia” os dobra.",
      [["Rate", "Vazão", "2 mL/min", "2 mL/min"], ["Pulses", "Pulsos", "4 a day", "4 por dia"], ["Head", "Cabeçote", "38 mm, 3 rollers", "38 mm, 3 roletes"]],
    ],
    tubing: [
      "Feed tubing", "Tubos de alimentação",
      "Thin tubing from the feed bottle through the pump head and up into the feed port.",
      "Tubo fino da garrafa de alimentação, pelo cabeçote da bomba, até a porta de alimentação.",
      "Manure solids can clog it: one reason bench feeds are diluted or sieved.",
      "Os sólidos do esterco podem entupi-lo: um dos motivos para diluir ou peneirar a alimentação na bancada.",
      [["Outside diameter", "Diâmetro externo", "5 mm", "5 mm"]],
    ],
    feedbottle: [
      "Feed bottle", "Garrafa de alimentação",
      "Holds the next days of feed. It is refilled before it runs dry; in real work it is kept cold so the feed does not start digesting in the bottle.",
      "Guarda os próximos dias de alimentação. É reabastecida antes de esvaziar; na prática fica refrigerada para a alimentação não começar a digerir na garrafa.",
      "Its level falls with every feed and jumps when it is refilled.",
      "O nível cai a cada alimentação e sobe quando é reabastecida.",
      [["Diameter", "Diâmetro", "75 mm", "75 mm"], ["Refilled to", "Reabastecida até", "360 mL", "360 mL"]],
    ],
    magstir: [
      "Magnetic stirrer", "Agitador magnético",
      "A stir bar spun by a magnet under the bottle keeps the manure solids in suspension, so every pulse delivers the same feed.",
      "Uma barra magnética girada por um ímã sob a garrafa mantém os sólidos do esterco em suspensão, para cada pulso entregar a mesma alimentação.",
      "Without it the solids settle and the reactor gets dilute feed first, then a thick one.",
      "Sem ele os sólidos assentam e o reator recebe primeiro alimentação diluída, depois grossa.",
      [["Footprint", "Base", "96 × 90 mm", "96 × 90 mm"]],
    ],
    overflow: [
      "Overflow side arm", "Braço de extravasamento",
      "A glass arm at the liquid level: whatever a feed adds above that level runs out. It fixes the volume, and so the retention time.",
      "Um braço de vidro na altura do líquido: o que uma alimentação acrescenta acima desse nível escorre para fora. Ele fixa o volume e, com isso, o tempo de retenção.",
      "It drips only during and just after a feed: the same volume out as in.",
      "Pinga só durante e logo depois de uma alimentação: sai o mesmo volume que entra.",
      [["Bore", "Diâmetro", "9 mm", "9 mm"], ["Height", "Altura", "at the liquid level", "no nível do líquido"]],
    ],
    effbottle: [
      "Effluent bottle", "Garrafa de efluente",
      "Collects the effluent (the bench digestate). It is weighed and analysed, then emptied.",
      "Coleta o efluente (o digestato da bancada). É pesado e analisado, depois esvaziado.",
      "Effluent volume is logged each day, next to the feed, to check the volume balance.",
      "O volume de efluente é anotado todo dia, ao lado da alimentação, para conferir o balanço de volume.",
      [["Diameter", "Diâmetro", "63 mm", "63 mm"]],
    ],
    gastube: [
      "Gas tubing", "Tubo de gás",
      "Gas-tight tubing from the gas outlet over to the gas meter.",
      "Tubo estanque a gás, da saída de gás até o medidor.",
      "Any leak here makes the measured gas too low.",
      "Qualquer vazamento aqui faz o gás medido sair baixo.",
      [["Outside diameter", "Diâmetro externo", "5 mm", "5 mm"]],
    ],
    meter: [
      "Drum gas meter", "Medidor de gás de tambor",
      "Gas turns a drum of fixed volume: each turn of the needle is 100 mL, and the counter adds them up. This is the bench's main measurement: gas volume against time.",
      "O gás gira um tambor de volume fixo: cada volta do ponteiro são 100 mL, e o contador soma. É a medida principal da bancada: volume de gás contra o tempo.",
      "The counter is the cumulative gas; its rate is the gas-rate chart below.",
      "O contador é o gás acumulado; a vazão dele é o gráfico de vazão abaixo.",
      [["Per turn", "Por volta", "100 mL", "100 mL"], ["Drum", "Tambor", "66 mm", "66 mm"]],
    ],
    bag: [
      "Gas sampling bag", "Bolsa de amostragem de gás",
      "Collects the counted gas for composition analysis (methane, CO₂, H₂S). When it is full it is taken away and emptied.",
      "Coleta o gás medido para análise de composição (metano, CO₂, H₂S). Quando enche, é retirada e esvaziada.",
      "The model assumes 60 % methane; the bag is how a lab checks that.",
      "O modelo supõe 60 % de metano; a bolsa é como o laboratório confere isso.",
      [["Capacity", "Capacidade", "10 L", "10 L"]],
    ],
  },
};

// Each part's name, what it is for, its note, and its sizes (lab only), in the page's language.
export const topics = (fig) => Object.entries(T[fig]).map(([key, v]) => ({
  key, name: v[L], what: v[2 + L], scale: v[4 + L], specs: (v[6] || []).map((r) => [r[L], r[2 + L]]),
}));

// Number badges for the drawing: start on each part's anchor and push apart until no two are closer than gap
// (viewBox units), each pulled back toward its anchor. Returns { key: { at: [x, y], badge: [x, y] } }.
export function badgesFor(anchors, gap = 17) {
  const keys = Object.keys(anchors);
  const pos = Object.fromEntries(keys.map((k) => [k, [...anchors[k]]]));
  for (let it = 0; it < 300; it++) {
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
      const a = pos[keys[i]], b = pos[keys[j]];
      let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
      if (d >= gap) continue;
      if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
      const push = (gap - d) / 2 + 0.01;
      a[0] -= (dx / d) * push; a[1] -= (dy / d) * push; b[0] += (dx / d) * push; b[1] += (dy / d) * push;
    }
    for (const k of keys) { pos[k][0] += (anchors[k][0] - pos[k][0]) * 0.02; pos[k][1] += (anchors[k][1] - pos[k][1]) * 0.02; }
  }
  return Object.fromEntries(keys.map((k) => [k, { at: anchors[k], badge: pos[k].map((v) => +v.toFixed(1)) }]));
}
