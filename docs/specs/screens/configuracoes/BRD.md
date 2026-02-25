# BRD - Tela Configurações (`/configuracoes`)

## 1. Objetivo de negócio
Permitir autonomia do usuário para manutenção de dados de perfil sem suporte manual.

## 2. Atores
- Usuário autenticado.
- Backend de usuários (`UsuarioController`).

## 3. Regras de negócio atuais
- `BRD-CONF-001`: acesso somente para sessão autenticada.
- `BRD-CONF-002`: alterações de nome, senha e foto são independentes.
- `BRD-CONF-003`: senha atual deve ser validada antes da troca.
- `BRD-CONF-004`: foto de perfil é usada apenas na área logada nesta versão.
- `BRD-CONF-005`: email é exibido como dado informativo (somente leitura).

## 4. Valor de negócio
- Reduz atrito para atualizar identidade visual e credenciais.
- Melhora personalização do uso diário da aplicação.

## 5. Relações de arquivos necessários
## Front-end
- `Client/financias-react/src/pages/Configuracoes.jsx`
- `Client/financias-react/src/components/AuthenticatedLayout.jsx`
- `Client/financias-react/src/main.jsx`

## Back-end
- `Presentation/UsuarioController.cs`
- `Application/Commands/UpdateUsuario*Command.cs`
- `Application/Validators/UpdateUsuario*CommandValidator.cs`
- `Application/Handlers/User/UpdateUsuario*CommandHandler.cs`
- `Repository/UsuarioRepository.cs`

## 6. Fora de escopo
- Alteração de email.
- Recuperação de senha por email.
- Exposição da foto em telas públicas/compartilhadas.
