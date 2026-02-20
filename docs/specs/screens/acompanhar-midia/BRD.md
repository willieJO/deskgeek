# BRD - Tela Acompanhar Mídia (`/dashboard`)

## 1. Objetivo de negócio
Centralizar o cadastro de obras (anime, mangá, manhua, série e filme), permitindo rastrear progresso e status em uma biblioteca pessoal.

## 2. Atores
- Usuário autenticado.
- APIs de busca externa (AniList, TVMaze, Wikipedia, MangaDex).
- API interna de persistência (`MediaDexController`).

## 3. Regras de negócio atuais
- `BRD-AM-001`: somente usuário autenticado acessa a tela.
- `BRD-AM-002`: usuário pode cadastrar a partir de sugestão de busca ou manualmente.
- `BRD-AM-003`: tipos suportados: Anime, Mangá, Manhua, Série, Filme.
- `BRD-AM-004`: para Filme, `TotalCapitulos` padrão é `1` e não há capítulo atual/dia de lançamento recorrente.
- `BRD-AM-005`: para demais tipos, usuário pode informar capítulo/episódio atual e dia da semana.
- `BRD-AM-006`: status suportados: `Em andamento`, `Finalizado`, `Inativo`.
- `BRD-AM-007`: backend exige apenas `Nome` como obrigatório no cadastro.

## 4. Valor de negócio
- Reduz trabalho manual na criação de registros via auto-sugestão.
- Mantém base unificada para tabela e calendário.

## 5. Relações de arquivos necessários
## Front-end
- `Client/financias-react/src/pages/AnimeTracker.jsx`
- `Client/financias-react/src/main.jsx`
- `Client/financias-react/src/utils/api.js`

## Back-end
- `Presentation/MediaDexController.cs` (`POST /api/MediaDex/criar`, endpoints MangaDex proxy)
- `Application/Commands/CreateMediaCommand.cs`
- `Application/Validators/CreateMediaCommandValidator.cs`
- `Application/Handlers/Media/CreateMediaCommandHandler.cs`
- `Repository/MediaRepository.cs`
- `Domain/MediaDex.cs`

## 6. Fora de escopo
- Histórico de progresso por data.
- Sincronização automática contínua com provedores externos.
- Curadoria/recomendação de conteúdo.
