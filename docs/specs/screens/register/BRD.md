# BRD - Tela de Cadastro (`/register`)

## 1. Objetivo de negócio
Permitir criação de novas contas para acesso ao ecossistema MediaDex.

## 2. Atores
- Visitante sem conta.
- Backend de usuários (`UsuarioController`).

## 3. Regras de negócio atuais
- `BRD-REG-001`: cadastro exige `nome`, `email`, `senha`.
- `BRD-REG-002`: front valida confirmação de senha antes do envio.
- `BRD-REG-003`: backend exige nome mínimo 3, email válido e senha mínima 6.
- `BRD-REG-004`: email deve ser único (validação em repositório).
- `BRD-REG-005`: senha é armazenada com hash PBKDF2.
- `BRD-REG-006`: em sucesso, usuário é redirecionado para `/login`.

## 4. Métricas/indicadores desejáveis
- Taxa de conversão de cadastro.
- Taxa de rejeição por email já cadastrado.
- Tempo médio para concluir cadastro.

## 5. Relações de arquivos necessários
## Front-end
- `Client/financias-react/src/pages/Register.jsx`
- `Client/financias-react/src/main.jsx`
- `Client/financias-react/src/utils/api.js`

## Back-end
- `Presentation/UsuarioController.cs` (`POST /api/Usuario/register`)
- `Application/Commands/UsuarioCommand.cs`
- `Application/Validators/UsuarioCommandValidator.cs`
- `Application/Handlers/User/UsuarioCommandHandler.cs`
- `Repository/UsuarioRepository.cs`
- `Shared/PasswordSecurity.cs`

## 6. Fora de escopo
- Validação de força avançada de senha.
- Verificação de email (double opt-in).
- Termos de uso/LGPD com consentimento explícito.
