# MediaDex (DeskGeek)

Aplicação full-stack para organizar e acompanhar obras (Anime/Mangá/Manhua/Série/Filme), com:
- cadastro/login (JWT em cookie `AuthToken`);
- tabela para gerenciar status/progresso e imagem (upload ou URL);
- calendário semanal baseado no campo **DiaNovoCapitulo**;
- proxy de busca/capas do **MangaDex**.

## Estrutura do repositório
- Backend (ASP.NET Core / .NET 8): projeto `deskgeek.csproj` na raiz
- Frontend (React + Vite): `Client/financias-react`
- Documentação: `docs/specs`
- Testes de backend: `tests/deskgeek.Backend.Tests`

## Stack
**Backend**
- ASP.NET Core (Controllers) + MediatR
- FluentValidation (pipeline behavior)
- EF Core (SQL Server)
- AutoMapper
- Swagger (UI na raiz)

**Frontend**
- React + Vite
- Axios (`withCredentials`) para autenticação via cookie
- MUI + Tailwind

## Requisitos
- .NET SDK 8
- SQL Server (local ou remoto)
- Node.js (recomendado v20+)

## Como rodar (local)

### 1) Backend
1. Configure a string de conexão e storage (veja **Configuração** abaixo).
2. (Opcional) Aplique as migrations no banco:
   ```bash
   dotnet tool install --global dotnet-ef
   dotnet ef database update
   ```
3. Rode:
   ```bash
   dotnet restore desksaveanime.sln
   dotnet run --project deskgeek.csproj
   ```

Swagger fica disponível na URL impressa no terminal (por padrão, `http://localhost:5095/`).

### 2) Frontend
```bash
cd Client/financias-react
npm install
npm run dev
```

Abra `http://localhost:5173`.

## Configuração

### Backend (`appsettings.json` / variáveis de ambiente)
Configurações relevantes:
- `ConnectionStrings:DefaultConnection` (SQL Server)
- `StorageSettings`:
  - `Provider`: `Local` ou `Ssh`
  - `LocalBasePath`: caminho base local (ex: `wwwroot/mediaDex`)
- `SshSettings` (se usar `Provider = Ssh`):
  - `Host`, `User`, `PrivateKeyPath`, `RemoteBasePath`

Você pode sobrescrever via variáveis de ambiente (padrão do .NET), por exemplo:
```bash
export ConnectionStrings__DefaultConnection="Server=localhost;Database=mediadex;User Id=sa;Password=SuaSenha;TrustServerCertificate=True"
```

### Frontend (`Client/financias-react/.env`)
Variáveis usadas:
- `VITE_LOCALHOST` (ex: `http://localhost:5095/api`)
- `VITE_PRODUCAO` (base URL da API em produção)

## Testes
- Backend (Linux/macOS): `./run-backend-tests.sh`
- Backend (Windows): `run-backend-tests.bat`

Pipeline no GitHub Actions: `.github/workflows/tests-backend.yml`.

## Contratos e arquitetura
- Visão geral: `docs/specs/architecture/ARCHITECTURE-OVERVIEW.md`
- Contratos da API: `docs/specs/contracts/API-CONTRACTS.md`

## Aviso de segurança (antes de publicar no GitHub)
Este repositório contém arquivos de configuração que podem incluir **segredos** (ex: string de conexão/credenciais).
Antes de tornar o repositório público, substitua credenciais por placeholders e mova segredos para:
- GitHub Secrets / variáveis de ambiente
- User Secrets (ambiente de desenvolvimento)

## Licença
Nenhuma licença foi definida ainda. Se você pretende publicar o projeto, adicione um arquivo `LICENSE`.
