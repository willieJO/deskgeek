# PRD - Fluxo 04: Perfil e Configuracoes

## Objetivo
Permitir que o usuario autenticado gerencie seu perfil (nome, senha e foto) pela area autenticada.

## Escopo
- Acesso a `/configuracoes` via menu lateral.
- Atualizacao de nome de usuario (`Usuario`).
- Atualizacao de senha com validacao da senha atual.
- Upload/substituicao de foto de perfil.

## Regras de produto
- `PERF-PRD-001`: apenas usuario autenticado acessa configuracoes.
- `PERF-PRD-002`: nome, senha e foto devem ser alterados de forma independente.
- `PERF-PRD-003`: troca de senha exige senha atual valida.
- `PERF-PRD-004`: foto de perfil e exibida apenas na area logada nesta entrega.
- `PERF-PRD-005`: `GET /api/Usuario/me` deve retornar `usuario` e `fotoPerfilDisponivel` para hidratar o front.

## Fluxo principal
1. Usuario autenticado abre `/configuracoes`.
2. Sistema carrega dados de sessao via `GET /api/Usuario/me`.
3. Usuario altera nome, senha e/ou foto em blocos independentes.
4. Cada bloco salva por endpoint dedicado e exibe feedback.
5. Front atualiza informacoes da sessao e reflete nome/foto no layout.

## Criterios de aceite
- `AC-PERF-001`: menu lateral exibe item `Configurações`.
- `AC-PERF-002`: alterar nome atualiza exibicao no layout sem reload completo.
- `AC-PERF-003`: senha atual invalida retorna erro amigavel.
- `AC-PERF-004`: upload de foto valida formato/tamanho e atualiza avatar.
- `AC-PERF-005`: erro em um bloco nao interfere nos demais.
