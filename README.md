# Simulador CSTR

Um biodigestor de mistura completa (CSTR) cortado ao meio, animado e interativo, em **duas escalas**: o tanque de 520 m³ da fazenda (Fig 1) e um reator de bancada de 5 L (Fig 2). Na tela larga as duas figuras ficam lado a lado; no celular, uma embaixo da outra. Um só painel e um só relógio comandam as duas.

**Abrir:** https://aikiesan.github.io/simulador_CSTR/ (português, claro). Pela barra do topo dá para trocar para inglês ou para o tema escuro.

## O que tem na figura

Um tanque de 520 m³ com esterco de gado leiteiro, numa bancada:

- tanque de concreto com isolamento e revestimento (o corte mostra as camadas);
- chorume com as duas faces do corte: bolhas subindo, serpentinas de aquecimento em corte, crosta em cima e sedimento embaixo;
- agitador de hélice numa haste-guia e haste central com as cintas que seguram a membrana;
- cobertura de dupla membrana, cortada mais largo que o tanque para a membrana de gás aparecer;
- poço de alimentação, bomba helicoidal e entrada com registro;
- extravasor e caixa de digestato;
- saída de gás, purgador de condensado e selo hidráulico de segurança;
- contêiner do motor (CHP) com dry cooler e silencioso;
- tubos de aquecimento (ida e volta);
- flare.

## A escala de bancada (Fig 2)

Um reator de vidro encamisado de 5 L (diâmetro interno 180 mm, 196,5 mm de líquido), cortado como o tanque:

- vidro com camisa de água (o corte mostra vidro, água e vidro; a água acende quando o banho aquece), anel de apoio, flange, tampa de inox com braçadeira e quatro portas (alimentação, sensor de temperatura, gás, amostragem);
- agitador mecânico num suporte universal (base, haste, mufa, braço), eixo e impelidor de pás inclinadas;
- banho termostático com visor da temperatura, ligado à camisa por duas mangueiras;
- frasco de alimentação num agitador magnético e bomba peristáltica com timer (o rotor gira quando bombeia, o visor mostra o tempo até a próxima alimentação);
- braço de transbordo no nível do líquido até o frasco de efluente (os níveis dos dois frascos sobem e descem);
- medidor de gás de tambor (ponteiro de 100 mL por volta e contador) e bolsa de amostragem de 10 L que enche e é esvaziada para análise.

A cinética é a mesma do tanque (`steady(plant, volume)`): no mesmo TRH, temperatura e ST, os dois atingem a mesma fração do B₀ e produzem o mesmo metano por m³ de reator; a bancada produz cerca de 104 000 vezes menos no total. O que muda com a escala é o resto: 5 L esquentam e esfriam em uma ou duas horas (o banho liga e desliga muito mais vezes), a alimentação é em quatro pulsos por dia com bomba de 2 mL/min, e o gás é medido em mL. Esses números da bancada (volume, bomba, pulsos, bolsa, constante térmica) estão em `LAB`, em `src/model.mjs`, e são escolhas de desenho didático, não de um reator real específico.

O painel mostra as duas escalas lado a lado; o gráfico é uma só curva com dois eixos (fazenda em Nm³ CH₄/d à esquerda, bancada em NL CH₄/d à direita). Os botões **Alimentar agora** (ou tecla F) e **Esvaziar a bolsa de gás** agem na hora.

## O que se mexe

O tempo da planta corre cerca de 10 minutos por segundo (dá para mudar no painel ou com ← →):

- a bomba alimenta oito vezes por dia e o extravasor deixa sair o mesmo volume; os tubos com tracejado são os que estão escoando;
- o agitador roda 15 min por hora; desligado (tecla M ou painel), forma crosta e sedimento;
- o aquecimento liga e desliga para segurar a temperatura (as serpentinas acendem);
- a membrana de gás sobe com o gás armazenado; o motor de 50 kW liga com 70 % e para com 30 %;
- o flare acende quando o gasômetro enche.

- a produção de gás segue a temperatura que o líquido realmente tem, não a temperatura ajustada: a cinética é lida, a cada instante, na temperatura atual (aproximação quase estacionária).

O painel muda temperatura, TRH e ST da alimentação e mostra, para as duas escalas, a temperatura e o biogás de agora, alimentação, vacas equivalentes, carga orgânica, fração do B₀, metano, biogás, potência elétrica, área de parede e piso por m³ e o TRH de lavagem.

Dois gráficos:

- **metano por m³ de reator em função do TRH**, com as zonas de lavagem e de sobrecarga. Um eixo só: a cinética não conhece tamanho, então a mesma curva serve às duas escalas; o tooltip converte para Nm³/d na fazenda e NL/d na bancada;
- **as últimas 48 h de tempo da planta**: biogás por m³ de reator e temperatura, fazenda e bancada nos mesmos eixos.

### Peças

Aponte para qualquer peça de uma figura (ou toque, ou escolha um botão embaixo dela): a peça se destaca, o resto esmaece e um cartão diz o que ela é, o que está fazendo agora (valores ao vivo) e o que muda na outra escala. São dez peças na fazenda (tanque, chorume, agitador, serpentinas, cobertura, alimentação, linha de gás, motor, flare, digestato) e dez na bancada (vidro, líquido, camisa, banho, agitador, tampa, bomba peristáltica, efluente, medidor de gás, bolsa). Os textos ficam em `src/topics.mjs`.

### Cenário: falha no aquecimento

O botão **Falha no aquecimento** (tecla H) desliga o aquecimento nas duas escalas. Os 5 L esfriam em poucas horas; os 520 m³ perdem uns poucos graus no mesmo tempo, porque têm cinquenta vezes menos superfície por volume (0,55 contra 27 m²/m³). Ligue de novo e compare como cada um volta.

**Teste:** ponha o TRH em 6 d. O modelo dá o máximo de metano ali, mas a carga orgânica passa de 4 kg SV/m³·d, o motor não dá conta e o flare acende. Na prática, um digestor acidifica antes disso.

## O modelo (e o que ele não sabe)

`src/model.mjs` é um modelo didático, não um projeto de engenharia:

- cinética de Chen e Hashimoto (1978) para um reator de mistura completa: μm(T) = 0,013 T − 0,129 e B/B₀ = 1 − K/(TRH·μm − 1 + K);
- K para esterco leiteiro de Hashimoto (1982): K = 0,8 + 0,0016·e^(0,06·S₀);
- B₀, SV/ST, ST do esterco e esterco por vaca vêm dos parâmetros de gado leiteiro do CP2b (PILAR-2b): BMP 200 Nm³ CH₄/t SV;
- energia com as convenções da calculadora do PILAR-2b: PCI de 35,8 MJ/m³ CH₄ e 35 % de eficiência elétrica.

Ele **não** tem:

- acidificação nem inibição por amônia, por isso o aviso acima de 4 kg SV/m³·d;
- a transição mesofílico/termofílico (μm é linear na temperatura);
- dinâmica real: a planta responde em horas, um digestor real leva semanas; e uma queda de temperatura só reduz o gás pela cinética de Chen e Hashimoto, que em TRH longo é pouco sensível: o choque que um digestor real sofre com uma queda brusca não está aqui;
- balanço térmico real: o aquecimento e o gasômetro são controles liga/desliga simples.

## Rodar localmente

Precisa só do Node 20.10 ou mais novo, sem dependências:

```bash
npm run build    # gera site/ (quatro versões + index.html) e roda a auditoria de geometria
npm run audit    # só a auditoria, numa versão
```

Abra `site/index.html` no navegador.

## Estrutura

```text
src/model.mjs      o modelo: cinética (para qualquer volume), dimensões das duas plantas, energia
src/shell.mjs      as membranas da cobertura, desenhadas em facetas (rodam também na página)
src/kit.mjs        carrega o kit Anatomy, o idioma e o tema
src/parts.mjs      as peças comuns (caixas, cilindros, peças torneadas, flanges, tubos) que registram a forma real para a auditoria
src/farm.mjs       Fig 1: a geometria e a animação do tanque da fazenda
src/lab.mjs        Fig 2: a geometria e a animação do reator de bancada
src/topics.mjs     as peças que se pode apontar em cada figura, e o que cada uma faz (EN e PT)
src/build.mjs      a página larga, o painel, o gráfico e o relógio comum; confere o modelo e gera site/
vendor/anatomy/    o kit de desenho isométrico Anatomy (MIT), copiado da versão em VERSION
.github/workflows/ o deploy no GitHub Pages: gera, audita e publica a cada push na main
```

A auditoria (`--audit`) roda nas duas figuras e confere, a partir das formas reais, que nenhum tubo atravessa nada, que todo flange assenta numa face, que nada flutua e que tudo é desenhado na ordem certa de profundidade. Se ela falhar, o GitHub Actions não publica.

## Créditos

- Desenho: [Anatomy](https://github.com/wheresryan22/anatomy), de Ryan, licença MIT (`vendor/anatomy/LICENSE`).
- Parâmetros do substrato: CP2b / [PILAR-2b](https://cp2b.unicamp.br/pilar2b/pt-BR), NIPE-UNICAMP.
- Chen, Y. R.; Hashimoto, A. G. (1978). Kinetics of methane fermentation. *Biotechnology and Bioengineering Symposium* 8, 269–282.
- Hashimoto, A. G. (1982). Methane from cattle waste: effects of temperature, hydraulic retention time, and influent substrate concentration on kinetic parameter (K). *Biotechnology and Bioengineering* 24(9), 2039–2052.

## Licença

MIT (`LICENSE`). O kit em `vendor/anatomy` tem a sua própria licença MIT (`vendor/anatomy/LICENSE`).
