# TDD — Biblioteca em cards

## Organização

- `TabelaDex.jsx`: consulta autenticada, filtros, contadores, paginação, cards e coordenação de mutações.
- `LibraryOrderDialog.jsx`: lista de todas as páginas filtradas, dnd-kit com ponteiro/teclado e botões de posição; salvar/cancelar e tratamento de falha.
- `MediaEditDialog.jsx`: formulário de edição, validação e preview de upload com revogação de object URLs.
- `MediaCover.jsx` e `mediaImages.js`: escolha de capa e fallback SVG local; compartilhados com o calendário.
- `utils/library.js`: funções puras para normalização, filtros, ordenação, paginação, progresso, datas, validação e serialização.
- `theme.js` e `index.css`: tema MUI global e identidade visual compartilhada.

## Contratos existentes

A organização pessoal adiciona `MediaDex.OrdemPersonalizada` (int nullable) e o endpoint autenticado abaixo. A migration `20261101002519_AddLibraryOrderAndAutoCompletion` também normaliza obras antigas com progresso real igual/superior a total positivo, usando TRY_CONVERT para ignorar valores legados inválidos. O Down remove apenas a coluna de ordem; não desfaz a normalização de status. Consulta por cookie usando a instância `api` com `withCredentials`.

- GET `/api/MediaDex/obterMediaPorUsuario`: biblioteca completa; filtros e paginação no cliente.
- PUT `/api/MediaDex/{id}`: JSON ou `FormData` com `ImagemUpload` e metadados. Números permanecem strings. Strings vazias limpam campos opcionais; `null` preservaria os valores no handler.
- Incremento: PUT com somente `nome` obrigatório e `capituloAtual`, sem reenviar metadados/capas.
- DELETE `/api/MediaDex/{id}`: após confirmação.
- PUT `/api/MediaDex/ordem`: `{ mediaIds: [guid, ...] }`, retorna `{ ordem: [{ id, ordemPersonalizada }] }`. Autenticação define o proprietário; IDs duplicados, vazios ou de outra conta são rejeitados antes de alterar dados. IDs próprios omitidos (ex.: obras criadas durante o modal) são anexados. Uma única transação EF salva posições.

URL de capa não vazia tem prioridade sobre `imagemDirectory`. Upload limpa `imagemUrl` e a consulta seguinte obtém o novo nome de arquivo. A remoção física da capa anterior não faz parte deste fluxo.

## Conclusão e ordem

`MediaCompletionRules.Apply` é executado no repositório antes de criar/atualizar. Total positivo e progresso real atingido resultam em Finalizado; `CapituloEsperadoAtual` não participa. O frontend espelha a regra somente após sucesso e na leitura legada. O +1 continua enviando apenas nome e progresso. Não reabre automaticamente obras finalizadas com progresso posteriormente reduzido.

`filterLibrary` prioriza ordem salva; sem posição, desempata por título natural e ID. `mergeVisibleOrder` substitui apenas as posições da seleção filtrada na ordem completa, conservando lugares ocultos. O modal usa todas as páginas da seleção. O servidor salva somente a ordem, preservando metadados e preferências de e-mail.

## Estado e concorrência

- Uma mutação por vez, com trava síncrona em ref e estado visual de envio. Outros cards bloqueiam ações durante a operação.
- Respostas antigas de consulta são invalidadas por versão; falhas preservam a coleção já carregada.
- Incremento e remoção atualizam a coleção local somente após sucesso. Edição aplica dados confirmados e recarrega a coleção para obter a capa enviada.
- Filtros ficam preservados durante as operações. Paginação é limitada ao intervalo válido quando a quantidade de resultados muda.
- Dia corrente calculado por `Intl.DateTimeFormat` no fuso `America/Sao_Paulo`, reavaliado por minuto e ao recuperar foco.
- Rotas mantidas: biblioteca em `/tabeladex`, adição em `/dashboard`; redirecionamentos de entrada apontam para a biblioteca.

## Verificação

Em `Client/financias-react`:

```bash
npm test
npm run lint
npm run build
```

A suíte `tests/library.test.js` cobre busca normalizada; filtros combinados; ordenação natural e por percentual com desconhecidos ao final; paginação após filtragem/remoção; zero/total desconhecido; limites e conclusão do incremento; ordenação pessoal antes da paginação; mesclagem da seleção filtrada; fronteira UTC/São Paulo; validação e payloads com limpeza explícita.

Conferência de interface com API simulada: paginação, combinação de filtros, clique repetido e falha no incremento, edição JSON, upload multipart, links, fallback local, remoção com falha/nova tentativa, carregamento com falha/nova tentativa, estados vazios, cadastro manual, login e redirecionamentos, perfil e calendário próprio/de terceiros. Conferir desktop, tablet e celular, foco/teclado e ausência de overflow horizontal. Persistência no servidor real deve ser validada em ambiente autenticado de homologação.

Testes relacionais de backend verificam conclusão na criação/atualização, limites/valores desconhecidos, isolamento por usuário, persistência da ordem, obras adicionadas durante a organização e rejeição sem alterações parciais.
