# PRD — Minhas obras (`/tabeladex`)

## Experiência

A biblioteca é a entrada padrão após o login e abre em **Em andamento**, usando **Minha ordem**. Finalizadas continuam acessíveis pelos cards de status. Obras aparecem em cards verticais responsivos, com capa, título, tipo de mídia, status, progresso e dia de lançamento. A tela oferece acesso destacado a **Adicionar obra** (`/dashboard`). Não há visualização em tabela.

Cada card permite editar a obra, confirmar sua remoção e abrir o link pessoal para assistir/ler em outra aba, quando houver URL HTTP/HTTPS válida. Filmes exibem **Assistido** quando finalizados e **Não concluído** nos demais status; não oferecem incremento de episódios/capítulos.

## Consulta e filtros

- `GET /api/MediaDex/obterMediaPorUsuario`, autenticado por cookie.
- Busca por título sem distinguir acentos, maiúsculas ou espaços nas extremidades.
- Cards de status: Todas as obras, Em andamento, Finalizado e Inativo. Contadores representam a biblioteca completa.
- Filtros combináveis de tipo, dia de lançamento e lançamentos de hoje; há opções para tipo/dia não definidos.
- Ordenação padrão **Minha ordem**, salva na conta, ou por título A–Z/Z–A e percentual de progresso crescente/decrescente. Percentuais desconhecidos ficam ao final em ambas as direções.
- Filtros e ordenação precedem paginação de 24 obras. Alterar critérios retorna à primeira página; remoção/edição ajustam páginas que deixaram de existir.
- Busca sem resultado, biblioteca vazia, carregamento e falha de consulta possuem estados distintos. Falhas mantêm dados já carregados e oferecem nova tentativa.

## Acompanhamento

- Anime/Série: episódios. Mangá/Manhua: capítulos.
- Total positivo conhecido: barra de progresso. Total ausente/zero: Total desconhecido.
- **+1 episódio/capítulo** aparece para obras em andamento, exceto filmes. Progresso vazio começa em zero; dados inválidos ou total atingido bloqueiam a ação.
- O incremento persiste antes de atualizar o card. Cliques repetidos são bloqueados e erros preservam o progresso anterior. Ao atingir um total positivo conhecido, o status muda automaticamente para **Finalizado**, inclusive ao cadastrar/editar. O progresso esperado de lançamento não conclui uma obra. Total desconhecido/zero não finaliza. A migration também corrige obras antigas que já atingiram o total.
- Selo **Hoje** e filtro correspondente usam o dia da semana em `America/Sao_Paulo`, somente para obras em andamento. O dia é atualizado ao recuperar foco e a cada minuto.

## Edição e remoção

- Modal edita título, tipo, total, progresso, status, lançamento, capa por URL/upload e link pessoal.
- Nome obrigatório; números inteiros não negativos; progresso não pode ultrapassar total informado; link pessoal HTTP/HTTPS de até 2048 caracteres.
- `PUT /api/MediaDex/{id}` com JSON ou multipart quando houver arquivo. Números são enviados como strings; campos opcionais limpos são strings vazias para respeitar a API.
- A URL de capa tem preferência sobre o arquivo anterior; upload envia URL vazia para remover a URL anterior. Capa quebrada/ausente usa SVG local.
- `DELETE /api/MediaDex/{id}` exige confirmação. Em falha, o modal continua aberto com mensagem e opção de repetir.
- Modais bloqueiam fechamento durante gravação; navegação por teclado e ações visíveis também funcionam em toque.

## Aceite

1. Login abre a biblioteca; todas as rotas anteriores continuam acessíveis.
2. Filtros combinados, contadores, ordenação e paginação refletem os dados corretamente.
3. Edição JSON/upload e incremento persistem e permanecem após recarregar.
4. Remoção exige confirmação e atualiza a lista/página após sucesso.
5. Falhas de consulta e mutação não descartam dados nem encerram edição sem salvar.
6. Capas ausentes/quebradas, títulos longos e totais desconhecidos não quebram o layout.
7. Biblioteca funciona em celular, tablet e desktop, sem rolagem horizontal da página.
8. Calendário de terceiros continua somente leitura e não expõe links pessoais.


## Lembretes de lançamento

Cada card e modal de edição permite ativar/desativar o e-mail da obra. A ação atualiza somente a preferência e não altera progresso, cronograma ou status. A chave geral em Configurações pausa todos os envios, preservando escolhas individuais. Com e-mails gerais pausados, a biblioteca exibe aviso e acesso às configurações.


## Qualidade das capas

Novas buscas AniList priorizam `extraLarge`, depois `large` e `medium`; séries do TVMaze priorizam a imagem original e filmes da Wikipedia solicitam miniaturas de 600 px. Links antigos do CDN AniList com `/cover/small/` ou `/cover/medium/` tentam a variante `/cover/large/` na renderização, sem alterar os registros existentes. Se a variante maior não existir, a capa original é utilizada antes do fallback local. Essa política é compartilhada por cards, calendário, previews e busca/edição. Uploads mantêm o arquivo original, sem recompressão; imagens já enviadas em baixa resolução precisam ser substituídas por um arquivo maior para recuperar nitidez.

Ao substituir uma capa por upload, a URL antiga é removida para que a imagem enviada tenha prioridade. Edições multipart distinguem URL ausente (preservar) de URL vazia (limpar).


## Ordem pessoal

**Organizar** abre um modal com todas as obras dos filtros atuais, incluindo outras páginas. Arraste pela alça ou use as setas para cima/baixo; pelo teclado, Espaço inicia/solta e Escape cancela o arraste. **Salvar ordem** persiste na conta, ativa **Minha ordem** e volta à primeira página. **Cancelar** descarta as alterações. Falhas mantêm o modal e a ordem proposta para nova tentativa.

Obras ocultas pelos filtros preservam suas posições relativas e seus lugares. Novas obras sem posição salva aparecem após as ordenadas. A preferência pertence ao usuário autenticado, funciona após recarregar e em outros dispositivos; não altera metadados nem ordens de outras contas.
