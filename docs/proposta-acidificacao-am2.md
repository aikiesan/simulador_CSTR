# Proposta: acidificação no simulador (modelo AM2)

Status: **aguardando decisões**. Nada desta proposta está implementado.

Revisão 2 (após a pesquisa em seis partes e simulações de teste). Esta versão substitui a primeira e diz:
- o que se manteve, o que mudou e o que ainda falta decidir;
- o que a pesquisa trouxe de valores e referências, e o que não pôde ser conferido.

Nenhum valor desta página foi conferido no texto original dos artigos. A sessão não tinha acesso aos sites com o texto completo; só ao resumo dos buscadores. Antes do primeiro commit de código, cada valor precisa ser confirmado no PDF.

## Por que

Hoje uma sobrecarga ou um TRH curto só dão *mais* gás. O modelo não tem ácidos graxos voláteis (AGV) nem pH, então não mostra o que derruba um digestor real:
- os AGV se acumulam mais rápido do que as metanogênicas os consomem;
- a alcalinidade se esgota;
- o pH cai e a produção para.

## O que a simulação de teste mostrou (o mais importante)

Montei o modelo proposto num script à parte, fora da página, com:
- a etapa atual (Contois, Chen e Hashimoto) produzindo AGV;
- as metanogênicas, a cinética de Haldane e o bloco de pH e gás do AM2, com os valores de Bernard et al. (2001);
- a alimentação sugerida na pesquisa: alcalinidade 150 mmol/L, AGV 40 mmol/L, carbono inorgânico 140 mmol/L.

O ponto de partida é o ponto de projeto: 37 °C, TRH 25 d, 8 % de ST.

1. **O reator não azeda.** O pH mínimo de cada sobrecarga foi:
   - alimentação ×2 por 3 dias: 7,39;
   - ×4 por 3 dias: 7,35;
   - ×2 por 30 dias: 7,37.

   Os AGV nunca passam de 0,1 g/L.
   - **Por quê:** as metanogênicas de Bernard crescem até 0,8 d⁻¹ a 37 °C, vinte vezes o necessário com TRH de 25 d. A etapa atual é mais lenta (0,35 d⁻¹), então não consegue produzir ácido mais rápido do que elas o consomem.
   - **No mapa estacionário:** o reator sofre lavagem antes de azedar.
   - **Com metanogênicas mais lentas:**
     - com metade ou um quarto da velocidade de Bernard, os AGV chegam a 0,1–0,7 g/L;
     - só com cerca de 1/8 (μ₂max ≈ 0,1 d⁻¹) a alimentação ×4 por 3 dias leva os AGV a 4 g/L;
     - e a ×2 por 30 dias faz o reator colapsar.
2. **O resfriamento também não azeda.** Testei as três opções de temperatura (a mesma reta de hoje; T_min = 15 °C; θ = 1,09), resfriando até 17 °C. Em nenhuma o reator azeda. O metano cai igual nas três, porque quem o limita é a etapa 1.
3. **O metano no biogás fica em 48–51 %** se cada mmol de AGV der 1 de CH₄ e 1 de CO₂. O esterco leiteiro real dá 55–65 %.
   - **A sugestão da pesquisa piora isso.** Ela propõe somar 4,6–5,95 mmol de CO₂ por g de SV na etapa 1 para chegar a 60 %. Isso daria cerca de 40 %, porque mais CO₂ é menos metano.
   - **A causa real é dupla:**
     - o esterco é mais rico em hidrogênio do que o acetato;
     - a amônia liberada das proteínas segura CO₂ no líquido como bicarbonato de amônio, e o AM2 não tem amônia.
4. **O pH dá certo sem ajuste.** Com a alimentação acima, a entrada fica em pH 6,75 e o reator em cerca de 7,4. É o efeito real de a digestão converter os AGV da alimentação em alcalinidade de bicarbonato.

**Conclusão:** com os números de Bernard, o AM2 sobre a etapa atual acrescenta pH, AGV, % de CH₄ e o botão de bicarbonato, mas **não produz a falha por acidificação** que motivou a proposta. Ou isso é a verdade do esterco leiteiro, muito tamponado e conhecido por ser estável, ou falta uma cinética de metanogênicas própria para esterco. Ver a decisão 1.

## Estrutura (mantida): AM2 sobre a etapa atual

A etapa atual (Chen e Hashimoto na forma de Contois) passa a produzir AGV, em vez de metano direto. Do AM2 entram:
- as metanogênicas X₂, com Haldane;
- a alcalinidade Z;
- o carbono inorgânico C;
- o pH;
- a troca de CO₂ com o gás.

No ponto de projeto, os AGV ficam em cerca de 0,5 mmol/L e o metano fica igual ao de hoje. As equações:

- Etapa 1, como hoje:
  - r₁ = μ₁·b
  - μ₁ = μm(T)·S/(K·b + S)
  - dS/dt = D(S₀ − S) − r₁
  - db/dt = r₁ − D·b
- AGV, em mmol/L de equivalente acetato (64 mg DQO por mmol):
  - dS₂/dt = D(S₂,in − S₂) + y_AGV·r₁ − k₃·μ₂·X₂
- Metanogênicas:
  - dX₂/dt = (μ₂·I_pH − D)·X₂
  - μ₂ = μ₂max(T)·S₂/(K_S2 + S₂ + S₂²/K_I2)
- Alcalinidade:
  - dZ/dt = D(Z_in − Z) + dose de bicarbonato (1 g/L de NaHCO₃ = 11,9 mmol/L)
- Carbono inorgânico:
  - dC/dt = D(C_in − C) − q_C + q_CO2,met
- Gás:
  - q_CH4 = k₃·μ₂·X₂ (1 mmol de CH₄ por mmol de AGV, o que mantém o B₀)
  - q_CO2,met = r_CO2·q_CH4, com r_CO2 da decisão 2
  - q_C = kLa·(CO₂ − K_H·P_CO2)
  - P_CO2 = (φ − √(φ² − 4·K_H·P_T·CO₂))/(2·K_H), com φ = CO₂ + K_H·P_T + q_CH4/kLa
- pH:
  - CO₂ = C + S₂ − Z
  - HCO₃⁻ = Z − S₂, com piso numérico para não dar NaN quando S₂ ≥ Z
  - pH = −log₁₀(K_b·CO₂/HCO₃⁻)
- y_AGV = B₀/22,4 = 8,93 mmol/g de SV degradado. Os AGV que já vêm no esterco fazem parte do B₀, que é medido no esterco inteiro, então são descontados aqui e não somados. Somados, dariam cerca de 8 % de metano a mais.
- Na tela:
  - AGV em mg/L como ácido acético (× 60,05);
  - alcalinidade em mg CaCO₃/L (× 50,04);
  - o indicador AGV/alcalinidade = 60,05·S₂/(50,04·Z).

## Decisões para você

### 1. A falha por acidificação (a decisão principal)

Com os valores de Bernard o reator não azeda (ver acima). As opções:
- **(a) Aceitar e ensinar isso.** O esterco leiteiro é muito tamponado. A sobrecarga mostra o tampão segurando o pH, e os AGV e o % de CH₄ mexendo um pouco. Para mostrar a acidificação, criar um experimento de **codigestão com um substrato de degradação rápida** do PILAR-2b (por exemplo resíduo alimentar ou glicerina), que tem BMP próprio. Precisa de uma constante de degradação com fonte para esse substrato. **Recomendo esta.**
- **(b) Metanogênicas mais lentas para esterco**, com fonte. Para azedar, seria preciso μ₂max ≈ 0,1 d⁻¹. O ADM1 dá cerca de 0,4 d⁻¹ para acetato a 35 °C (k_m 8 × Y 0,05, ainda a conferir), o que não basta. Só vale se existir uma fonte de esterco com esse valor; escolher o número para o reator quebrar não é aceitável.
- **(c) Não fazer o AM2 agora** e investir noutro passo do plano.

### 2. O CO₂ por mmol de AGV, que define o % de CH₄

- **(a) 1 CO₂ por CH₄**, a estequiometria do acetato. Dá cerca de 50 % de CH₄, abaixo do real. A página precisaria explicar por quê.
- **(b) Menos de 1 CO₂ por CH₄ (cerca de 0,65)**, pela equação de Buswell aplicada a uma composição elementar publicada do SV de esterco leiteiro, descontando o CO₂ que o nitrogênio retém. Dá cerca de 60 %. **Recomendo esta.** Precisa da fonte da composição.
- **Rejeitado:** somar CO₂ na etapa 1, como sugeriu a pesquisa. Vai na direção errada.

### 3. Temperatura nas metanogênicas

**Recomendo a mesma reta de Chen e Hashimoto**, sem parâmetro novo.
- A pesquisa defendeu metanogênicas mais sensíveis ao frio, mas as citações não se sustentaram:
  - Bowen et al. (2014): título e periódico errados;
  - Pham et al. (2014): artigo não encontrado;
  - as faixas de energia de ativação: sem fonte.
- Uma pista (Donoso-Bravo et al., 2009) indica o contrário: a acidogênese é a etapa mais sensível.
- E nenhuma das opções azeda o reator ao resfriar.

### 4. Constantes físico-químicas: as de Bernard ou as físicas?

- O K_H = 16 mmol/(L·atm) de Bernard foi identificado na vinhaça. O valor físico a 35 °C é cerca de 27 mmol/(L·bar) (ADM1).
- A escolha muda o pH calculado em cerca de 0,2.
- **Recomendo K_H e K_b físicos e dependentes da temperatura, do ADM1 (Batstone et al., 2002).** Assim o pH responde quando o aquecimento falha.

### 5. kLa

**Recomendo 19,8 d⁻¹ nas duas escalas.**
- Pela minha conta, multiplicar o kLa por cinco muda o pH em cerca de 0,03 e o % de CH₄ em menos de meio ponto.
- As faixas que a pesquisa citou (10–50 d⁻¹ em bancada e 20–100 d⁻¹ em escala real) ainda precisam de conferência.

### 6. Inibição por pH baixo

**Recomendo a forma do ADM1 para metanogênicas acetoclásticas:**
- I_pH = exp(−3·((pH − 7)/(7 − 6))²) abaixo de pH 7, e 1 acima;
- limites pH_LL = 6 e pH_UL = 7, a conferir no relatório STR 13.

Ela dá 0,47 em pH 6,5 e 0,05 em pH 6. Não muda a decisão 1: com 150 mmol/L de alcalinidade, o pH quase não sai de 7,4. Mas é ela que faz o resgate com bicarbonato agir sobre um reator já azedo.

A forma alternativa da pesquisa, 1/(1 + 10^(3·(6 − pH))), não tem fonte. E os próprios números dela estavam errados: dá 0,97 em pH 6,5, não 0,84.

### 7. Alimentação: alcalinidade, AGV, carbono inorgânico

- A pesquisa propôs:
  - alcalinidade 150 mmol/L (7 500 mg CaCO₃/L);
  - AGV 40 mmol/L;
  - carbono inorgânico 140 mmol/L;
  - todos proporcionais ao ST.
- **A proporcionalidade ao ST eu aceito.** É o que faz a alimentação diluída tirar metade do tampão.
- **Os valores precisam de fonte de verdade.** O número central (85–110 g CaCO₃ por kg de ST) não tem fonte rastreável, e duas das citações parecem erradas (Kunz et al., 2019, com um DOI de prefixo que não é da Embrapa; Orrico Junior et al., 2010, com dois periódicos). A ASABE D384 não traz alcalinidade nem AGV.
- **Melhor fonte possível:** titular o esterco do próprio grupo (Ripley, pH 5,75 e 4,3).

### 8. Indicador AGV/alcalinidade

Recomendo mostrar com faixas:
- verde até 0,3;
- amarelo até 0,45;
- vermelho acima.

A página deve avisar duas coisas:
- essas faixas vêm de usinas com culturas energéticas (Lossie e Pütz, 2008; Drosg, 2013, IEA Bioenergy, a conferir);
- em esterco puro o normal é 0,05–0,25.

O valor do modelo é uma razão entre estados, não uma titulação de Nordmann. A página diz isso.

## Rótulos (PT-BR)

| Elemento | Rótulo |
|---|---|
| AGV | AGV totais (mg HAc/L) |
| Alcalinidade | Alcalinidade total (mg CaCO₃/L) |
| Indicador | Razão AGV/alcalinidade (tipo FOS/TAC) |
| Botão | Dosar bicarbonato de sódio |
| Biogás | Composição do biogás (% de CH₄) |

Os experimentos (sobrecarga, resgate, codigestão) dependem da decisão 1.

## Situação das referências

| Referência | Situação |
|---|---|
| Bernard et al. (2001), *Biotechnol. Bioeng.* 75(4):424–438, doi:10.1002/bit.10036 | Existe; reator de 1 m³, 70 dias. **Valores da tabela não conferidos.** |
| Batstone et al. (2002), *Water Sci. Technol.* 45(10):65–73, doi:10.2166/wst.2002.0292 | Confirmado. Os valores estão no relatório IWA STR 13, que precisa ser lido. |
| Hassam et al. (2015), *Biochem. Eng. J.* 99:193–203, doi:10.1016/j.bej.2015.03.007 | Confirmado (AM2HN = AM2 + hidrólise + amônio). |
| Arzate et al. (2017), *Chem. Ing. Tech.* 89(5):686–695, doi:10.1002/cite.201600176 | Existe, mas é sobre silagem de milho, não esterco. Valores não conferidos. |
| Angelidaki et al. (1993), *Biotechnol. Bioeng.* 42(2):159–166 | Confirmado. |
| Vavilin et al. (2008), *Waste Manag.* 28(6):939–951 | Existe; o título diz “degradation”, não “digestion”. |
| Hill (1982), *Trans. ASAE* 25(5):1374–1380, doi:10.13031/2013.33730 | Existe; volume e páginas finais não conferidos. |
| Mairet et al. (2011), *Bioresour. Technol.* 102(13):6823–6829 | **O título citado era inventado.** O real é “Modeling anaerobic digestion of microalgae using ADM1”: Contois no ADM1, não no AM2. |
| Bowen et al. (2014), Pham et al. (2014) | **Errados ou não encontrados.** Não usar. |
| Sommer e Husted (1995); Ripley et al. (1986); Nordmann (1977); Kunz et al. (2019); Orrico Junior et al. (2010) | Não conferidos. |

**Para conferir de verdade:** os PDFs de Bernard et al. (2001), do relatório ADM1 (STR 13), de Hill (1982), de Sommer e Husted (1995) e de Ripley et al. (1986), colocados no repositório. Ou liberar o acesso de rede da sessão a hal.science, arxiv.org, core.ac.uk e doi.org.

## O que continua fora

- Amônia (AM2HN), que também explicaria parte do % de CH₄.
- A hidrólise como etapa própria.
- A transição mesofílico/termofílico.
- Precipitação e balanço iônico completo (ADM1).

## Referências principais

- Bernard, O.; Hadj-Sadok, Z.; Dochain, D.; Genovesi, A.; Steyer, J.-P. (2001). Dynamical model development and parameter identification for an anaerobic wastewater treatment process. *Biotechnology and Bioengineering* 75(4), 424–438.
- Batstone, D. J. et al. (2002). The IWA Anaerobic Digestion Model No 1 (ADM1). *Water Science and Technology* 45(10), 65–73; e o relatório IWA STR No. 13.
- Chen, Y. R.; Hashimoto, A. G. (1978). Kinetics of methane fermentation. *Biotechnology and Bioengineering Symposium* 8, 269–282.
- Hashimoto, A. G. (1982). Methane from cattle waste: effects of temperature, hydraulic retention time, and influent substrate concentration on kinetic parameter (K). *Biotechnology and Bioengineering* 24(9), 2039–2052.
- Contois, D. E. (1959). Kinetics of bacterial growth: relationship between population density and specific growth rate of continuous cultures. *Journal of General Microbiology* 21, 40–50.
- Hassam, S.; Ficara, E.; Leva, A.; Harmand, J. (2015). A generic and systematic procedure to derive a simplified model from the anaerobic digestion model No. 1 (ADM1). *Biochemical Engineering Journal* 99, 193–203.
- Ripley, L. E.; Boyle, W. C.; Converse, J. C. (1986). Improved alkalimetric monitoring for anaerobic digestion of high-strength wastes. *Journal WPCF* 58(5), 406–411 (a conferir).
