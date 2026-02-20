# PRD - Tela Minhas Obras (`/tabeladex`)

## 1. Contexto funcional
Tela de gestão da biblioteca com tabela rica (filtros, ações e modal de edição).

## 2. Fluxo principal de consulta
1. Tela monta.
2. Front chama `GET /api/MediaDex/obterMediaPorUsuario`.
3. Renderiza tabela com colunas de imagem, nome, tipo, totais, progresso, dia e status.

## 3. Fluxo de edição
1. Usuário clica em `Editar`.
2. Modal abre com dados atuais.
3. Usuário altera campos e/ou imagem.
4. Se houver arquivo, front envia `multipart/form-data`.
5. Sem arquivo, envia JSON.
6. Em sucesso, toast e recarrega dados da tabela.

## 4. Fluxo de remoção
1. Usuário clica em `Remover`.
2. Modal de confirmação abre.
3. Confirmação dispara `DELETE /api/MediaDex/{id}`.
4. Em sucesso, toast e atualização da lista.

## 5. Campos editáveis
- `nome`
- `tipoMidia`
- `totalCapitulos`
- `capituloAtual`
- `diaNovoCapitulo`
- `status`
- `imagemUrl` ou `ImagemUpload`

## 6. Critérios de aceite
- `AC-MO-001`: lista é carregada sem erro para usuário autenticado.
- `AC-MO-002`: edição persiste e reflete na tabela.
- `AC-MO-003`: remoção remove item da listagem após confirmação.
- `AC-MO-004`: fallback de imagem é aplicado quando sem capa.
- `AC-MO-005`: erro em operação mostra toast apropriado.

## 7. Referências front/back
- Front: `Client/financias-react/src/pages/TabelaDex.jsx`
- Back: `Presentation/MediaDexController.cs`, `Application/Handlers/Media/EditMediaCommandHandler.cs`
