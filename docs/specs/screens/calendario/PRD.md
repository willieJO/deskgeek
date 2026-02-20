# PRD - Tela Calendário (`/calendariodex`)

## 1. Contexto funcional
Calendário mensal com eventos recorrentes por dia da semana para obras ativas.

## 2. Fluxo principal
1. Tela monta.
2. Front chama `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento`.
3. Front aplica filtro defensivo (`status === "Em andamento"` e `diaNovoCapitulo != null`).
4. Converte obras em eventos do FullCalendar.
5. Renderiza cards de evento com imagem e título.

## 3. Regras de transformação
- `diaNovoCapitulo` textual é mapeado para índice semanal (`0` a `6`).
- Variações com acento são suportadas (`terça/terca`, `sábado/sabado`).
- Dia desconhecido cai no fallback índice `4` (quinta-feira).

## 4. KPIs exibidos
- Total ativo (`eventos.length`).
- Dia mais cheio (maior contagem de eventos).
- Estado de atualização (`Carregando...`/`Atualizado`).

## 5. Critérios de aceite
- `AC-CAL-001`: carregar obras em andamento com dia definido.
- `AC-CAL-002`: cada obra aparece no dia correto no calendário.
- `AC-CAL-003`: imagem fallback funciona sem quebrar layout.
- `AC-CAL-004`: falha de API não quebra renderização da página.

## 6. Referências front/back
- Front: `Client/financias-react/src/pages/CalendarioDex.jsx`, `Client/financias-react/src/pages/calendario.css`
- Back: `Presentation/MediaDexController.cs`, `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`
