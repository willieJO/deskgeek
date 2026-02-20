# Especificações por tela (estado atual)

Este diretório documenta o comportamento **como está implementado hoje** nas telas ativas do frontend.

## Telas ativas mapeadas
- `login` (`/login`)
- `register` (`/register`)
- `acompanhar-midia` (`/dashboard`, componente `AnimeTracker`)
- `minhas-obras` (`/tabeladex`)
- `calendario` (`/calendariodex`)

## Estrutura por tela
Cada pasta contém:
- `BRD.md`: requisitos de negócio e regras vigentes.
- `PRD.md`: requisitos de produto/UX e critérios de aceite.
- `TDD.md`: desenho técnico, integrações, contratos e riscos.

## Referências globais
- Rotas e guarda de autenticação: `Client/financias-react/src/main.jsx`
- Layout autenticado (menu, logout, `Outlet`): `Client/financias-react/src/components/AuthenticatedLayout.jsx`
- Cliente HTTP e tratamento global 401: `Client/financias-react/src/utils/api.js`
- Controllers API existentes: `Presentation/UsuarioController.cs`, `Presentation/MediaDexController.cs`

## Observação de escopo
As páginas `Client/financias-react/src/pages/Home.jsx` e `Client/financias-react/src/pages/Dashboard.jsx` existem no código, mas **não fazem parte das rotas ativas atuais**.
