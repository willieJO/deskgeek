# TDD - Fluxo 03: Calendario Semanal

## Arquitetura tecnica
- Front: `CalendarioDex.jsx` + `FullCalendar`.
- Back: endpoint dedicado para obras em andamento.
- Transformacao de dia textual para `daysOfWeek` no front.

## Contratos usados
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento`
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario?usuario=...`
- `GET /api/Usuario/buscar?termo=...&limite=...`

## Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/CalendarioDex.jsx`: consulta, transforma e renderiza eventos; permite filtrar por `usuario` com autocomplete.
- `Client/financias-react/src/pages/calendario.css`: estilo visual dos cards/eventos.
- `Presentation/MediaDexController.cs`: endpoint de calendario.
- `Application/Queries/MediaDexEmAndamentoQuery.cs`: query de obras ativas.
- `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`: orquestracao da consulta.
- `Repository/MediaRepository.cs`: filtro por `UserId` e status `Em andamento`.

## Riscos tecnicos atuais
- Falha de API gera apenas `console.error` sem feedback via toast.
- Dia invalido cai em fallback fixo (quinta-feira).

## Testes recomendados
- Mapeamento correto de dias com e sem acento.
- Renderizacao com imagem local, URL e placeholder.
- Tolerancia a erro de API sem crash.
