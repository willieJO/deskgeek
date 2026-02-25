# PRD - Tela Configurações (`/configuracoes`)

## 1. Contexto funcional
Tela privada para gerenciamento de perfil do usuário autenticado.

## 2. Fluxo principal
1. Usuário abre `/configuracoes` pelo menu lateral.
2. Front usa dados de sessão carregados em `main.jsx` (`currentUser`).
3. Usuário altera foto, nome e/ou senha em blocos independentes.
4. Front chama endpoint correspondente de `UsuarioController`.
5. Em sucesso, exibe toast e atualiza sessão (`refreshCurrentUser`) quando necessário.

## 3. Seções da tela
- `Foto de perfil`: preview atual, seleção de arquivo e envio em `multipart/form-data`.
- `Nome de usuário`: campo único + salvar.
- `Senha`: `senhaAtual`, `novaSenha`, `confirmarNovaSenha`.

## 4. Campos e validações
- Foto:
  - formatos `jpg/jpeg/png/webp`
  - tamanho max `2MB`
- Nome (`usuario`): obrigatório, trim, mínimo 3
- Senha:
  - campos obrigatórios
  - nova senha mínima 6
  - confirmação igual
  - nova senha diferente da atual

## 5. Estados de UI
- `isSavingPhoto`, `isSavingName`, `isSavingPassword` independentes.
- Mensagens por toast sem bloquear os demais blocos.

## 6. Critérios de aceite
- `AC-CONF-001`: menu lateral navega para `/configuracoes`.
- `AC-CONF-002`: salvar nome atualiza header/sidebar sem reload da aplicação.
- `AC-CONF-003`: erro na troca de senha exibe mensagem e mantém formulário.
- `AC-CONF-004`: foto válida atualiza avatar exibido na área logada.
- `AC-CONF-005`: erro em um bloco não impede salvar outro bloco.
