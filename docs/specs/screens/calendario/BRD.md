# BRD - Tela Calendário (`/calendariodex`)

## 1. Objetivo de negócio
Oferecer visão temporal dos lançamentos recorrentes das obras em andamento para facilitar acompanhamento semanal.

## 2. Atores
- Usuário autenticado.
- API de mídia (`MediaDexController`).

## 3. Regras de negócio atuais
- `BRD-CAL-001`: apenas obras com `status = Em andamento` participam do calendário.
- `BRD-CAL-002`: somente obras com `diaNovoCapitulo` preenchido viram evento.
- `BRD-CAL-003`: cada obra vira evento recorrente semanal (`daysOfWeek`).
- `BRD-CAL-004`: imagem do evento prioriza `imagemDirectory`, depois `imagemUrl`, depois placeholder.
- `BRD-CAL-005`: tela exibe KPIs rápidos: total ativo e dia com maior concentração.

## 4. Valor de negócio
- Visibilidade semanal do que deve ser acompanhado.
- Organização de consumo por dia da semana.

## 5. Relações de arquivos necessários
## Front-end
- `Client/financias-react/src/pages/CalendarioDex.jsx`
- `Client/financias-react/src/pages/calendario.css`
- `Client/financias-react/src/utils/api.js`

## Back-end
- `Presentation/MediaDexController.cs` (`GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento`)
- `Application/Queries/MediaDexEmAndamentoQuery.cs`
- `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`
- `Repository/MediaRepository.cs`

## 6. Fora de escopo
- Notificações push por dia.
- Múltiplos horários no mesmo dia.
- Calendário compartilhado entre usuários.
