# TDD - Tela Minhas Obras (`/tabeladex`)

## 1. Arquitetura técnica (atual)
- UI em `MaterialReactTable` + componentes MUI.
- Modais separados para edição e confirmação de exclusão.
- Estratégia de update dual:
  - `multipart/form-data` quando há upload de arquivo.
  - JSON quando somente metadados mudam.

## 2. Dependências e relações de arquivo
## Front-end
- `Client/financias-react/src/pages/TabelaDex.jsx`
- `Client/financias-react/src/utils/api.js`

## Back-end
- `Presentation/MediaDexController.cs`
- `Application/Commands/EditMediaCommand.cs`
- `Application/Validators/EditMediaCommandValidator.cs`
- `Application/Handlers/Media/EditMediaCommandHandler.cs`
- `Application/Handlers/Media/MediaDexQueryCommandHandle.cs`
- `Application/Handlers/Media/MediaDexQueryDeleteCommandHandle.cs`
- `Repository/MediaRepository.cs`

## 3. Matriz arquivo -> funcionalidade
- `Client/financias-react/src/pages/TabelaDex.jsx`: renderiza tabela, abre modais, edita e remove obras.
- `Client/financias-react/src/utils/api.js`: executa requests autenticadas para MediaDex.
- `Presentation/MediaDexController.cs`: expõe listagem, edição (JSON/form-data) e exclusão.
- `Application/Commands/EditMediaCommand.cs`: contrato de entrada para atualização.
- `Application/Validators/EditMediaCommandValidator.cs`: exige `Nome` na edição.
- `Application/Handlers/Media/EditMediaCommandHandler.cs`: processa upload de imagem e persistência.
- `Application/Handlers/Media/MediaDexQueryDeleteCommandHandle.cs`: executa remoção por ID.
- `Repository/MediaRepository.cs`: operações EF de leitura/atualização/exclusão.

## 4. Contratos técnicos
- `GET /api/MediaDex/obterMediaPorUsuario`.
- `PUT /api/MediaDex/{guid}` com `multipart/form-data` ou JSON.
- `DELETE /api/MediaDex/{guid}`.

### Payload form-data (edição com arquivo)
- `ImagemUpload`
- `setUrlInput` (fallback para URL)
- `nome`
- `totalCapitulos`
- `capituloAtual`
- `diaNovoCapitulo`
- `status`
- `tipoMidia`

### Payload JSON (edição sem arquivo)
- objeto `selectedItem` com `imagemUrl` atualizado.

## 5. Sequência técnica resumida
1. `fetchData` carrega acervo do usuário.
2. `handleEdit` popular modal.
3. `handleSave` escolhe estratégia de payload.
4. Backend monta `EditMediaCommand` (form ou JSON) e persiste via repositório.
5. `handleConfirmDelete` remove item por ID.

## 6. Riscos e dívidas técnicas atuais
- Front envia `Authorization` com token do `localStorage`, mas fluxo atual usa cookie.
- `DELETE` no backend remove por ID sem validar propriedade do usuário.
- Campos numéricos permanecem string no domínio.
- Em upload, campo `setUrlInput` existe por compatibilidade e aumenta acoplamento front/back.

## 7. Casos técnicos de teste recomendados
- `TC-MO-001`: editar registro usando JSON.
- `TC-MO-002`: editar registro usando upload de arquivo.
- `TC-MO-003`: remover registro e validar atualização na tabela.
- `TC-MO-004`: validar rejeição de edição sem nome (validator back).
- `TC-MO-005`: validar segurança de exclusão por usuário (teste de autorização).
