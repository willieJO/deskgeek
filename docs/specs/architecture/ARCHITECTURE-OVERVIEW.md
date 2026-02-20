# Architecture Overview (estado atual)

## Frontend
- Stack: React + Vite.
- Roteamento: `react-router-dom` em `Client/financias-react/src/main.jsx`.
- HTTP client: `Client/financias-react/src/utils/api.js` (Axios + `withCredentials`).
- Layout autenticado: `Client/financias-react/src/components/AuthenticatedLayout.jsx`.

## Backend
- ASP.NET Core + Controllers + MediatR.
- Validacao: FluentValidation via pipeline behavior.
- Persistencia: EF Core (`AppDbContext`) + repositorios.
- Auth: JWT em cookie `AuthToken` (lido por middleware/JwtBearer).

## Modulos relevantes
- `Presentation`: controllers HTTP.
- `Application`: commands/queries/handlers/validators.
- `Repository`: acesso a dados.
- `Domain`: entidades.
- `Shared`: utilitarios (ex: hash de senha, upload).

## Decisoes tecnicas vigentes
- Sessao por cookie HttpOnly em vez de token no front.
- Contratos de media aceitam JSON e multipart para edicao.
- Integracao externa distribuida entre front (AniList/TVMaze/Wikipedia) e back proxy (MangaDex).

## Principais dividas tecnicas observadas
- Inconsistencia entre cookie auth e uso residual de `localStorage token` em alguns requests.
- Campos de progresso de media modelados como `string` no dominio.
- Endpoint de delete de media sem validacao explicita de ownership por usuario no controller.
