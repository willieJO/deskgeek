# TDD - Fluxo 03: Calendario Semanal

## Arquitetura tecnica
- Front: `CalendarioDex.jsx` + `FullCalendar`.
- Back: endpoint dedicado para obras em andamento.
- Transformacao de dia textual para `daysOfWeek` no front.

## Contratos usados
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento`
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario?usuario=...`
- `GET /api/Usuario/buscar?termo=...&limite=...`
- `GET /api/Usuario/foto/{id}`
- Observacao: endpoints de calendario usam contrato reduzido sem `urlMidia` (privacidade).
- Observacao: busca de usuario retorna `id`, `usuario`, `fotoPerfilDisponivel`.

## Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/CalendarioDex.jsx`: consulta, transforma e renderiza eventos; permite filtrar por `usuario` com autocomplete + avatar + banner de contexto.
- `Client/financias-react/src/pages/calendario.css`: estilo visual dos cards/eventos e do banner de contexto.
- `Presentation/MediaDexController.cs`: endpoint de calendario.
- `Presentation/UsuarioController.cs`: busca de usuarios e foto por `id`.
- `Repository/UsuarioRepository.cs`: projecao de `fotoPerfilDisponivel` na busca.
- `Application/Queries/MediaDexEmAndamentoQuery.cs`: query de obras ativas.
- `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`: orquestracao da consulta.
- `Repository/MediaRepository.cs`: filtro por `UserId` e status `Em andamento`.

## Riscos tecnicos atuais
- Falha de API gera apenas `console.error` sem feedback via toast.
- Dia invalido cai em fallback fixo (quinta-feira).
- Mudancas futuras no modelo `MediaDex` nao devem expandir automaticamente o contrato do calendario (manter DTO reduzido).

## Testes recomendados
- Mapeamento correto de dias com e sem acento.
- Renderizacao com imagem local, URL e placeholder.
- Tolerancia a erro de API sem crash.
- Garantir ausencia de `urlMidia` no payload de calendario.
- Garantir avatar e fallback na lista de sugestoes de usuario.
- Garantir exclusao do usuario logado no autocomplete.
- Garantir banner de contexto ao visualizar calendario de terceiro.
- Garantir fallback para calendario proprio quando `?usuario` corresponde ao usuario logado.
