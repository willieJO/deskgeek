# BRD - Tela Minhas Obras (`/tabeladex`)

## 1. Objetivo de negócio
Permitir consulta, edição e remoção das obras do usuário em uma biblioteca de cards com filtros combináveis e atualização rápida de progresso.

## 2. Atores
- Usuário autenticado.
- API de mídia (`MediaDexController`).

## 3. Regras de negócio atuais
- `BRD-MO-001`: carregar todas as mídias do usuário autenticado.
- `BRD-MO-002`: permitir edição dos campos principais da obra.
- `BRD-MO-003`: permitir troca de imagem por upload ou URL.
- `BRD-MO-003A`: permitir editar `urlMidia` opcional da obra.
- `BRD-MO-004`: permitir remoção definitiva da obra com confirmação.
- `BRD-MO-005`: exibir fallback de imagem quando não houver capa.
- `BRD-MO-006`: exibir ação para abrir `urlMidia` quando houver link HTTP/HTTPS válido.
- `BRD-MO-007`: permitir busca e filtros por status, tipo e lançamento.
- `BRD-MO-008`: incrementar progresso de obras em andamento sem ultrapassar o total; ao atingir um total positivo conhecido, concluir automaticamente com status Finalizado.
- `BRD-MO-009`: abrir a biblioteca após o login no filtro Em andamento e na ordem pessoal.
- `BRD-MO-010`: organizar obras por arraste ou setas em modal e salvar a ordem na conta, preservando obras ocultas por filtros.

## 4. Valor de negócio
- Manutenção contínua da biblioteca.
- Correção rápida de metadados sem recadastro.

## 5. Relações de arquivos necessários
## Front-end
- `Client/financias-react/src/pages/TabelaDex.jsx`
- `Client/financias-react/src/utils/api.js`

## Back-end
- `Presentation/MediaDexController.cs` (`GET`, `PUT`, `DELETE`)
- `Application/Commands/EditMediaCommand.cs`
- `Application/Validators/EditMediaCommandValidator.cs`
- `Application/Handlers/Media/EditMediaCommandHandler.cs`
- `Application/Handlers/Media/MediaDexQueryCommandHandle.cs`
- `Application/Handlers/Media/MediaDexQueryDeleteCommandHandle.cs`
- `Repository/MediaRepository.cs`

## 6. Fora de escopo
- Edição em lote.
- Lixeira/soft delete.
- Histórico de alterações.
- Exibicao da `urlMidia` no calendario.
