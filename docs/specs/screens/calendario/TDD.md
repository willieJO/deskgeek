# TDD - Tela Calendário (`/calendariodex`)

## 1. Arquitetura técnica (atual)
- Componente React com `FullCalendar` (`dayGridMonth`).
- Dados vindos de endpoint interno já filtrado por status no backend.
- Front reaplica filtro para robustez.
- A tela permite escolher `usuario` para consultar calendario de outro usuario.
- Campo de busca consulta usuários com debounce para reduzir carga de requests.

## 2. Dependências e relações de arquivo
## Front-end
- `Client/financias-react/src/pages/CalendarioDex.jsx`
- `Client/financias-react/src/pages/calendario.css`
- `Client/financias-react/src/utils/api.js`

## Back-end
- `Presentation/MediaDexController.cs`
- `Application/Queries/MediaDexEmAndamentoQuery.cs`
- `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`
- `Repository/MediaRepository.cs`

## 3. Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/CalendarioDex.jsx`: carrega obras em andamento (usuario logado ou `usuario` informado), transforma em eventos, renderiza FullCalendar e autocomplete.
- `Client/financias-react/src/pages/calendario.css`: define estilo dos cards e elementos visuais do calendário.
- `Client/financias-react/src/utils/api.js`: request autenticada para endpoint de calendário.
- `Presentation/MediaDexController.cs`: endpoint que retorna mídias em andamento do usuario logado ou do `usuario` informado.
- `Presentation/UsuarioController.cs`: endpoint de busca de usuários filtrados.
- `Application/Handlers/Media/MediaDexEmAndamentoQueryHandler.cs`: resolve consulta de mídias em andamento.
- `Repository/MediaRepository.cs`: consulta EF filtrada por `UserId` e `Status`.

## 4. Contrato técnico consumido
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento`
- `GET /api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario?usuario=...`
- `GET /api/Usuario/buscar?termo=...&limite=...`
- Resposta esperada: array de `MediaDex` com campos `id`, `nome`, `status`, `diaNovoCapitulo`, `imagemDirectory`, `imagemUrl`.

## 5. Sequência técnica resumida
1. `useEffect` executa `fetchEventos`.
2. Campo de usuário usa debounce e consulta lista filtrada de usuários.
3. Request autenticada busca obras em andamento do usuario logado ou do `usuario` selecionado.
4. Registros são mapeados para objetos de evento FullCalendar.
5. `useMemo` calcula agregados por dia e dia mais cheio.
6. `eventContent` customiza card visual com capa.

## 6. Riscos e dívidas técnicas atuais
- Erro de carregamento só faz `console.error`, sem toast para usuário.
- Fallback fixo para quinta-feira pode mascarar dados inválidos de dia.
- Eventos não possuem horário, apenas recorrência semanal por dia.

## 7. Casos técnicos de teste recomendados
- `TC-CAL-001`: obra com dia válido aparece no índice correto.
- `TC-CAL-002`: dia com variação de acento é mapeado corretamente.
- `TC-CAL-003`: resposta sem imagem usa placeholder.
- `TC-CAL-004`: erro de API mantém tela estável sem crash.
