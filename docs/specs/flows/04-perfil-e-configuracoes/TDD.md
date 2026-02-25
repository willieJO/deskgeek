# TDD - Fluxo 04: Perfil e Configuracoes

## Arquitetura tecnica
- Front: `main.jsx` (sessao + rotas), `AuthenticatedLayout.jsx` (menu/avatar), `Configuracoes.jsx` (formularios).
- Back: `UsuarioController` + MediatR + `IUsuarioRepository`.
- Upload de foto reutiliza `Shared/UploadService`.

## Contratos usados
- `GET /api/Usuario/me`
- `PUT /api/Usuario/me/nome`
- `PUT /api/Usuario/me/senha`
- `PUT /api/Usuario/me/foto` (multipart)
- `GET /api/Usuario/me/foto`

## Matriz arquivo -> funcionalidade
- `Client/financias-react/src/main.jsx`: carrega sessao atual e repassa `currentUser`.
- `Client/financias-react/src/components/AuthenticatedLayout.jsx`: menu lateral com `Configurações` + avatar/nome.
- `Client/financias-react/src/pages/Configuracoes.jsx`: UI de perfil com 3 cards independentes.
- `Presentation/UsuarioController.cs`: endpoints `/me/*`.
- `Application/Commands/UpdateUsuario*Command.cs`: contratos de entrada por operacao.
- `Application/Validators/UpdateUsuario*CommandValidator.cs`: regras de validacao.
- `Application/Handlers/User/UpdateUsuario*CommandHandler.cs`: regras de negocio e persistencia.
- `Repository/UsuarioRepository.cs`: operacoes granulares de atualizacao de perfil.
- `Domain/User.cs`: persistencia de `FotoPerfilArquivo`.

## Riscos tecnicos atuais
- Foto de perfil usa mesma infra de storage de imagens do `MediaDex`.
- Substituicao de foto nao remove arquivo anterior (potencial arquivo orfao).
- Endpoint legado `PUT /api/Usuario/{id}` permanece no controller.

## Testes recomendados
- `GET /me` retorna `usuario` e `fotoPerfilDisponivel`.
- `PUT /me/nome` rejeita nome duplicado e aceita nome valido.
- `PUT /me/senha` rejeita senha atual invalida.
- `PUT /me/foto` rejeita formato/tamanho invalido.
- `GET /me/foto` retorna `404` quando sem foto.
