# TDD - Fluxo 01: Autenticacao

## Arquitetura tecnica
- Front com guarda de rota em `Client/financias-react/src/main.jsx`.
- Sessao baseada em cookie HttpOnly (`AuthToken`) + JWT.
- Backend em `UsuarioController` com validacoes FluentValidation.

## Contratos usados
- `POST /api/Usuario/register`
- `POST /api/Usuario/login`
- `GET /api/Usuario/me`
- `POST /api/Usuario/logout`

## Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/Login.jsx`: formulario de login.
- `Client/financias-react/src/pages/Register.jsx`: formulario de cadastro.
- `Client/financias-react/src/main.jsx`: redirecionamento e controle de autenticacao.
- `Client/financias-react/src/components/AuthenticatedLayout.jsx`: acao de logout.
- `Client/financias-react/src/utils/api.js`: Axios com `withCredentials` e interceptor 401.
- `Presentation/UsuarioController.cs`: endpoints de auth.
- `Application/Validators/LoginQuerieValidator.cs`: validacao do login.
- `Application/Validators/UsuarioCommandValidator.cs`: validacao de cadastro.
- `Repository/UsuarioRepository.cs`: consulta usuario e verifica unicidade de email/usuário.
- `Shared/PasswordSecurity.cs`: hash/verificacao PBKDF2.

## Riscos tecnicos atuais
- Cookie de auth usa `Secure=true` e pode falhar em ambiente sem HTTPS.
- Parte do front ainda referencia `localStorage token`, enquanto fluxo oficial e cookie.

## Testes recomendados
- Login valido/invalido.
- Cadastro com email repetido.
- Cadastro com usuário repetido.
- Acesso a rota privada sem sessao.
- Logout seguido de tentativa de acesso privado.
