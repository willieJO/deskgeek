# PRD - Fluxo 03: Calendario Semanal

## Objetivo
Exibir distribuicao semanal das obras em andamento com dia de lancamento definido.

## Escopo
- Tela `/calendariodex` com FullCalendar.
- Estatisticas de total ativo e dia mais cheio.
- Visualizacao do calendario de outro usuario por `usuario`.

## Regras de produto
- `CAL-PRD-001`: somente obras em andamento entram no calendario.
- `CAL-PRD-002`: somente obras com `diaNovoCapitulo` definido viram evento.
- `CAL-PRD-003`: evento e recorrente por dia da semana.
- `CAL-PRD-004`: capa usa prioridade `imagemDirectory > imagemUrl > placeholder`.
- `CAL-PRD-005`: usuario pode informar um `usuario` para visualizar o calendario de outra pessoa.
- `CAL-PRD-006`: busca de usuario deve sugerir resultados filtrados em tempo real.

## Fluxo principal
1. Usuario abre calendario.
2. Sistema consulta obras em andamento do usuario logado (padrao) ou do `usuario` informado.
3. Dados sao transformados em eventos semanais.
4. Calendario e KPIs sao exibidos.

## Criterios de aceite
- `AC-CAL-001`: obras validas aparecem no dia correto.
- `AC-CAL-002`: total ativo corresponde ao numero de eventos.
- `AC-CAL-003`: ausencia de imagem nao quebra interface.
- `AC-CAL-004`: informar `usuario` valido exibe o calendario da pessoa selecionada.
- `AC-CAL-005`: digitar no campo de usuario retorna sugestões filtradas de forma performática.
