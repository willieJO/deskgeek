# BRD - Tela de Login (`/login`)

## 1. Objetivo de negócio
Permitir autenticação de usuários já cadastrados para acesso às funcionalidades protegidas do MediaDex.

## 2. Atores
- Usuário não autenticado.
- Backend de autenticação (`UsuarioController`).

## 3. Regras de negócio atuais
- `BRD-LOGIN-001`: usuário informa `email` e `password` para autenticação.
- `BRD-LOGIN-002`: login válido retorna cookie `AuthToken` HttpOnly (JWT), com expiração de 7 dias.
- `BRD-LOGIN-003`: após autenticação com sucesso, usuário é redirecionado para `/dashboard`.
- `BRD-LOGIN-004`: login inválido deve mostrar mensagem de erro ao usuário.
- `BRD-LOGIN-005`: usuário autenticado não deve permanecer em `/login` (redireciona para `/dashboard`).
- `BRD-LOGIN-006`: sessão é validada no carregamento da aplicação via `GET /usuario/me`.

## 4. Métricas/indicadores desejáveis
- Taxa de sucesso de login.
- Taxa de falha por credencial inválida.
- Tempo médio de resposta do endpoint de login.

## 5. Relações de arquivos necessários
## Front-end
- `Client/financias-react/src/pages/Login.jsx`
- `Client/financias-react/src/main.jsx`
- `Client/financias-react/src/utils/api.js`

## Back-end
- `Presentation/UsuarioController.cs` (`POST /api/Usuario/login`, `GET /api/Usuario/me`)
- `Application/Queries/LoginQuery.cs`
- `Application/Validators/LoginQuerieValidator.cs`
- `Application/Handlers/User/LoginQueryHandler.cs`
- `Repository/UsuarioRepository.cs`
- `Program.cs` (JWT/cookie auth)

## 6. Fora de escopo desta tela
- Cadastro de usuário.
- Recuperação de senha.
- MFA/2FA.
