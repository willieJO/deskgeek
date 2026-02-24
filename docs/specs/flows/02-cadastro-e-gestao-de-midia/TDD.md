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
- `Application/DTOs/MediaDexCalendarioItemDto.cs`: contrato reduzido de calendario sem `urlMidia`.
- `Repository/MediaRepository.cs`: CRUD de `MediaDex`.
- `Domain/MediaDex.cs`: modelo persistido.
- `Migrations/*AddUrlMidiaMediaDex*`: evolucao de schema para novo campo opcional.

## Riscos tecnicos atuais
- Campos numericos persistidos como `string` no dominio.
- `DELETE` nao verifica dono do registro no endpoint atual.
- A tela de criacao usa `window.location.reload()` apos salvar.
- `urlMidia` e um dado pessoal do usuario e nao deve ser reutilizado em endpoints de calendario compartilhado.

## Testes recomendados
- Criacao por sugestao e manual.
- Edicao com JSON e com multipart.
- Criacao/edicao com `urlMidia` valida e sem `urlMidia`.
- Rejeicao de `urlMidia` invalida (backend).
- Exclusao e recarregamento da lista.
- Tentativa de excluir registro de outro usuario (seguranca).

## Campos tecnicos de persistencia (atualizado)
- `POST /api/MediaDex/criar` e `PUT /api/MediaDex/{id}` aceitam `urlMidia` opcional.
- Validacao backend: se preenchido, `urlMidia` deve ser URL absoluta `http/https` (max 2048).
- Endpoints de calendario retornam DTO reduzido sem `urlMidia` por privacidade.
