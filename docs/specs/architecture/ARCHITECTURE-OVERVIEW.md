# Architecture Overview (estado atual)

## Frontend
- Stack: React + Vite.
- Roteamento: `react-router-dom` em `Client/financias-react/src/main.jsx`.
- HTTP client: `Client/financias-react/src/utils/api.js` (Axios + `withCredentials`).
- Layout autenticado: `Client/financias-react/src/components/AuthenticatedLayout.jsx`.
- Tela de configurações/perfil: `Client/financias-react/src/pages/Configuracoes.jsx`.

## Backend
- ASP.NET Core + Controllers + MediatR.
- Validacao: FluentValidation via pipeline behavior.
- Persistencia: EF Core (`AppDbContext`) + repositorios.
- Auth: JWT em cookie `AuthToken` (lido por middleware/JwtBearer).
- Perfil do usuário: endpoints dedicados em `UsuarioController` para nome, senha e foto.

## Modulos relevantes
- `Presentation`: controllers HTTP.
- `Application`: commands/queries/handlers/validators.
- `Repository`: acesso a dados.
- `Domain`: entidades.
- `Shared`: utilitarios (ex: hash de senha, upload).

## Decisoes tecnicas vigentes
- Sessao por cookie HttpOnly em vez de token no front.
- `GET /api/Usuario/me` e a fonte de verdade da sessão no front (inclui `usuario` e flag de foto).
- Alteracoes de perfil usam endpoints separados (`/me/nome`, `/me/senha`, `/me/foto`) para reduzir overwrite acidental.
- Foto de perfil reutiliza `UploadService` e a mesma infraestrutura de storage de imagens do `MediaDex`.
- Contratos de media aceitam JSON e multipart para edicao.
- Integracao externa distribuida entre front (AniList/TVMaze/Wikipedia) e back proxy (MangaDex).
- `MediaDex` possui `urlMidia` opcional para uso pessoal (assistir/ler).
- Endpoints de calendario usam contrato reduzido sem `urlMidia` para evitar exposicao em consultas por username.
- Progressao esperada semanal de `MediaDex` e calculada dinamicamente no backend (sem job), com referencia em `America/Sao_Paulo`.
- Calendario usa recorrencia com janela (`startRecur/endRecur`) para evitar eventos infinitos quando `TotalCapitulos` e conhecido.

## Stack de testes backend
- Framework: xUnit
- Projeto: `tests/deskgeek.Backend.Tests`
- Execucao local: `run-backend-tests.bat` ou `./run-backend-tests.sh`
- CI: `.github/workflows/tests-backend.yml`

## Principais dividas tecnicas observadas
- Inconsistencia entre cookie auth e uso residual de `localStorage token` em alguns requests.
- Campos de progresso de media modelados como `string` no dominio.
- Endpoint de delete de media sem validacao explicita de ownership por usuario no controller.
- `UsuarioController` ainda possui endpoint legado `PUT /api/Usuario/{id}` (nao orientado ao usuário logado).
