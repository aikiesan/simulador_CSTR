# Simulador CSTR

Um biodigestor de mistura completa (CSTR) cortado ao meio, animado e interativo, para entender como ele funciona por dentro.

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

## O que se mexe

O tempo da planta corre cerca de 10 minutos por segundo (dá para mudar no painel ou com ← →):

- a bomba alimenta oito vezes por dia e o extravasor deixa sair o mesmo volume; os tubos com tracejado são os que estão escoando;
- o agitador roda 15 min por hora; desligado (tecla M ou painel), forma crosta e sedimento;
- o aquecimento liga e desliga para segurar a temperatura (as serpentinas acendem);
- a membrana de gás sobe com o gás armazenado; o motor de 50 kW liga com 70 % e para com 30 %;
- o flare acende quando o gasômetro enche.

O painel muda temperatura, TRH e ST da alimentação e mostra alimentação, vacas equivalentes, carga orgânica, fração do B₀, metano, biogás, potência elétrica e o TRH de lavagem. O gráfico mostra o metano em função do TRH, com as zonas de lavagem e de sobrecarga.

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
- dinâmica real: a planta responde em horas, um digestor real leva semanas;
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
src/model.mjs      o modelo: cinética, dimensões da planta, energia
src/shell.mjs      as membranas da cobertura, desenhadas em facetas (rodam também na página)
src/build.mjs      a geometria, a animação, o painel e o gráfico; gera site/
vendor/anatomy/    o kit de desenho isométrico Anatomy (MIT), copiado da versão em VERSION
.github/workflows/ o deploy no GitHub Pages: gera, audita e publica a cada push na main
```

A auditoria (`--audit`) confere, a partir das formas reais, que nenhum tubo atravessa nada, que todo flange assenta numa face, que nada flutua e que tudo é desenhado na ordem certa de profundidade. Se ela falhar, o GitHub Actions não publica.

## Créditos

- Desenho: [Anatomy](https://github.com/wheresryan22/anatomy), de Ryan, licença MIT (`vendor/anatomy/LICENSE`).
- Parâmetros do substrato: CP2b / [PILAR-2b](https://cp2b.unicamp.br/pilar2b/pt-BR), NIPE-UNICAMP.
- Chen, Y. R.; Hashimoto, A. G. (1978). Kinetics of methane fermentation. *Biotechnology and Bioengineering Symposium* 8, 269–282.
- Hashimoto, A. G. (1982). Methane from cattle waste: effects of temperature, hydraulic retention time, and influent substrate concentration on kinetic parameter (K). *Biotechnology and Bioengineering* 24(9), 2039–2052.
