# PRD - Tela Calendário (`/calendariodex`)

## 1. Contexto funcional
Calendário mensal com eventos recorrentes por dia da semana para obras ativas.

## 2. Fluxo principal
1. Tela monta.
2. Front chama `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento` para o usuario logado.
3. Ao digitar no campo de busca, front consulta `GET /api/Usuario/buscar?termo=...` e recebe `id`, `usuario`, `fotoPerfilDisponivel`.
4. Opcionalmente, ao informar `usuario`, front chama `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario?usuario=...`.
5. Front aplica filtro defensivo (`status === "Em andamento"` e `diaNovoCapitulo != null`).
6. Converte obras em eventos do FullCalendar.
7. Renderiza cards de evento com imagem e título.
8. Quando estiver em `usuario` de terceiro, exibe banner fixo de contexto com avatar e CTA para voltar ao proprio calendario.
9. Ao clicar em um evento do proprio calendario, abre modal de edição rápida da mídia.

## 2.1 Privacidade de dados
- O calendário nao exibe nem consome `urlMidia` (link pessoal para assistir/ler), mesmo quando o campo existe na mídia.
- A mesma regra vale para consulta do calendário por `usuario`.

## 2.2 Edição por clique (calendário próprio)
- Clique no evento abre modal com detalhes da mídia (`GET /api/MediaDex/{id}`).
- Modal permite:
  - alterar `status`;
  - alterar `capituloAtual`;
  - alterar `urlMidia`;
  - ação rápida `Concluir` (status `Finalizado`, ajusta `capituloAtual = totalCapitulos` quando houver total);
  - ação rápida `Inativar` (status `Inativo`, mantendo `diaNovoCapitulo`).
- Salvar envia `PUT /api/MediaDex/{id}` com payload JSON completo mínimo.
- Ao salvar com sucesso, calendário recarrega e itens `Finalizado`/`Inativo` deixam de aparecer (filtro de em andamento).
- Em calendário de terceiro (`?usuario` diferente do logado), clique mantém modo somente leitura e exibe aviso.

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
- `AC-CAL-005`: ao informar `usuario` válido, a tela exibe o calendário do usuário selecionado.
- `AC-CAL-006`: ao digitar no campo de usuário, a tela exibe sugestões filtradas de usuários cadastrados.
- `AC-CAL-007`: respostas de calendário não expõem `urlMidia`.
- `AC-CAL-008`: sugestões de usuário exibem avatar (foto real quando disponível; fallback por inicial quando indisponível).
- `AC-CAL-009`: quando `?usuario` aponta para terceiro, a tela exibe banner explícito `Visualizando calendário de @usuario`.
- `AC-CAL-010`: usuário logado não aparece nas sugestões do autocomplete.
- `AC-CAL-011`: se `?usuario` for o próprio usuário logado (case-insensitive), a tela volta automaticamente para o calendário próprio.
- `AC-CAL-012`: clique em evento do calendário próprio abre modal de edição rápida.
- `AC-CAL-013`: ação `Concluir` no modal ajusta status para `Finalizado` e aplica regra de total quando houver.
- `AC-CAL-014`: ação `Inativar` no modal ajusta status para `Inativo` sem limpar dia de lançamento.
- `AC-CAL-015`: alteração de `urlMidia` e `capituloAtual` pelo modal persiste via API e reflete na aplicação.
- `AC-CAL-016`: em calendário de terceiro, clique no evento não permite mutação.

## 6. Referências front/back
- Front: `Client/financias-react/src/pages/CalendarioDex.jsx`, `Client/financias-react/src/pages/calendario.css`
- Back: `Presentation/MediaDexController.cs`, `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`
