# TDD - Tela de Cadastro (`/register`)

## 1. Arquitetura técnica (atual)
- Componente React com estados locais de formulário.
- Toggle de senha compartilhado entre campo de senha e confirmação.
- Envio via Axios (`api.post('/usuario/register')`).
- Navegação controlada por `useNavigate`.

## 2. Sequência técnica
1. `handleSubmit` valida se `senha === confirmSenha`.
2. Em caso positivo, dispara `POST /api/Usuario/register`.
3. Backend valida com `UsuarioCommandValidator`.
4. Handler aplica `HashPassword()` antes de persistir.
5. Em sucesso, front exibe toast e agenda redirect para `/login`.

## 3. Dependências de código
## Front-end
- `Client/financias-react/src/pages/Register.jsx`
- `Client/financias-react/src/utils/api.js`

## Back-end
- `Presentation/UsuarioController.cs`
- `Application/Commands/UsuarioCommand.cs`
- `Application/Validators/UsuarioCommandValidator.cs`
- `Application/Handlers/User/UsuarioCommandHandler.cs`
- `Repository/UsuarioRepository.cs`
- `Shared/PasswordSecurity.cs`

## 4. Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/Register.jsx`: formulário de cadastro, valida confirmação e aciona API.
- `Client/financias-react/src/utils/api.js`: cliente Axios com `withCredentials`.
- `Presentation/UsuarioController.cs`: endpoint `register` com retorno de validações.
- `Application/Validators/UsuarioCommandValidator.cs`: regras de nome, email único e senha mínima.
- `Application/Handlers/User/UsuarioCommandHandler.cs`: cria entidade `User` e aplica hash de senha.
- `Repository/UsuarioRepository.cs`: grava usuário e verifica existência de email.
- `Shared/PasswordSecurity.cs`: hash PBKDF2 da senha antes da persistência.

## 5. Mapeamento de dados
- Front envia `nome`, `email`, `senha`.
- Handler converte para domínio `User`:
  - `Name <- Nome`
  - `Email <- Email`
  - `Senha <- Senha.HashPassword()`

## 6. Riscos e pontos de atenção
- Tratamento de erro no front assume array (`error.response.data[0].message`).
- Caso backend retorne objeto `{success,message}`, esse parsing pode falhar.
- Não há política de senha forte além do tamanho mínimo.

## 7. Casos técnicos de teste recomendados
- `TC-REG-001`: cadastro com dados válidos persiste hash e não senha pura.
- `TC-REG-002`: tentativa com email duplicado retorna erro de validação.
- `TC-REG-003`: senha curta é rejeitada no backend.
- `TC-REG-004`: mismatch de senha é bloqueado no frontend.
