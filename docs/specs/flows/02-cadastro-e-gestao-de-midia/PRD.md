# PRD - Fluxo 02: Cadastro e Gestao de Midia

## Objetivo
Permitir criar, listar, editar e remover obras da biblioteca pessoal.

## Escopo
- Cadastro de obra por busca externa ou manual (`/dashboard`, componente `AnimeTracker`).
- Listagem e manutencao da biblioteca (`/tabeladex`).

## Regras de produto
- `MID-PRD-001`: tipos suportados: Anime, Manga, Manhua, Serie, Filme.
- `MID-PRD-002`: usuario pode criar obra a partir de sugestao ou manualmente.
- `MID-PRD-003`: status suportados: Em andamento, Finalizado, Inativo.
- `MID-PRD-004`: edicao permite alterar metadados e imagem (upload ou URL).
- `MID-PRD-005`: remocao exige confirmacao explicita.

## Fluxo principal
1. Usuario busca obra por tipo e termo.
2. Seleciona sugestao ou ativa cadastro manual.
3. Salva obra.
4. Visualiza na tabela de obras.
5. Edita ou remove conforme necessidade.

## Criterios de aceite
- `AC-MID-001`: obra salva deve aparecer em `/tabeladex`.
- `AC-MID-002`: edicao persiste e reflete na listagem.
- `AC-MID-003`: remocao exclui item da lista.
- `AC-MID-004`: upload de imagem funciona na criacao e edicao.
