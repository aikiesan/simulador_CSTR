# Simulador CSTR

Um biodigestor de mistura completa (CSTR) cortado ao meio, animado e interativo, em **duas escalas**: um reator de bancada de 5 L e o tanque de 520 m³ de uma fazenda. É feito para ensinar: dá para desmontar o reator peça por peça, rodar o processo dia a dia, provocar falhas e baixar os dados para analisar à parte.

**Abrir:** https://aikiesan.github.io/simulador_CSTR/ (em português).

## Como a página se organiza

1. **Abas Bancada · 5 L / Fazenda · 520 m³.** Uma escala por vez; a bancada abre primeiro. As duas plantas rodam sempre no mesmo relógio, então trocar de aba no meio de uma corrida mostra a outra escala no mesmo instante.
2. **Peças, uma a uma.** Cada peça tem um número no desenho e uma linha na lista ao lado. Clique numa peça (no desenho, no número ou na lista): ela se destaca, o resto esmaece, o desenho amplia até ela, e o cartão mostra para que serve, as **dimensões como desenhadas** e o que ela está fazendo **agora** (valores ao vivo). Esc ou **Ver o conjunto** volta à vista inteira. São 22 peças na bancada e 10 na fazenda.
3. **Operação.** Temperatura, TRH, ST da alimentação, agitadores, velocidade do tempo (de 2,5 min a 1 dia por segundo), alimentar agora, falha no aquecimento, pausa e cenários prontos. A tabela compara as duas escalas lado a lado.
4. **Análise da corrida.** Tudo o que o reator fez desde a partida, em cinco gráficos com o mesmo eixo de tempo e um só cursor:
   - biogás produzido (NL/d na bancada, Nm³/d na fazenda);
   - metano acumulado contra o máximo possível, B₀ × SV alimentado;
   - rendimento de cada dia (CH₄ por kg de SV alimentado), com a linha do B₀;
   - dentro do reator: S, o SV degradável que sobra, e b, a biomassa ativa;
   - temperatura do líquido e o ajuste.

   Ao lado ficam os **experimentos guiados**, a partida da corrida (reator em operação ou pouco inóculo), **Nova corrida**, **Sobrecarga por um dia**, o resumo da corrida e a lista numerada de **eventos** (toda mudança feita no painel entra nela e aparece como linha tracejada nos gráficos). Embaixo, o **registro diário** em tabela e dois CSV: a corrida inteira a cada 15 min de tempo da planta e o registro diário com os eventos.
5. **O espaço de operação.** O estado estacionário para qualquer combinação: a curva de metano por m³ em função do TRH, e um mapa TRH × temperatura (metano por m³, fração do B₀ ou S que sobra) com a linha de lavagem e a de carga orgânica 4. Clicar numa célula do mapa leva o reator até ela. A grade inteira sai em CSV.

Os CSV usam ponto e vírgula e vírgula decimal, para abrir direto numa planilha em português.

## Experimentos guiados

Cada um prepara o reator, começa uma corrida nova, muda uma coisa no momento certo e diz o que procurar:

| Experimento | O que acontece | Para ver |
|---|---|---|
| Partida do reator | enche com esterco e 1 % da biomassa ativa | o crescimento de b, a queda de S e o biogás em S; o rendimento passa do B₀ enquanto o reator consome o estoque inicial |
| Lavagem | no dia 1 o TRH cai para 2 d | b sai mais rápido do que cresce; o gás some embora entre mais esterco |
| Falha no aquecimento | o aquecimento falha às 6 h e volta um dia depois | a bancada esfria em horas, a fazenda quase não se mexe |
| Sobrecarga | alimentação dobrada por 24 h no dia 1 | pico de gás, rendimento menor por kg de SV, recuperação |
| Produção × rendimento | TRH 25 → 8 → 40 d | mais gás por dia contra mais gás por kg de SV |
| Digestor frio | o ajuste cai para 25 °C no dia 3 e volta no dia 23 | quanto a temperatura pesa neste modelo |
| Alimentação diluída | ST de 8 para 4 % no dia 3 | a mesma fração do B₀, metade do metano |

## As peças da bancada

Um reator de vidro encamisado de 5 L (diâmetro interno 180 mm, 196,5 mm de líquido; 1 unidade do desenho = 3 mm):

- vaso de vidro, camisa d’água, líquido, haste e impelidor de quatro pás a 45°;
- tampa com flange e braçadeira e quatro portas: alimentação, sonda de temperatura, saída de gás, amostragem;
- motor do agitador num suporte universal;
- banho termostatizado com visor e as duas mangueiras da camisa;
- bomba peristáltica (2 mL/min, três roletes, quatro pulsos por dia) com os tubos, a garrafa de alimentação e o agitador magnético;
- braço de extravasamento e garrafa de efluente;
- tubo de gás, medidor de gás de tambor (100 mL por volta) e bolsa de amostragem de 10 L.

Os textos e as dimensões de cada peça ficam em `src/topics.mjs`; os números da bancada usados na simulação (volume, bomba, pulsos, bolsa, constante térmica) ficam em `LAB`, em `src/model.mjs`. São escolhas de desenho didático, não de um reator real específico.

## A fazenda

Um tanque de 520 m³ com esterco de gado leiteiro: tanque de concreto isolado, chorume com serpentinas de aquecimento, crosta e sedimento, agitador de hélice, cobertura de dupla membrana, poço e bomba de alimentação (oito pulsos por dia), extravasor e caixa de digestato, linha de gás com purgador e selo, motor de 50 kW (liga com 70 % do gasômetro, para com 30 %) e flare.

## O modelo (e o que ele não sabe)

`src/model.mjs` é um modelo didático, não um projeto de engenharia:

- **regime permanente:** cinética de Chen e Hashimoto (1978) para um reator de mistura completa: μm(T) = 0,013 T − 0,129 e B/B₀ = 1 − K/(TRH·μm − 1 + K);
- K para esterco leiteiro de Hashimoto (1982): K = 0,8 + 0,0016·e^(0,06·S₀);
- **fora do equilíbrio:** a mesma cinética integrada na forma de Contois. S é o SV degradável no líquido e b a biomassa ativa, contada pela massa de SV que a formou:
  - db/dt = μ·b − D·b
  - dS/dt = D·(S₀ − S) − μ·b
  - μ = μm(T)·S/(K·b + S)
  - metano = B₀ · μ·b

  Em regime essas equações caem exatamente no estado estacionário de Chen e Hashimoto, e nenhum parâmetro novo entra. A alimentação chega em pulsos, como a bomba os dá, e a integração usa passos de no máximo 3 min de tempo da planta;
- B₀, SV/ST, ST do esterco e esterco por vaca vêm dos parâmetros de gado leiteiro do CP2b (PILAR-2b): BMP 200 Nm³ CH₄/t SV, SV 78 % do ST;
- energia com as convenções da calculadora do PILAR-2b: PCI de 35,8 MJ/m³ CH₄ e 35 % de eficiência elétrica.

Ele **não** tem:

- acidificação nem inibição por amônia, por isso o aviso acima de 4 kg SV/m³·d (uma sobrecarga real pode derrubar o pH; aqui ela só passa);
- a transição mesofílico/termofílico (μm é linear na temperatura);
- o choque de temperatura: uma queda só reduz o gás pela cinética, que em TRH longo é pouco sensível;
- balanço térmico real: o aquecimento e o gasômetro são controles liga/desliga simples;
- a escolha de partida com “pouco inóculo” (1 % da biomassa ativa de um reator maduro) é uma condição inicial didática, não uma receita de partida.

## Rodar localmente

Precisa só do Node 20.10 ou mais novo, sem dependências:

```bash
npm run build
```

Isso gera `site/index.html` e roda a auditoria de geometria nas duas figuras. Abra `site/index.html` no navegador.

## Estrutura

```text
src/model.mjs      o modelo: cinética em regime e dinâmica, dimensões das duas plantas, energia
src/shell.mjs      as membranas da cobertura, desenhadas em facetas (rodam também na página)
src/kit.mjs        carrega o kit Anatomy e o tema
src/parts.mjs      as peças comuns (caixas, cilindros, peças torneadas, flanges, tubos) que registram a forma real para a auditoria
src/farm.mjs       a geometria e a animação do tanque da fazenda
src/lab.mjs        a geometria e a animação do reator de bancada
src/topics.mjs     as peças de cada figura: o que fazem, dimensões, onde fica o número de cada uma
src/page.js        o script da página: relógio, abas, peças com zoom, registro da corrida, gráficos, mapa, CSV
src/build.mjs      os textos, o HTML e o CSS; confere o modelo e gera site/index.html
vendor/anatomy/    o kit de desenho isométrico Anatomy (MIT), copiado da versão em VERSION
.github/workflows/ o deploy no GitHub Pages: gera, audita e publica a cada push na main
```

A auditoria (`--audit`) confere, a partir das formas reais, que nenhum tubo atravessa nada, que todo flange assenta numa face, que nada flutua e que tudo é desenhado na ordem certa de profundidade. Se ela falhar, o GitHub Actions não publica.

## Créditos

- Desenho: [Anatomy](https://github.com/wheresryan22/anatomy), de Ryan, licença MIT (`vendor/anatomy/LICENSE`).
- Parâmetros do substrato: CP2b / [PILAR-2b](https://cp2b.unicamp.br/pilar2b/pt-BR), NIPE-UNICAMP.
- Chen, Y. R.; Hashimoto, A. G. (1978). Kinetics of methane fermentation. *Biotechnology and Bioengineering Symposium* 8, 269–282.
- Hashimoto, A. G. (1982). Methane from cattle waste: effects of temperature, hydraulic retention time, and influent substrate concentration on kinetic parameter (K). *Biotechnology and Bioengineering* 24(9), 2039–2052.
- Contois, D. E. (1959). Kinetics of bacterial growth: relationship between population density and specific growth rate of continuous cultures. *Journal of General Microbiology* 21, 40–50.

## Licença

MIT (`LICENSE`). O kit em `vendor/anatomy` tem a sua própria licença MIT (`vendor/anatomy/LICENSE`).
