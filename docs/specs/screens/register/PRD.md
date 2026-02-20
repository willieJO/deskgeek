# PRD - Tela de Cadastro (`/register`)

## 1. Contexto funcional
Tela pública para criação de conta, com validação básica no front e validações de negócio no backend.

## 2. Fluxo principal
1. Usuário acessa `/register`.
2. Informa `Nome`, `Email`, `Senha`, `Confirmar senha`.
3. Front compara `senha` e `confirmSenha`.
4. Se válidas, chama `POST /api/Usuario/register`.
5. Em sucesso (`200` ou `201`), exibe toast e navega para `/login` após 1.5s.

## 3. Fluxos alternativos
- Se senhas não coincidem, exibe mensagem local e não envia request.
- Usuário pode alternar visibilidade da senha.
- Link `Voltar para login` leva para `/login`.

## 4. Campos e validações
- `name`: obrigatório no front.
- `email`: obrigatório e tipo email no front.
- `senha`: obrigatório.
- `confirmSenha`: obrigatório e deve ser idêntica à `senha`.
- Back-end:
  - Nome obrigatório com mínimo 3.
  - Email obrigatório, formato válido e único.
  - Senha obrigatória com mínimo 6.

## 5. Estados de UI
- `isSubmitting=true`: botão mostra `Registrando...`.
- Mensagens exibidas em card e toast (`react-toastify`).

## 6. Contrato de API usado
## Request
- `POST /api/Usuario/register`
```json
{
  "nome": "Nome Usuário",
  "email": "user@email.com",
  "senha": "123456"
}
```

## Success
```json
{
  "id": "guid"
}
```

## Error (validação)
```json
[
  {
    "field": "Email",
    "message": "Esse e-mail já está cadastrado."
  }
]
```

## 7. Critérios de aceite
- `AC-REG-001`: cadastro válido cria usuário e redireciona para login.
- `AC-REG-002`: senha e confirmação diferentes bloqueiam envio.
- `AC-REG-003`: backend retorna erro descritivo para email duplicado.
- `AC-REG-004`: botão evita múltiplos envios simultâneos.

## 8. Referências front/back
- Front: `Client/financias-react/src/pages/Register.jsx`
- Back: `Presentation/UsuarioController.cs`, `Application/Validators/UsuarioCommandValidator.cs`
