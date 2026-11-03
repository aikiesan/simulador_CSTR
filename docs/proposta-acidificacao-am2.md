# Proposta: acidificação no simulador (modelo AM2)

Status: **aguardando aprovação**. Nada desta proposta está implementado. Os valores marcados “conferir” vêm de como o AM2 é reproduzido na literatura e precisam ser checados contra a tabela do artigo original antes de entrar no código.

## Por que

Hoje uma sobrecarga ou um TRH curto só dão *mais* gás. O modelo não tem ácidos graxos voláteis (AGV) nem pH, então não mostra o que mais derruba um digestor real: os AGV se acumulam mais rápido do que as metanogênicas os consomem, a alcalinidade se esgota, o pH cai e a produção para.

## O que muda para o aluno

- **Na sonda de pH** (peça 7 da bancada): o pH ao vivo.
- **Na bolsa de gás** (peça 22): a composição, % de CH₄ e de CO₂. Hoje ela é fixa em 60 % de CH₄.
- **Na análise da corrida**, três painéis novos, cada um com o seu eixo:
  - AGV (mg/L, como ácido acético);
  - pH;
  - % de CH₄ no biogás.
- **Um indicador de estabilidade**, a razão AGV/alcalinidade (FOS/TAC), com faixas de alerta.
- **Experimentos novos:**
  - *Acidificação por sobrecarga*: alguns dias de alimentação dobrada até o reator azedar e parar;
  - *Resgate*: parar a alimentação, ou dosar bicarbonato (novo botão), e ver quanto tempo leva para voltar.
- **O mapa do estado estacionário** ganha a região de falha por acidificação, além da de lavagem.
- **A fazenda roda o mesmo modelo.** A cinética continua sem conhecer tamanho.

## Estrutura recomendada: AM2 sobre o que já existe

**Opção B, recomendada.** Mantém a etapa atual: o SV degradável S é consumido pela biomassa b, com a cinética de Chen e Hashimoto na forma de Contois. O que ela degrada passa a virar **AGV**, em vez de metano direto. Do AM2 (Bernard et al., 2001) entram:
- as **metanogênicas X₂**, que consomem os AGV com cinética de Haldane, inibida pelos próprios AGV;
- a **alcalinidade Z** e o **carbono inorgânico C**;
- o **pH** e a **troca de CO₂** com o gás.

Por que B, e não o AM2 puro:
- **Opção A, o AM2 puro**, foi identificado para vinhaça num reator de leito fixo. Ele trocaria toda a calibração atual: o B₀ de 200 Nm³ CH₄/t SV do CP2b, o K de Hashimoto para esterco leiteiro e o TRH de lavagem. E o seu rendimento de metano por DQO não bate com o B₀ do esterco.
- **A opção B mantém essa calibração.** No ponto de projeto, as metanogênicas consomem os AGV quase por inteiro, então o gás fica praticamente igual ao de hoje. A diferença só aparece quando a produção de AGV supera o que X₂ consegue consumir.

### Equações (opção B)

Concentrações por litro de reator; D = 1/TRH; T é a temperatura do líquido.

- Hidrólise e acidogênese (como hoje):
  - r₁ = μ₁·b
  - μ₁ = μm(T)·S/(K·b + S)
  - dS/dt = D(S₀ − S) − r₁
  - db/dt = r₁ − D·b
- AGV, em mmol/L de acetato equivalente:
  - dS₂/dt = D(S₂,in − S₂) + y_AGV·r₁ − k₃·μ₂·X₂
- Metanogênicas:
  - dX₂/dt = (μ₂ − D)·X₂
  - μ₂ = μ₂max(T)·S₂/(K_S2 + S₂ + S₂²/K_I2)
- Alcalinidade:
  - dZ/dt = D(Z_in − Z) + dose de bicarbonato
- Carbono inorgânico:
  - dC/dt = D(C_in − C) − q_C + y_CO2·r₁ + k₃·μ₂·X₂
- Gás:
  - q_CH4 = k₃·μ₂·X₂, um mmol de CH₄ por mmol de acetato;
  - q_C = kLa·(CO₂ − K_H·P_CO2), com P_CO2 da pressão parcial no gás (AM2).
- pH:
  - CO₂ dissolvido = C + S₂ − Z
  - bicarbonato = Z − S₂
  - pH = −log₁₀(K_b · CO₂ / bicarbonato)

y_AGV liga as duas etapas mantendo o B₀:
- 1 mmol de acetato = 64 mg DQO e rende 22,4 mL de CH₄ (0,35 L CH₄/g DQO).
- Para que o SV degradado renda B₀ = 0,2 m³ CH₄/kg SV, cada g de SV degradado deve gerar 0,2/0,35 = 0,571 g DQO de AGV.
- Isso dá **y_AGV = 0,571/0,064 ≈ 8,9 mmol de AGV por g de SV degradado**. É uma conta, não um parâmetro novo.

## Parâmetros

| Símbolo | O que é | Valor | Unidade | Fonte | Situação |
|---|---|---|---|---|---|
| μm(T), K, B₀ | etapa 1, como hoje | os atuais | — | Chen e Hashimoto (1978); Hashimoto (1982); CP2b | já aprovados |
| y_AGV | AGV gerados por SV degradado | ≈ 8,9 | mmol/g SV | estequiometria (acima), a partir do B₀ | conta |
| μ₂max (35 °C) | crescimento máximo das metanogênicas | 0,74 | d⁻¹ | Bernard et al. (2001) | conferir |
| μ₂max(T) | efeito da temperatura | 0,74 × μm(T)/μm(35) | d⁻¹ | escolha: mesma reta de Chen e Hashimoto | **decidir** |
| K_S2 | meia-saturação em AGV | 9,28 | mmol/L | Bernard et al. (2001) | conferir |
| K_I2 | inibição por AGV (Haldane) | 256 | mmol/L, na forma S₂²/K_I2 | Bernard et al. (2001) | conferir: algumas reproduções escrevem (S₂/K_I2)², o que muda o valor |
| k₃ | AGV consumidos por g de X₂ formada | 268 | mmol/g | Bernard et al. (2001) | conferir |
| CH₄ e CO₂ por AGV | gás formado por mmol de AGV consumido | 1 e 1 | mmol/mmol | estequiometria do acetato (CH₃COOH → CH₄ + CO₂) | **decidir**: no AM2 são k₆/k₃ ≈ 1,69 e k₅/k₃ ≈ 1,28, identificados para vinhaça; com 1 e 1 o B₀ se mantém |
| α | fração da biomassa que sai com o efluente | 1 (CSTR) | — | Bernard usou 0,5 (leito fixo); num CSTR é 1 | escolha justificada |
| y_CO2 | CO₂ da acidogênese | k₄/k₁ = 50,6/42,14 ≈ 1,2 mmol/g DQO, ou seja ≈ 0,69 mmol/g SV | mmol/g SV | Bernard et al. (2001), convertido | conferir |
| kLa | transferência de CO₂ líquido → gás | 19,8 | d⁻¹ | Bernard et al. (2001); depende do reator | **decidir** (mesmo valor nas duas escalas?) |
| K_H | Henry do CO₂ | 16 | mmol/(L·atm) | Bernard et al. (2001) | conferir |
| K_b | constante do par CO₂/bicarbonato | 6,5 × 10⁻⁷ | mol/L | Bernard et al. (2001) | conferir |
| P_T | pressão total | 1 | atm | — | — |

### Características da alimentação (esterco leiteiro): **precisam de fonte**

O CP2b/PILAR-2b não traz estes valores; procurei em `feedstocks.yaml` e nas tabelas de referência. Proponho buscar na literatura de esterco leiteiro (por exemplo Hill e Barth, 1977, e Hill, 1982, que modelam esterco com AGV e pH) ou num dado de laboratório do próprio grupo, se houver.

| Símbolo | O que é | Unidade | Situação |
|---|---|---|---|
| Z_in | alcalinidade total da alimentação | mmol/L (ou mg CaCO₃/L) | **precisa de fonte** |
| S₂,in | AGV já presentes no esterco fresco | mmol/L | **precisa de fonte** |
| C_in | carbono inorgânico da alimentação | mmol/L | **precisa de fonte** |
| faixas FOS/TAC | limites de alerta do indicador | — | **precisa de fonte**: são regras da prática (método de Nordmann), não do modelo |

## Decisões para você

1. **Estrutura:** opção B (AM2 sobre a etapa atual, recomendada) ou A (AM2 puro, recalibrado)?
2. **Temperatura nas metanogênicas:** usar a mesma reta de Chen e Hashimoto (recomendado, nada novo) ou deixar X₂ sem efeito de temperatura, como no AM2 original?
3. **Gás por AGV:** 1 mmol de CH₄ e 1 de CO₂ por mmol de AGV, pela estequiometria do acetato (recomendado, mantém o B₀), ou os k₆ e k₅ do AM2?
4. **kLa:** o mesmo nas duas escalas (recomendado: a cinética não conhece tamanho), ou um valor por escala? Na bancada a agitação e a área de líquido por volume são outras.
5. **Alimentação:** de onde vêm Z_in, S₂,in e C_in? Literatura (qual) ou dados do grupo?
6. **Indicador FOS/TAC:** mostrar com faixas de alerta (precisa de fonte) ou só o valor?

## Como vou conferir

- **No ponto de projeto** (37 °C, 25 d, 8 % de ST), o metano fica dentro de 2 % do valor atual, e o pH e o % de CH₄ ficam em faixas típicas de esterco leiteiro.
- **Lavagem:** o TRH de lavagem continua o de hoje, ou o das metanogênicas se for mais longo. A página diz qual dos dois manda.
- **Sobrecarga:** existe uma carga a partir da qual o reator azeda e não volta sozinho (a biestabilidade do AM2). Comparo essa carga com o limite prático de uns 4 kg SV/m³·d que a página já cita. Se ficarem muito longe, volto a você antes de ajustar qualquer coisa.
- **Equivalência das formas:** o estado estacionário do modelo dinâmico é igual ao calculado direto, como já é hoje.
- **Fonte:** cada valor “conferir” confirmado contra o artigo original antes do primeiro commit.

## O que continua fora

- Amônia (a extensão AM2HN, Hassam et al., 2015, poderia vir depois).
- Inibição por pH baixo nas metanogênicas, além da inibição por AGV.
- A hidrólise como etapa própria.
- A transição mesofílico/termofílico.
- Precipitação e balanço iônico completo (isso seria o ADM1).

## Referências

- Bernard, O.; Hadj-Sadok, Z.; Dochain, D.; Genovesi, A.; Steyer, J.-P. (2001). Dynamical model development and parameter identification for an anaerobic wastewater treatment process. *Biotechnology and Bioengineering* 75(4), 424–438.
- Chen, Y. R.; Hashimoto, A. G. (1978). Kinetics of methane fermentation. *Biotechnology and Bioengineering Symposium* 8, 269–282.
- Hashimoto, A. G. (1982). Methane from cattle waste: effects of temperature, hydraulic retention time, and influent substrate concentration on kinetic parameter (K). *Biotechnology and Bioengineering* 24(9), 2039–2052.
- Hill, D. T.; Barth, C. L. (1977). A dynamic model for simulation of animal waste digestion. *Journal of the Water Pollution Control Federation* 49(10), 2129–2143.
- Hill, D. T. (1982). A comprehensive dynamic model for animal waste methanogenesis. *Transactions of the ASAE* 25(5), 1374–1380.
- Hassam, S.; Ficara, E.; Leva, A.; Harmand, J. (2015). A generic and systematic procedure to derive a simplified model from the anaerobic digestion model No. 1 (ADM1). *Biochemical Engineering Journal* 99, 193–203.
- Contois, D. E. (1959). Kinetics of bacterial growth: relationship between population density and specific growth rate of continuous cultures. *Journal of General Microbiology* 21, 40–50.
