# TDD - Fluxo 03: Calendario Semanal

## Arquitetura tecnica
- Front: `CalendarioDex.jsx` + `FullCalendar`.
- Back: endpoint dedicado para obras em andamento.
- Transformacao de dia textual para `daysOfWeek` no front.
- Regra de progressao esperada semanal centralizada em servico de aplicacao (`IMediaProgressionService`).
- Recorrencia finita para obras com `TotalCapitulos` via `startRecur/endRecur`.

## Contratos usados
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento`
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario?usuario=...`
- `GET /api/Usuario/buscar?termo=...&limite=...`
- `GET /api/Usuario/foto/{id}`
- Observacao: endpoints de calendario usam contrato reduzido sem `urlMidia` (privacidade).
- Observacao: busca de usuario retorna `id`, `usuario`, `fotoPerfilDisponivel`.
- Contrato de calendario adiciona `capituloEsperadoAtual`, `dataInicioRecorrencia` e `dataFimRecorrenciaExclusiva`.

## Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/CalendarioDex.jsx`: consulta, transforma e renderiza eventos; permite filtrar por `usuario` com autocomplete + avatar + banner de contexto.
- `Client/financias-react/src/pages/calendario.css`: estilo visual dos cards/eventos e do banner de contexto.
- `Presentation/MediaDexController.cs`: endpoint de calendario.
- `Application/Services/MediaProgressionService.cs`: calcula capitulo esperado atual, janela de recorrencia e fim de calendario.
- `Presentation/UsuarioController.cs`: busca de usuarios e foto por `id`.
- `Repository/UsuarioRepository.cs`: projecao de `fotoPerfilDisponivel` na busca.
- `Application/Queries/MediaDexEmAndamentoQuery.cs`: query de obras ativas.
- `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`: orquestracao da consulta.
- `Repository/MediaRepository.cs`: filtro por `UserId` e status `Em andamento`.
- `Domain/MediaDex.cs`: campos persistidos `CapituloEsperadoBase` e `CapituloEsperadoReferenciaUtc`.
- `Migrations/*AddCapituloEsperadoMediaDex*`: evolucao de schema + bootstrap legado.

## Riscos tecnicos atuais
- Falha de API gera apenas `console.error` sem feedback via toast.
- Dia invalido cai em fallback fixo (quinta-feira).
- Mudancas futuras no modelo `MediaDex` nao devem expandir automaticamente o contrato do calendario (manter DTO reduzido).
- Mudancas de timezone devem preservar comportamento oficial em `America/Sao_Paulo`.

## Testes recomendados
- Mapeamento correto de dias com e sem acento.
- Renderizacao com imagem local, URL e placeholder.
- Tolerancia a erro de API sem crash.
- Garantir ausencia de `urlMidia` no payload de calendario.
- Garantir avatar e fallback na lista de sugestoes de usuario.
- Garantir exclusao do usuario logado no autocomplete.
- Garantir banner de contexto ao visualizar calendario de terceiro.
- Garantir fallback para calendario proprio quando `?usuario` corresponde ao usuario logado.
- Garantir incremento semanal deterministico com `TimeProvider` fixo.
- Garantir clamp de esperado por `TotalCapitulos`.
- Garantir que item com total atingido nao apareca no calendario.
- Garantir calculo correto de `endRecur` quando total ainda pendente.
