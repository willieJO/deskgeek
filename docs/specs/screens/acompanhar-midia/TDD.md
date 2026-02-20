# TDD - Tela Acompanhar Mídia (`/dashboard`)

## 1. Arquitetura técnica (atual)
- Componente único: `AnimeTracker.jsx`.
- Busca híbrida com múltiplos providers externos + API interna.
- Persistência final sempre na API própria (`/api/MediaDex/criar`).

## 2. Dependências e relações de arquivo
## Front-end
- `Client/financias-react/src/pages/AnimeTracker.jsx`
- `Client/financias-react/src/utils/api.js`
- `Client/financias-react/src/main.jsx`

## Back-end (persistência)
- `Presentation/MediaDexController.cs` (`HttpPost("criar")`)
- `Application/Commands/CreateMediaCommand.cs`
- `Application/Validators/CreateMediaCommandValidator.cs`
- `Application/Handlers/Media/CreateMediaCommandHandler.cs`
- `Repository/MediaRepository.cs`
- `Domain/MediaDex.cs`

## Back-end (proxy MangaDex)
- `Presentation/MediaDexController.cs` (`mangadex/search`, `mangadex/cover/{mangaId}/{fileName}`)

## 3. Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/AnimeTracker.jsx`: orquestra busca externa, seleção e envio de cadastro.
- `Client/financias-react/src/utils/api.js`: cliente HTTP com credenciais/cookies para backend.
- `Presentation/MediaDexController.cs`: cria mídia e fornece proxy para busca/capa MangaDex.
- `Application/Handlers/Media/CreateMediaCommandHandler.cs`: mapeia comando para domínio e salva mídia.
- `Application/Validators/CreateMediaCommandValidator.cs`: valida obrigatoriedade de `Nome`.
- `Repository/MediaRepository.cs`: persiste registros no `DbSet<MediaDex>`.
- `Domain/MediaDex.cs`: define estrutura persistida da mídia.

## 4. Integrações externas (front)
- AniList GraphQL: `https://graphql.anilist.co`.
- TVMaze: `https://api.tvmaze.com`.
- Wikipedia PT/EN APIs.
- MangaDex Search/Cover via backend proxy para evitar CORS/encapsular origem.

## 5. Contrato técnico de persistência
- Método: `POST /api/MediaDex/criar`
- Content-Type: `multipart/form-data`
- Campos usados:
  - `Nome` (obrigatório pelo validator)
  - `TipoMidia`
  - `TotalCapitulos`
  - `CapituloAtual`
  - `Status`
  - `DiaNovoCapitulo`
  - `ImagemUpload` (arquivo)
  - `imagemUrl` (texto)

## 6. Sequência técnica resumida
1. Usuário define tipo + termo.
2. Debounce dispara função de provider correspondente.
3. Resultado selecionado preenche estado local.
4. `handleEnviar` normaliza payload e monta `FormData`.
5. Backend associa `Userid` pelo claim JWT e persiste com EF Core.
6. Upload de imagem, quando presente, passa por `UploadService`.

## 7. Riscos e dívidas técnicas atuais
- Tela recarrega com `window.location.reload()` após salvar (impacta UX).
- `TotalCapitulos`, `CapituloAtual` e `DiaNovoCapitulo` são `string` no domínio, sem tipagem forte.
- Fallback para filme força total `1`; não há validação semântica no backend.
- Validator de criação exige apenas nome; demais regras ficam no front.

## 8. Casos técnicos de teste recomendados
- `TC-AM-001`: salvar mídia com seleção de sugestão externa.
- `TC-AM-002`: salvar mídia manual com upload de imagem.
- `TC-AM-003`: salvar filme sem capítulo/dia.
- `TC-AM-004`: validar associação do `UserId` pelo token.
- `TC-AM-005`: falha de provider externo não deve quebrar UI.
