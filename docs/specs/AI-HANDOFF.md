# Pacote de Implementacao para IA

Este e o ponto de entrada recomendado para um agente de IA analisar e desenvolver codigo neste projeto.

## Ordem de leitura
1. `docs/specs/flows/README.md`
2. `docs/specs/contracts/API-CONTRACTS.md`
3. `docs/specs/architecture/ARCHITECTURE-OVERVIEW.md`
4. Fluxo alvo:
- `docs/specs/flows/01-autenticacao/PRD.md`
- `docs/specs/flows/01-autenticacao/TDD.md`
- `docs/specs/flows/02-cadastro-e-gestao-de-midia/PRD.md`
- `docs/specs/flows/02-cadastro-e-gestao-de-midia/TDD.md`
- `docs/specs/flows/03-calendario-semanal/PRD.md`
- `docs/specs/flows/03-calendario-semanal/TDD.md`

## Como usar com agente de IA
- Passo 1: informe qual fluxo sera alterado.
- Passo 2: passe o `PRD.md` do fluxo (comportamento e aceite).
- Passo 3: passe o `TDD.md` do fluxo (arquivos e integracoes).
- Passo 4: passe `API-CONTRACTS.md` para manter compatibilidade de contrato.
- Passo 5: passe `ARCHITECTURE-OVERVIEW.md` para preservar decisoes tecnicas atuais.

## Escopo atual das rotas ativas
- `/login`
- `/register`
- `/dashboard` (AnimeTracker)
- `/tabeladex`
- `/calendariodex`
