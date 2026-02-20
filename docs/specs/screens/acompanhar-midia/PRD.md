# PRD - Tela Acompanhar Mídia (`/dashboard`)

## 1. Contexto funcional
Tela principal de entrada de obras. Combina busca externa + formulário de gravação local.

## 2. Fluxo principal (seleção por sugestão)
1. Usuário escolhe tipo de mídia.
2. Digita ao menos 2 caracteres na busca.
3. Sistema consulta provider do tipo selecionado.
4. Usuário seleciona sugestão.
5. Preenche status e, quando aplicável, progresso atual e dia de novos episódios/capítulos.
6. Clica em salvar.
7. Front envia `multipart/form-data` para `POST /api/MediaDex/criar`.
8. Em sucesso, exibe toast e recarrega a página.

## 3. Fluxo alternativo (cadastro manual)
1. Sem resultado na busca, usuário clica em `Não encontrou?`.
2. Preenche título, imagem opcional, totais e status.
3. Salva via mesmo endpoint.

## 4. Providers por tipo
- `ANIME`/`MANGA`: AniList GraphQL (direto do front).
- `MANHUA`: proxy backend `GET /api/MediaDex/mangadex/search`.
- `SERIE`: TVMaze REST (direto do front).
- `FILME`: Wikipedia API PT, com fallback EN (direto do front).

## 5. Campos e regras
- Campos enviados ao backend:
  - `Nome`
  - `TipoMidia` (label: Anime/Mangá/Manhua/Série/Filme)
  - `TotalCapitulos`
  - `CapituloAtual`
  - `Status`
  - `DiaNovoCapitulo`
  - `ImagemUpload` (arquivo opcional)
  - `imagemUrl` (URL opcional)
- Para filme:
  - `TotalCapitulos` default `1`.
  - `CapituloAtual` e `DiaNovoCapitulo` não aplicáveis.

## 6. Estados de UI
- Busca com debounce de 300ms.
- Exibição de dropdown de sugestões.
- Estado de gravação `isSaving` altera label do botão.

## 7. Critérios de aceite
- `AC-AM-001`: digitar >=2 caracteres retorna sugestões por tipo.
- `AC-AM-002`: cadastro manual funciona quando não há sugestão.
- `AC-AM-003`: obra salva aparece nas consultas de biblioteca.
- `AC-AM-004`: erro de API exibe toast de falha.
- `AC-AM-005`: filmes não exibem campos de capítulo/dia.

## 8. Referências front/back
- Front: `Client/financias-react/src/pages/AnimeTracker.jsx`
- Back: `Presentation/MediaDexController.cs`, `Application/Handlers/Media/CreateMediaCommandHandler.cs`
