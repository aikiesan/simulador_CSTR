# Proposta: substratos da cana (vinhaça + torta de filtro) e acidificação

**Revisão 3 da proposta de acidificação.** Complementa `proposta-acidificacao-am2.md` (rev. 2).
**Status: aguardando decisões. Nada disto está no código.**

## 1. Por que mudar o foco

Os testes da rev. 2 mostraram que, com os parâmetros de Bernard et al. (2001), um digestor de
esterco bovino **quase nunca acidifica**. O esterco chega com muita alcalinidade, e a falha que
queríamos ensinar não aparece.

Com os resíduos da cana a situação é a oposta:

- a **vinhaça** é ácida (pH 4,3–4,6) e tem tamponamento perto de zero;
- a **torta de filtro** tem pouco Mo, W e Se e precisa de nitrogênio;
- **bagaço e palha** têm C:N alto (75 na palha) e são lignocelulósicos.

Por isso acidificação, dosagem de álcali e correção de nutrientes são problemas reais de operação
nas usinas de São Paulo. O modelo AM2 também foi ajustado originalmente com vinhaça (de vinho).

Plano acordado com você:

1. começar com **vinhaça + torta de filtro**;
2. manter o **esterco bovino** como opção;
3. adicionar **bagaço e palha pré-tratados** depois;
4. no futuro, transformar a aba "fazenda" numa **usina**.

## 2. Fontes lidas (Drive do grupo)

Os textos foram extraídos dos PDFs da pasta compartilhada. Conferi diretamente no texto as citações
marcadas com ✔; as demais vêm dos relatórios de extração e precisam de conferência antes de entrar
no código.

| Chave | Referência | O que dá ao simulador |
|---|---|---|
| janke2015 | Janke et al. 2015, *Int. J. Mol. Sci.* 16:20685–20703, doi:10.3390/ijms160920685 | k de 1ª ordem (BMP a 38 °C) para palha, bagaço, torta e vinhaça; composição |
| janke2019 | Janke et al. 2019, *Renew. Energy* 143:1416–1426, doi:10.1016/j.renene.2019.05.029 | CSTR de bancada **5 L** só com torta: OLR, ureia, cinética de dois pools |
| volpi2021 | Volpi et al. 2021, *Appl. Microbiol. Biotechnol.* 105:8969–8987, doi:10.1007/s00253-021-11635-x | s-CSTR 4 L a 55 °C com vinhaça + torta; **OLR de colapso** |
| wongarmat2025 | Wongarmat et al. 2025, *Carbon Resour. Convers.* 8:100248, doi:10.1016/j.crcon.2024.100248 | CSTR 10 L com torta; AGV/alcalinidade estável × instável |
| fuess2017 | Fuess et al. 2017, *J. Environ. Sci. Health A* 52:1063–1072, doi:10.1080/10934529.2017.1338892 | composição da vinhaça de 4 usinas de SP |
| mota2015 | Mota et al. 2015, doi:10.1007/s12010-015-1653-8 | sólidos e biodegradabilidade da vinhaça |
| fuess2022 | Fuess et al. 2022, *Biomass* 2:374–411 | custo e dose de álcali (NaOH, NaHCO₃) |
| barros2017 | Barros et al. 2017, *Bioresour. Technol.* 244:371–381, doi:10.1016/j.biortech.2017.07.106 | UASB termofílico com vinhaça; recirculação como fonte de alcalinidade |
| pilar2b | `aikiesan/Pilar-2b`, `feedstocks.yaml` | BMP, ST, SV, % CH₄, C:N já usados pelo grupo |

## 3. Valores por substrato

### 3.1 Do Pilar-2b (`feedstocks.yaml`)

| Substrato | Linha | BMP mín/méd/máx (NmL CH₄/g SV) | ST (%) | SV (% ST) | CH₄ (%) | C:N |
|---|---|---|---|---|---|---|
| Vinhaça (VINHACA) | 203 | 90 / 160 / 200 | 3 | 60 | 65 | 5 |
| Torta de filtro (TORTA_FILTRO) | 257 | 200 / 280 / 380 | 38 | 80 | 60 | 22 |
| Bagaço (BAGACO) | 33 | 115 / 165 / 220 | 58,9 | 90 | 55 | 29,6 |
| Palha (PALHA) | 142 | 140 / 175 / 250 | 30 | 82 | 55 | 75 |

⚠ **Inconsistência na vinhaça:** o valor médio de 160 não bate com a única referência citada no
próprio arquivo (bonomi2015: faixa 50–130, típico ~85). Ver Decisão 2.

### 3.2 Cinética (Janke 2015, Tabela 4; Janke 2019, Tabela 6)

Constante de 1ª ordem k (d⁻¹), BMP em batelada a 38 °C, 35 d (janke2015):

| Substrato | Amostras | k (d⁻¹) |
|---|---|---|
| Vinhaça | V-1 / V-2 / V-3 | 0,413 / 0,209 / 0,107 |
| Torta de filtro | FC-1 / FC-2 / FC-3 | 0,159 / 0,178 / 0,091 |
| Bagaço | B-1 / B-2 | 0,119 / 0,124 ✔ |
| Palha | S-1 / S-2 / moída | 0,091 / 0,075 / 0,102 |

Torta de filtro, modelo de dois pools (janke2019, Tabela 6, sem tratamento) ✔:

| Parâmetro | Valor |
|---|---|
| SBMP | 232 ± 1,73 mL CH₄/g SV |
| a (fração rápida) | 0,45 ± 0,01 |
| k_F (rápida) | 0,86 ± 0,02 d⁻¹ |
| k_L (lenta) | 0,08 ± 0,01 d⁻¹ |

Janke 2015 também dá a equação de CSTR S/S₀ = 1/(1 + kθ) (Eq. 2). Por ela, a conversão de 80 % exige
TRH de 25–45 d para a torta e de 45–55 d para a palha.

### 3.3 Química da vinhaça (alimentação)

| Grandeza | Faixa | Fonte |
|---|---|---|
| pH | 4,3–4,6 (usinas de SP); 3,3–3,9 | fuess2017; mota2015 |
| DQO | 22,9–35,8 g/L; 18–27 g/L | fuess2017; mota2015 |
| ST / SV | 15–20 / 12–17 g/L | mota2015 |
| Biodegradabilidade | > 96 % | mota2015 |
| NTK | 629–1404 mg/L | fuess2017 |
| K | 1330–4010 mg/L | fuess2017 |
| SO₄²⁻ | 2068–3800 mg/L | fuess2017 |
| Temperatura na saída da destilaria | 85–90 °C | Moraes et al. 2015 (revisão) |
| Ácidos orgânicos (lote 1, mg/L) | lático 3891; propiônico 1695; isobutírico 1305; acético 657 | volpi2021 |

**Lacuna:** nenhum artigo do Drive mede a **alcalinidade** da vinhaça bruta. O carbono inorgânico
fica em 12–15 mg C/L, ou seja, praticamente zero. Proponho usar Z_in ≈ 0 e marcar isso como
suposição (Decisão 4).

## 4. Metas de validação (o que o simulador deve reproduzir)

| Caso | Condição | Resultado medido | Fonte |
|---|---|---|---|
| Torta estável | 5 L, 38 °C, OLR 2,1 → 2,7 → 3,2 g SV/L·d (TRH 38,5 → 30 → 25 d), 2 g ureia/L de alimentação + micronutrientes | ~218–224 mL CH₄/g SV; pH 7,3; AGV < 50 mg/L; NAT 1,15–1,29 g/L | janke2019 |
| Vinhaça + torta, colapso | 4 L, 55 °C, OLR 1,50 → 5,23 g SV/L·d (TRH 40 → 11 d) | ótimo a 4,16 (233 mL/g SV, 83 % de remoção); queda a 4,80; **colapso a 5,23** ✔ | volpi2021 |
| Torta, limite de TRH | 10 L, 37 °C, TRH 40 / 30 / 20 / 15 d | AGV/alcalinidade 0,24 / 0,31 / 0,34 estável; **0,41 instável** ✔ | wongarmat2025 |

Faixas para o indicador AGV/alcalinidade (FOS/TAC):

- **≤ 0,35:** estável (wongarmat2025);
- **0,40–0,45:** alerta/instável (wongarmat2025 cita > 0,4; janke2019 cita 0,45);
- **cuidado:** com vinhaça em UASB, Barros 2017 relata IA/PA > 0,6 ainda estável. O limiar depende
  do substrato, e a página deve dizer isso.

## 5. O que muda no simulador (bancada)

1. **Seletor de substrato:** esterco bovino (atual), vinhaça, torta de filtro e mistura vinhaça + torta
   (proporção em SV ajustável). Bagaço e palha entram numa etapa posterior.
2. **Cinética por substrato:**
   - esterco continua com Chen–Hashimoto (K de Hashimoto 1982);
   - vinhaça e torta passam a usar a hidrólise de 1ª ordem ou de dois pools (Janke). O K de
     Hashimoto vale só para esterco bovino e não deve ser extrapolado.
3. **Acoplamento AM2 (Opção B da rev. 2):** a etapa de hidrólise/acidogênese gera AGV, e as
   metanogênicas X₂ (Haldane) consomem esse AGV. Com Z_in ≈ 0, o pH agora cai de verdade.
4. **Controles novos:**
   - dose de álcali: NaOH, NaHCO₃ ou recirculação de efluente;
   - dose de ureia;
   - temperatura de 55 °C (termofílico), opção usada para vinhaça.
5. **Experimentos guiados:**
   - "vinhaça sem álcali": o reator azeda;
   - "subir a OLR até o colapso": reproduz Volpi 2021;
   - "resgate": parar a alimentação e dosar bicarbonato;
   - "equilibrar C:N": misturar torta com vinhaça.
6. **Indicadores:** pH, AGV (mg HAc/L), alcalinidade (mg CaCO₃/L), FOS/TAC com as faixas acima, e
   % CH₄ no biogás.

## 6. Decisões que preciso de você

| # | Decisão | Minha recomendação |
|---|---|---|
| 1 | Cinética da torta: 1ª ordem (k = 0,159–0,178, Janke 2015) ou dois pools (Janke 2019)? | **Dois pools.** Vem de um CSTR de 5 L, a mesma escala da bancada. |
| 2 | BMP da vinhaça: 160 (Pilar-2b) ou ~85 (bonomi2015)? | Usar o valor de Volpi/Janke medido em SV e **corrigir o Pilar-2b** à parte. Preciso que você confirme qual é o número do grupo. |
| 3 | k da vinhaça: os três valores variam 4× (0,107–0,413). | Usar **0,209 (V-2, intermediário)** e mostrar a faixa como incerteza. |
| 4 | Alcalinidade da vinhaça bruta: sem medida no Drive. | **Z_in ≈ 0**, marcado como suposição. Se o grupo tiver uma medida, usamos ela. |
| 5 | Validar primeiro contra Janke 2019 (38 °C) ou contra Volpi 2021 (55 °C)? | **Janke 2019 primeiro:** mesma escala, mesofílico, como o modelo atual. Volpi depois, quando o 55 °C estiver pronto. |
| 6 | μ₂max e KS2 das metanogênicas: Bernard 2001 continua sem verificação (o PDF não está no Drive). | Ajustar μ₂max para reproduzir o colapso de Volpi a 5,23 e a estabilidade de Janke a 3,2, e **declarar na página que é um ajuste**. |
| 7 | Limiar FOS/TAC exibido: um número único ou faixa por substrato? | **Faixa por substrato**, com a nota de Barros 2017. |
| 8 | Bagaço e palha: em que etapa? | Depois de vinhaça + torta validadas. Antes disso, decidir o pré-tratamento a modelar. |

## 7. Lacunas que dependem de fontes primárias

- **Bernard et al. 2001** (AM2) e **Batstone et al. 2002** (ADM1, STR13): não estão no Drive. Sem eles,
  os parâmetros μ₂max, KS2, KI2, KH e Kb continuam sem verificação. Basta colocar os PDFs na pasta
  que eu confiro.
- **Alcalinidade da vinhaça bruta:** nenhuma medida encontrada.
- **OLR de falha para vinhaça pura em CSTR:** não encontrada. Volpi é mistura.
- **Constantes de Contois ou Chen–Hashimoto para bagaço e palha:** não encontradas. Só há k de 1ª ordem.
- **% de CH₄ em Volpi:** o artigo de 2021 dá 80,77 % e o de 2022 (mesmo reator) dá 65 %. Não usar
  nenhum dos dois como meta até esclarecer.

## 8. Fora do escopo desta etapa

- A aba "fazenda" virar usina: fica para uma proposta separada, depois desta validada.
- Pegada hídrica: continua bloqueada nas suposições de ST.
- Sulfato e H₂S: a vinhaça tem 2–4 g/L de SO₄²⁻, o que é relevante, mas fica para depois.
