# TDD - Fluxo 02: Cadastro e Gestao de Midia

## Arquitetura tecnica
- Entrada de dados em `AnimeTracker.jsx`.
- Gestao tabular em `TabelaDex.jsx`.
- Persistencia via `MediaDexController` + MediatR + `MediaRepository`.

## Contratos usados
- `GET /api/MediaDex/obterMediaPorUsuario`
- `GET /api/MediaDex/mangadex/search`
- `GET /api/MediaDex/mangadex/cover/{mangaId}/{fileName}`
- `POST /api/MediaDex/criar` (multipart)
- `PUT /api/MediaDex/{id}` (json ou multipart)
- `DELETE /api/MediaDex/{id}`

## Integracoes externas do fluxo
- AniList GraphQL (anime/manga)
- TVMaze API (serie)
- Wikipedia API PT/EN (filme)
- MangaDex via proxy no backend (manhua)

## Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/AnimeTracker.jsx`: busca externa + criacao de obra.
- `Client/financias-react/src/pages/TabelaDex.jsx`: listagem, edicao e remocao.
- `Presentation/MediaDexController.cs`: endpoints de media e proxy MangaDex.
- `Application/Commands/CreateMediaCommand.cs`: contrato de criacao.
- `Application/Commands/EditMediaCommand.cs`: contrato de edicao.
- `Application/Handlers/Media/CreateMediaCommandHandler.cs`: criacao e upload.
- `Application/Handlers/Media/EditMediaCommandHandler.cs`: edicao e upload.
- `Repository/MediaRepository.cs`: CRUD de `MediaDex`.
- `Domain/MediaDex.cs`: modelo persistido.

## Riscos tecnicos atuais
- Campos numericos persistidos como `string` no dominio.
- `DELETE` nao verifica dono do registro no endpoint atual.
- A tela de criacao usa `window.location.reload()` apos salvar.

## Testes recomendados
- Criacao por sugestao e manual.
- Edicao com JSON e com multipart.
- Exclusao e recarregamento da lista.
- Tentativa de excluir registro de outro usuario (seguranca).
