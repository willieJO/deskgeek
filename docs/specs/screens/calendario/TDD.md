# TDD - Tela Calendário (`/calendariodex`)

## 1. Arquitetura técnica (atual)
- Componente React com `FullCalendar` (`dayGridMonth`).
- Dados vindos de endpoint interno já filtrado por status no backend.
- Front reaplica filtro para robustez.
- A tela permite escolher `usuario` para consultar calendario de outro usuario.
- Campo de busca consulta usuários com debounce para reduzir carga de requests.
- Busca renderiza avatar por usuário usando `fotoPerfilDisponivel` + endpoint de foto por `id`.
- Banner fixo de contexto sinaliza claramente quando a visualização está em calendário de terceiro.
- Clique em evento do calendário próprio abre modal de edição rápida da mídia.

## 2. Dependências e relações de arquivo
## Front-end
- `Client/financias-react/src/main.jsx`
- `Client/financias-react/src/pages/CalendarioDex.jsx`
- `Client/financias-react/src/pages/calendario.css`
- `Client/financias-react/src/utils/api.js`

## Back-end
- `Presentation/UsuarioController.cs`
- `Repository/UsuarioRepository.cs`
- `Presentation/MediaDexController.cs`
- `Application/Queries/MediaDexByIdQuery.cs`
- `Application/Handlers/Media/MediaDexByIdQueryHandler.cs`
- `Application/Queries/MediaDexEmAndamentoQuery.cs`
- `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`
- `Repository/MediaRepository.cs`

## 3. Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/CalendarioDex.jsx`: carrega obras em andamento (usuario logado ou `usuario` informado), transforma em eventos, renderiza FullCalendar e autocomplete.
- `Client/financias-react/src/pages/CalendarioDex.jsx`: abre modal de edição por clique, valida campos (`capituloAtual`, `urlMidia`) e persiste via `PUT /api/MediaDex/{id}`.
- `Client/financias-react/src/pages/calendario.css`: define estilo dos cards e elementos visuais do calendário e do banner de contexto.
- `Client/financias-react/src/utils/api.js`: request autenticada para endpoint de calendário.
- `Client/financias-react/src/main.jsx`: injeta `currentUser` na tela de calendário para excluir o próprio usuário da busca e normalizar contexto.
- `Presentation/MediaDexController.cs`: endpoint que retorna mídias em andamento do usuario logado ou do `usuario` informado.
- `Presentation/MediaDexController.cs`: endpoint `GET /api/MediaDex/{id}` para recuperar detalhes editáveis da mídia do usuário logado.
- `Presentation/UsuarioController.cs`: endpoint de busca de usuários filtrados e endpoint de foto por `id`.
- `Application/Handlers/Media/MediaDexByIdQueryHandler.cs`: carrega mídia por `id` respeitando `UserId` do usuário autenticado.
- `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`: resolve consulta de mídias em andamento.
- `Repository/MediaRepository.cs`: consulta EF filtrada por `UserId` e `Status`.
- `Repository/UsuarioRepository.cs`: projeta `fotoPerfilDisponivel` na busca de usuários.

## 4. Contrato técnico consumido
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento`
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario?usuario=...`
- `GET /api/MediaDex/{id}`
- `PUT /api/MediaDex/{id}`
- `GET /api/Usuario/buscar?termo=...&limite=...`
- `GET /api/Usuario/foto/{id}`
- Resposta esperada: array de DTO reduzido (sem `urlMidia`) com campos `id`, `nome`, `status`, `diaNovoCapitulo`, `imagemDirectory`, `imagemUrl`.
- Resposta de busca de usuário: `id`, `usuario`, `fotoPerfilDisponivel`.

## 5. Sequência técnica resumida
1. `useEffect` executa `fetchEventos`.
2. Campo de usuário usa debounce e consulta lista filtrada de usuários (exclui o próprio usuário logado).
3. Autocomplete exibe avatar por sugestão (foto por `id` ou fallback por inicial).
4. Request autenticada busca obras em andamento do usuario logado ou do `usuario` selecionado.
5. Em deep-link com `?usuario`, tela tenta resolver metadados por busca e faz match exato case-insensitive para mostrar avatar no banner.
6. Registros são mapeados para objetos de evento FullCalendar.
7. `useMemo` calcula agregados por dia e dia mais cheio.
8. `eventContent` customiza card visual com capa.
9. Banner fixo de contexto aparece quando a visualização é de terceiro e oferece ação de retorno para o calendário próprio.
10. `eventClick` no calendário próprio chama `GET /api/MediaDex/{id}`, abre modal e permite atualizar `status`, `capituloAtual` e `urlMidia`.
11. Salvar envia `PUT /api/MediaDex/{id}` em JSON com campos mínimos completos e recarrega os eventos.
12. No modo `?usuario` de terceiro, clique mantém somente leitura e não executa mutações.

## 6. Riscos e dívidas técnicas atuais
- Erro de carregamento só faz `console.error`, sem toast para usuário.
- Fallback fixo para quinta-feira pode mascarar dados inválidos de dia.
- Eventos não possuem horário, apenas recorrência semanal por dia.
- `PUT /api/MediaDex/{id}` ainda depende de campo `nome` obrigatório (payload do modal precisa sempre enviar `nome`).

## 7. Casos técnicos de teste recomendados
- `TC-CAL-001`: obra com dia válido aparece no índice correto.
- `TC-CAL-002`: dia com variação de acento é mapeado corretamente.
- `TC-CAL-003`: resposta sem imagem usa placeholder.
- `TC-CAL-004`: erro de API mantém tela estável sem crash.
- `TC-CAL-005`: endpoints de calendario nao retornam `urlMidia` (privacidade).
- `TC-CAL-006`: sugestões exibem avatar com fallback por inicial.
- `TC-CAL-007`: usuário logado não aparece no autocomplete.
- `TC-CAL-008`: banner de contexto é exibido para calendário de terceiro.
- `TC-CAL-009`: `?usuario` igual ao usuário logado retorna automaticamente para calendário próprio.
- `TC-CAL-010`: clique em evento do calendário próprio abre modal com dados carregados por `GET /api/MediaDex/{id}`.
- `TC-CAL-011`: ação `Concluir` ajusta status para `Finalizado` e capítulo para total quando aplicável.
- `TC-CAL-012`: ação `Inativar` ajusta status para `Inativo` e remove item do calendário após refresh.
- `TC-CAL-013`: validação de URL inválida bloqueia salvar no front.
- `TC-CAL-014`: clique em evento no calendário de terceiro mostra aviso e não persiste alterações.
