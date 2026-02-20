# PRD - Tela de Login (`/login`)

## 1. Contexto funcional
Tela pública para autenticar usuário e liberar acesso às rotas protegidas.

## 2. Fluxo principal
1. Usuário acessa `/login`.
2. Preenche `Email` e `Senha`.
3. Clica em `Entrar`.
4. Front chama `POST /api/Usuario/login`.
5. Em sucesso (`success=true`), front chama `onLogin`, exibe mensagem e navega para `/dashboard`.
6. Em erro, mensagem é exibida no card.

## 3. Fluxos alternativos
- Usuário clica em `Criar agora` e navega para `/register`.
- Se já estiver autenticado, rota redireciona automaticamente para `/dashboard`.

## 4. Campos e validações
- `email` (`type=email`, obrigatório no front).
- `password` (`type=password`, obrigatório no front).
- Validações adicionais no back:
  - Email obrigatório e formato válido.
  - Senha obrigatória e mínimo 6 caracteres.

## 5. Estados de UI
- `isSubmitting=true`: botão mostra `Entrando...` e fica desabilitado.
- Mensagem de sucesso/erro renderizada abaixo do formulário.

## 6. Contrato de API usado
## Request
- `POST /api/Usuario/login`
- Body JSON:
```json
{
  "email": "user@email.com",
  "password": "123456"
}
```

## Response de sucesso
```json
{
  "success": true,
  "message": "Login realizado com sucesso"
}
```

## Response de erro (exemplo)
```json
{
  "success": false,
  "message": "Email ou senha inválidos"
}
```

## 7. Critérios de aceite
- `AC-LOGIN-001`: Com credenciais válidas, usuário chega em `/dashboard`.
- `AC-LOGIN-002`: Com credenciais inválidas, mensagem de erro é exibida sem quebrar a tela.
- `AC-LOGIN-003`: Botão não permite múltiplos submits simultâneos.
- `AC-LOGIN-004`: Sessão ativa redireciona usuário fora de `/login`.

## 8. Referências front/back
- Front: `Client/financias-react/src/pages/Login.jsx`, `Client/financias-react/src/main.jsx`
- Back: `Presentation/UsuarioController.cs`, `Application/Validators/LoginQuerieValidator.cs`
