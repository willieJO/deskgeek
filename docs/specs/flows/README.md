# Especificacao por Fluxo (modelo conceitual)

Este modelo organiza requisitos por capacidade de negocio e nao apenas por tela.

## Fluxos ativos
- `01-autenticacao`: login, cadastro, sessao e logout.
- `02-cadastro-e-gestao-de-midia`: criar, listar, editar e remover obras.
- `03-calendario-semanal`: agenda por dia da semana para obras em andamento.

## Padrao por fluxo
- `PRD.md`: objetivo, regras, fluxos, criterios de aceite.
- `TDD.md`: desenho tecnico, contratos usados, arquivos impactados, riscos e testes.

## Fonte dos comportamentos
Mapeado a partir do estado atual do codigo em:
- Front: `Client/financias-react/src`
- Back: `Presentation`, `Application`, `Repository`, `Domain`
