# API Contracts (estado atual)

Base route de controllers:
- `api/Usuario`
- `api/MediaDex`

## Usuario
### POST `/api/Usuario/register`
Body:
```json
{
  "nome": "string",
  "email": "string",
  "senha": "string"
}
```
Sucesso: `200` com `{ "id": "guid" }`.
Erro de validacao: `400` com lista de `{ field, message }`.

### POST `/api/Usuario/login`
Body:
```json
{
  "email": "string",
  "password": "string"
}
```
Sucesso: `200` com `{ "success": true, "message": "..." }` e cookie `AuthToken`.
Falha: `400` com `{ "success": false, "message": "..." }`.

### GET `/api/Usuario/me` (Authorize)
Sucesso: `200` com `{ success, id, email }`.

### POST `/api/Usuario/logout`
Sucesso: `200` com `{ success: true }`.

## MediaDex
### GET `/api/MediaDex/obterMediaPorUsuario` (Authorize)
Retorna lista de `MediaDex` do usuario logado.

### GET `/api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento` (Authorize)
Retorna lista de `MediaDex` com status em andamento do usuario.

### POST `/api/MediaDex/criar` (Authorize, multipart/form-data)
Campos aceitos:
- `Nome`
- `TipoMidia`
- `TotalCapitulos`
- `CapituloAtual`
- `Status`
- `DiaNovoCapitulo`
- `ImagemUpload`
- `ImagemDirectory`
- `imagemUrl`

### PUT `/api/MediaDex/{id}` (Authorize)
Aceita:
- `multipart/form-data` (upload + campos)
- `application/json` (edicao sem upload)

### DELETE `/api/MediaDex/{id}` (Authorize)
Remove registro por ID.

### GET `/api/MediaDex/imagem/{nomeArquivo}`
Retorna imagem da infraestrutura de storage.

### GET `/api/MediaDex/mangadex/search?title=...`
Proxy de busca MangaDex.

### GET `/api/MediaDex/mangadex/cover/{mangaId}/{fileName}`
Proxy de capa MangaDex.
