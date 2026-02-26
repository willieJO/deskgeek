# TDD - Tela Calendário (`/calendariodex`)

## 1. Arquitetura técnica (atual)
- Componente React com `FullCalendar` (`dayGridMonth`).
- Dados vindos de endpoint interno já filtrado por status no backend.
- Front reaplica filtro para robustez.
- A tela permite escolher `usuario` para consultar calendario de outro usuario.
- Campo de busca consulta usuários com debounce para reduzir carga de requests.
- Busca renderiza avatar por usuário usando `fotoPerfilDisponivel` + endpoint de foto por `id`.
- Banner fixo de contexto sinaliza claramente quando a visualização está em calendário de terceiro.

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
- `Application/Queries/MediaDexEmAndamentoQuery.cs`
- `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`
- `Repository/MediaRepository.cs`

## 3. Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/CalendarioDex.jsx`: carrega obras em andamento (usuario logado ou `usuario` informado), transforma em eventos, renderiza FullCalendar e autocomplete.
- `Client/financias-react/src/pages/calendario.css`: define estilo dos cards e elementos visuais do calendário e do banner de contexto.
- `Client/financias-react/src/utils/api.js`: request autenticada para endpoint de calendário.
- `Client/financias-react/src/main.jsx`: injeta `currentUser` na tela de calendário para excluir o próprio usuário da busca e normalizar contexto.
- `Presentation/MediaDexController.cs`: endpoint que retorna mídias em andamento do usuario logado ou do `usuario` informado.
- `Presentation/UsuarioController.cs`: endpoint de busca de usuários filtrados e endpoint de foto por `id`.
- `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`: resolve consulta de mídias em andamento.
- `Repository/MediaRepository.cs`: consulta EF filtrada por `UserId` e `Status`.
- `Repository/UsuarioRepository.cs`: projeta `fotoPerfilDisponivel` na busca de usuários.

## 4. Contrato técnico consumido
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento`
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario?usuario=...`
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

## 6. Riscos e dívidas técnicas atuais
- Erro de carregamento só faz `console.error`, sem toast para usuário.
- Fallback fixo para quinta-feira pode mascarar dados inválidos de dia.
- Eventos não possuem horário, apenas recorrência semanal por dia.

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
