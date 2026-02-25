# TDD - Tela Configurações (`/configuracoes`)

## 1. Arquitetura técnica (atual)
- Página React (`Configuracoes.jsx`) com estado local por formulário.
- Sessão e `currentUser` mantidos em `main.jsx`.
- Layout autenticado (`AuthenticatedLayout.jsx`) renderiza avatar/nome com base em `GET /api/Usuario/me`.

## 2. Dependências e relações de arquivo
## Front-end
- `Client/financias-react/src/pages/Configuracoes.jsx`
- `Client/financias-react/src/components/AuthenticatedLayout.jsx`
- `Client/financias-react/src/main.jsx`
- `Client/financias-react/src/utils/api.js`

## Back-end
- `Presentation/UsuarioController.cs`
- `Application/Commands/UpdateUsuarioNomeCommand.cs`
- `Application/Commands/UpdateUsuarioSenhaCommand.cs`
- `Application/Commands/UpdateUsuarioFotoCommand.cs`
- `Application/Validators/UpdateUsuario*CommandValidator.cs`
- `Application/Handlers/User/UpdateUsuario*CommandHandler.cs`
- `Repository/UsuarioRepository.cs`
- `Shared/Upload.cs`

## 3. Matriz arquivo -> funcionalidade
- `main.jsx`: `refreshCurrentUser` hidrata `currentUser` após login e atualizações de perfil.
- `AuthenticatedLayout.jsx`: item `Configurações` + avatar com fallback.
- `Configuracoes.jsx`: envio para `/usuario/me/nome`, `/usuario/me/senha`, `/usuario/me/foto`.
- `UsuarioController.cs`: endpoints `/me/*` e entrega da foto (`GET /me/foto`).
- `UsuarioRepository.cs`: updates parciais (`nome`, `senha`, `foto`).

## 4. Contratos técnicos consumidos
- `GET /api/Usuario/me`
- `PUT /api/Usuario/me/nome`
- `PUT /api/Usuario/me/senha`
- `PUT /api/Usuario/me/foto` (`multipart/form-data`, campo `foto`)
- `GET /api/Usuario/me/foto`

## 5. Sequência técnica resumida
1. App valida sessão e carrega `currentUser`.
2. Layout usa `currentUser` para mostrar nome/avatar.
3. Tela de configurações salva cada bloco por endpoint dedicado.
4. Front chama `refreshCurrentUser` após sucesso em nome/foto.
5. Backend valida via FluentValidation + handlers MediatR e persiste via repositório.

## 6. Riscos e dívidas técnicas atuais
- `main.jsx` ainda usa estado simples (`isLoggedIn`) junto de `currentUser`.
- Cache de imagem depende de querystring (`fotoCacheKey`) no front.
- Não há remoção do arquivo de avatar anterior no storage.

## 7. Casos técnicos de teste recomendados
- `TC-CONF-001`: atualizar nome com valor válido e refletir no layout.
- `TC-CONF-002`: rejeitar nome duplicado.
- `TC-CONF-003`: rejeitar troca de senha com senha atual inválida.
- `TC-CONF-004`: rejeitar upload com extensão inválida/tamanho > 2MB.
- `TC-CONF-005`: `GET /me/foto` retorna `404` quando sem foto.
