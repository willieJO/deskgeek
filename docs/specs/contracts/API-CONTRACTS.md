# API Contracts (estado atual)

Base route de controllers:
- `api/Usuario`
- `api/MediaDex`

## Usuario
### POST `/api/Usuario/register`
Body:
```json
{
  "usuario": "string",
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
Sucesso: `200` com `{ success, id, email, usuario, fotoPerfilDisponivel }`.

### PUT `/api/Usuario/me/nome` (Authorize)
Body:
```json
{
  "usuario": "string"
}
```
Sucesso: `200` com `{ "success": true, "id": "guid", "usuario": "string" }`.
Falha: `400` com `{ "success": false, "message": "..." }`.

### PUT `/api/Usuario/me/senha` (Authorize)
Body:
```json
{
  "senhaAtual": "string",
  "novaSenha": "string"
}
```
Sucesso: `200` com `{ "success": true, "message": "Senha atualizada com sucesso." }`.
Falha (senha atual invalida/validacao): `400` com `{ "success": false, "message": "..." }`.

### PUT `/api/Usuario/me/foto` (Authorize, multipart/form-data)
Campos aceitos:
- `foto` (arquivo)
Sucesso: `200` com `{ "success": true, "message": "Foto de perfil atualizada com sucesso." }`.
Falha: `400` com `{ "success": false, "message": "..." }`.

### GET `/api/Usuario/me/foto` (Authorize)
Retorna binário da foto de perfil do usuário autenticado.
Se não houver foto cadastrada, retorna `404`.

### GET `/api/Usuario/foto/{id}` (Authorize)
Retorna binário da foto de perfil do usuário informado por `id`.
Se não houver foto cadastrada, retorna `404`.
Se o usuário não existir, retorna `404` com payload de erro.

### POST `/api/Usuario/logout`
Sucesso: `200` com `{ success: true }`.

### GET `/api/Usuario/buscar?termo=...&limite=...` (Authorize)
Retorna lista otimizada de usuários filtrados por prefixo, com campos `id`, `usuario` e `fotoPerfilDisponivel`.

## MediaDex
### GET `/api/MediaDex/obterMediaPorUsuario` (Authorize)
Retorna lista de `MediaDex` do usuario logado.
Inclui campo opcional `urlMidia` (URL pessoal para assistir/ler).

### GET `/api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento` (Authorize)
Retorna lista de `MediaDex` com status em andamento do usuario.

### GET `/api/MediaDex/obterMediaPorUsuarioPorStatusEmAndamentoPorUsuario?usuario=...` (Authorize)
Retorna lista de `MediaDex` com status em andamento do usuario informado por username.

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
- `urlMidia` (opcional, URL pessoal para assistir/ler)

### PUT `/api/MediaDex/{id}` (Authorize)
Aceita:
- `multipart/form-data` (upload + campos)
- `application/json` (edicao sem upload)
- Campo opcional `urlMidia` em ambos os formatos.

### DELETE `/api/MediaDex/{id}` (Authorize)
Remove registro por ID.

### GET `/api/MediaDex/imagem/{nomeArquivo}`
Retorna imagem da infraestrutura de storage.

### GET `/api/MediaDex/mangadex/search?title=...`
Proxy de busca MangaDex.

### GET `/api/MediaDex/mangadex/cover/{mangaId}/{fileName}`
Proxy de capa MangaDex.

## Observacao de privacidade (MediaDex)
- O campo `urlMidia` e retornado apenas em `GET /api/MediaDex/obterMediaPorUsuario` (dono da conta).
- Endpoints de calendario (`obterMediaPorUsuarioPorStatusEmAndamento*`) usam contrato reduzido e nao retornam `urlMidia`.
