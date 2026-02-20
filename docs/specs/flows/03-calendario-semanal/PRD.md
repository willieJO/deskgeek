# PRD - Fluxo 03: Calendario Semanal

## Objetivo
Exibir distribuicao semanal das obras em andamento com dia de lancamento definido.

## Escopo
- Tela `/calendariodex` com FullCalendar.
- Estatisticas de total ativo e dia mais cheio.

## Regras de produto
- `CAL-PRD-001`: somente obras em andamento entram no calendario.
- `CAL-PRD-002`: somente obras com `diaNovoCapitulo` definido viram evento.
- `CAL-PRD-003`: evento e recorrente por dia da semana.
- `CAL-PRD-004`: capa usa prioridade `imagemDirectory > imagemUrl > placeholder`.

## Fluxo principal
1. Usuario abre calendario.
2. Sistema consulta obras em andamento.
3. Dados sao transformados em eventos semanais.
4. Calendario e KPIs sao exibidos.

## Criterios de aceite
- `AC-CAL-001`: obras validas aparecem no dia correto.
- `AC-CAL-002`: total ativo corresponde ao numero de eventos.
- `AC-CAL-003`: ausencia de imagem nao quebra interface.
