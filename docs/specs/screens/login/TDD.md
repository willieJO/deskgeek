# TDD - Tela de Login (`/login`)

## 1. Arquitetura técnica (atual)
- Componente React controlado por estado local (`email`, `password`, `message`, `isSubmitting`).
- Navegação via `react-router-dom` (`useNavigate`).
- Requisições via instância Axios compartilhada (`api`).
- Autenticação baseada em cookie HttpOnly (`AuthToken`) validado no backend.

## 2. Sequência técnica
1. `Login.jsx` dispara `handleSubmit`.
2. `api.post('/usuario/login', payload)` envia credenciais.
3. Backend (`UsuarioController`) valida dados com FluentValidation.
4. `UsuarioRepository.GetUserId` valida senha com PBKDF2 (`VerifyPassword`).
5. Controller cria JWT e grava cookie `AuthToken`.
6. Front executa `onLogin()` para atualizar estado de autenticação em `main.jsx`.

## 3. Dependências de código
## Front-end
- `Client/financias-react/src/pages/Login.jsx`
- `Client/financias-react/src/utils/api.js`
- `Client/financias-react/src/main.jsx`

## Back-end
- `Presentation/UsuarioController.cs`
- `Application/Queries/LoginQuery.cs`
- `Application/Validators/LoginQuerieValidator.cs`
- `Application/Handlers/User/LoginQueryHandler.cs`
- `Repository/UsuarioRepository.cs`
- `Shared/PasswordSecurity.cs`

## 4. Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/Login.jsx`: renderiza formulário, dispara login e redireciona.
- `Client/financias-react/src/utils/api.js`: configura `baseURL`, cookies e redireciono global em `401`.
- `Client/financias-react/src/main.jsx`: faz guarda de rota e valida sessão em `GET /usuario/me`.
- `Presentation/UsuarioController.cs`: expõe endpoints `login` e `me`, gera JWT em cookie.
- `Application/Validators/LoginQuerieValidator.cs`: valida formato de email e tamanho mínimo da senha.
- `Repository/UsuarioRepository.cs`: consulta usuário por email e valida hash de senha.
- `Shared/PasswordSecurity.cs`: implementação PBKDF2 para verificação de senha.

## 5. Contratos e headers
- Endpoint base configurado por `VITE_LOCALHOST`/`VITE_PRODUCAO`.
- `withCredentials: true` habilitado no Axios para cookies.
- Interceptor global redireciona para `/login` em `401` (exceto `/usuario/me`).

## 6. Riscos e pontos de atenção
- Cookie de login usa `Secure=true`; em HTTP local pode falhar dependendo do ambiente.
- Estado local remove `token` do `localStorage` no logout, mas login atual depende de cookie.
- Tratamento de erro depende de `error.response.data.message`; payloads fora do padrão podem gerar mensagem genérica.

## 7. Casos técnicos de teste recomendados
- `TC-LOGIN-001`: login válido grava cookie e redireciona corretamente.
- `TC-LOGIN-002`: login inválido retorna mensagem sem quebrar estado.
- `TC-LOGIN-003`: payload inválido (email/senha curtos) retorna mensagens de validação.
- `TC-LOGIN-004`: `GET /usuario/me` com sessão inválida mantém usuário deslogado.
