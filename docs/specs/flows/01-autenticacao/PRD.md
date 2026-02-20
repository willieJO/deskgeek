# PRD - Fluxo 01: Autenticacao

## Objetivo
Autenticar usuario, controlar acesso a rotas privadas e encerrar sessao.

## Escopo
- Cadastro (`/register`)
- Login (`/login`)
- Validacao de sessao (`GET /api/Usuario/me`)
- Logout (`POST /api/Usuario/logout`)

## Regras de produto
- `AUTH-PRD-001`: usuario autenticado deve ser redirecionado para `/dashboard`.
- `AUTH-PRD-002`: usuario nao autenticado nao pode acessar rotas privadas.
- `AUTH-PRD-003`: login invalido deve exibir erro sem quebrar fluxo.
- `AUTH-PRD-004`: cadastro valida confirmacao de senha no front.
- `AUTH-PRD-005`: logout deve limpar sessao e voltar para `/login`.

## Fluxo principal
1. Usuario registra conta.
2. Usuario faz login.
3. App valida sessao ao carregar.
4. Usuario navega em area autenticada.
5. Usuario executa logout.

## Criterios de aceite
- `AC-AUTH-001`: login valido navega para `/dashboard`.
- `AC-AUTH-002`: erro de credencial mostra mensagem amigavel.
- `AC-AUTH-003`: sessao valida evita retorno para `/login`.
- `AC-AUTH-004`: sessao invalida redireciona para `/login`.
- `AC-AUTH-005`: cadastro com email duplicado retorna validacao.
