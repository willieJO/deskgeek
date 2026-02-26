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
- `CAL-PRD-007`: sugestoes de usuario devem exibir avatar (foto quando disponivel, fallback por inicial).
- `CAL-PRD-008`: tela deve exibir banner explícito ao visualizar calendario de terceiro.
- `CAL-PRD-009`: usuario logado nao deve aparecer nas sugestoes de busca.
- `CAL-PRD-010`: se `usuario` informado for o proprio usuario logado, o sistema deve carregar o calendario proprio.

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
- `AC-CAL-006`: cada sugestao de usuario apresenta avatar corretamente.
- `AC-CAL-007`: banner de contexto indica claramente quando o calendario exibido e de terceiro.
- `AC-CAL-008`: usuario logado nao aparece nas sugestoes.
- `AC-CAL-009`: informar o proprio usuario (incluindo variacao de caixa) retorna para o calendario proprio.
