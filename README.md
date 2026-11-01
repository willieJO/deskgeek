# MediaDex (DeskGeek)

Aplicação full-stack para organizar e acompanhar obras (Anime/Mangá/Manhua/Série/Filme), com:
- cadastro/login (JWT em cookie `AuthToken`);
- biblioteca em cards com busca, filtros, progresso rápido, conclusão automática e edição de capas (upload ou URL);
- ordem pessoal por arraste ou setas, salva na conta;
- calendário semanal baseado no campo **DiaNovoCapitulo**;
- proxy de busca/capas do **MangaDex**.

## Estrutura do repositório
- Backend (ASP.NET Core / .NET 8): projeto `deskgeek.csproj` na raiz
- Worker de e-mails (.NET 8): `Worker/MediaDex.Worker`
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
2. Aplique as migrations no banco antes de iniciar a versão atual da API:
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

## Compilação no Windows e WSL

O Windows/Visual Studio usa `bin/` e `obj/` normalmente. Builds no Linux/WSL usam `artifacts/linux/`, configurado em `Directory.Build.props`, para não misturar caches e manifestos de arquivos estáticos com caminhos absolutos de sistemas diferentes. `artifacts/` fica fora do controle de versão e dos arquivos compilados.

## Organização da biblioteca

A biblioteca abre em **Em andamento** e **Minha ordem**. Ao completar um total conhecido de episódios/capítulos, a obra passa para **Finalizado**, acessível no filtro correspondente. Use **Organizar** para arrastar ou mover pelas setas todas as obras do filtro atual, incluindo outras páginas. Salve para manter a ordem na conta; Cancelar descarta as mudanças.

A migration `20261101002519_AddLibraryOrderAndAutoCompletion` adiciona a posição pessoal e corrige obras antigas já completas. Aplique as migrations antes de iniciar a nova API.

## Publicação na Hostinger

Infraestrutura, configuração de produção e retorno de versão: [guia de publicação](docs/deployment/HOSTINGER.md).

## Lembretes por e-mail

Envio às 12h de Brasília conforme o dia cadastrado, usando a arquitetura do GymFlow (outbox SQL, RabbitMQ, worker separado e Brevo). Inclui preferências gerais e por obra. Para configurar o remetente/chave, aplicar a migration e iniciar o worker, consulte [o guia de e-mails](docs/email/README.md).

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
