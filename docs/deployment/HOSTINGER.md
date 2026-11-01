# MediaDex na Hostinger

O site usa Nginx e systemd no VPS existente. Os arquivos `web.config` de IIS não controlam essa instalação.

- Frontend: `https://mediadex.devporwillie.shop`, servido de `/var/www/mediadex/current`.
- API: `https://mediadexapi.devporwillie.shop`, proxy para `127.0.0.1:5095`.
- Releases: `/var/www/mediadex/releases/<data-UTC>`, `/var/www/mediadex-api/releases/<data-UTC>` e `/var/www/mediadex-worker/releases/<data-UTC>`.
- Serviços: `mediadex-api.service` e `mediadex-email.service`.
- Capas e fotos preservadas em `/var/www/image/mediaDex`, com `StorageSettings:Provider=Local`.
- Configuração de cada release em `appsettings.json`, fora do diretório público do frontend. Arquivos com credenciais são legíveis apenas por root e pelo grupo www-data. A conexão SQL existente é preservada; configurações locais de desenvolvimento não são publicadas.
- Frontend compilado com `Client/financias-react/.env.production`: `VITE_PRODUCAO=https://mediadexapi.devporwillie.shop/api`. A variável é definida explicitamente no arquivo de produção.

## Publicação

Antes da troca, compilar frontend/API/worker e executar testes; conferir migrations contra a conexão de produção antes de iniciar a API nova. Publicar API e worker como self-contained para linux-x64, evitando depender do runtime global do servidor. O projeto exclui fontes do frontend e `appsettings.Development.json` do pacote da API.

Enviar para uma nova pasta de release. Guardar as configurações anteriores em `/var/backups/mediadex/<data-UTC>`, testar a API candidata em loopback/porta 5096, validar `nginx -t`, trocar os links `current` e reiniciar a API. O drop-in `/etc/systemd/system/mediadex-api.service.d/release.conf` aponta para o executável self-contained atual. Os certificados TLS e domínios existentes são preservados.

Nginx encaminha `X-Forwarded-For` e `X-Forwarded-Proto`. A API confia no proxy local e usa a URL de escuta do appsettings. Erros de desenvolvimento ficam restritos ao ambiente Development. A configuração pública permite uploads de até 20 MB; a aplicação continua responsável por suas validações. O index não fica em cache; assets com hash têm cache longo.

Após a troca, conferir HTTPS, rotas diretas, login/cookie/CORS, leitura do perfil, upload/leitura de capa, incremento com conclusão automática e persistência da ordem. Quando usar conta temporária de teste, desativar seus e-mails e remover obras, conta e arquivos de upload ao final.

## E-mails

Worker publicado separadamente, com o mesmo banco da API e a arquitetura descrita em [docs/email/README.md](../email/README.md). O broker `mediadex-rabbitmq` tem volume próprio e expõe somente `127.0.0.1:5672`; não altera os serviços/filas do GymFlow. Credenciais do broker ficam em `/etc/mediadex/rabbitmq.env`, acessível somente por root.

O horário é `ReleaseReminders:SendHour=12`, em America/Sao_Paulo. O nome do remetente é MediaDex. As preferências gerais e por obra continuam na conta do usuário.

Os envios estão habilitados com uma chave exclusiva do MediaDex, autenticada no Brevo, e o remetente ativo existente na mesma conta. Após a ativação, o serviço confirmou respostas HTTP 201 do Brevo, consumidor conectado e ausência de erros de execução. Aceite do provedor não confirma chegada à caixa de entrada. A configuração persistente fica em `/etc/mediadex/email.env`, com permissão 600/root, carregada por `/etc/systemd/system/mediadex-email.service.d/credentials.conf`. As variáveis desse arquivo prevalecem sobre o appsettings de cada release, preservando a credencial nas próximas publicações. A chave não é copiada para o Git, frontend ou appsettings da API.

O erro 401 inicial incluía bloqueio do IPv6 do VPS pelo controle de IPs do Brevo. A validação pelo IPv4 funcionou; o worker usa `DOTNET_SYSTEM_NET_DISABLEIPV6=1`, restrito ao serviço. A política de IPs do Brevo foi preservada. A documentação da Microsoft descreve [essa variável de rede](https://learn.microsoft.com/pt-br/dotnet/core/tools/dotnet-environment-variables).

Para trocar a credencial:

1. Na mesma conta Brevo, gerar uma chave exclusiva para MediaDex. Selecionar acesso restrito com Transactional email/All e Account/Read; confirmar remetente validado.
2. Atualizar `Brevo__ApiKey` e `Brevo__SenderEmail` em `/etc/mediadex/email.env`, preservando as permissões do arquivo, sem copiar credenciais para o Git ou para o frontend.
3. Validar autenticação e remetente; manter `ReleaseReminders__Enabled=true` e `ReleaseReminders__SendHour=12`; reiniciar `mediadex-email`.
4. Conferir o serviço, consumidor da fila e logs, sem publicar chaves ou destinatários. Para pausar o envio, alterar `ReleaseReminders__Enabled=false` nesse arquivo e reiniciar o worker.

Ao ativar depois das 12h, o scheduler pode recuperar os lembretes elegíveis do mesmo dia; datas anteriores são descartadas.

## Conferência das configurações de produção

A release inclui appsettings próprios para API e worker, preservando a mesma conexão SQL e o storage compartilhado. `appsettings.Development.json` fica fora dos pacotes publicados. As credenciais Brevo continuam em `/etc/mediadex/email.env`; o appsettings mantém remetente, nome e horário, com chave vazia para receber o valor protegido do serviço.

A auditoria de publicação confere hashes dos arquivos compilados contra o pacote enviado, destino dos três links current, ambiente Production e diretório dos processos em execução, igualdade da conexão SQL, storage, permissões dos arquivos e carregamento efetivo da configuração de e-mail pelo worker. O relatório sem segredos fica em `/var/www/mediadex-deploy/<release>/production-audit.json`. A configuração anterior e os destinos anteriores ficam em `/var/backups/mediadex/<release>`.

## Verificação e retorno

```bash
systemctl is-active mediadex-api mediadex-email
nginx -t
curl -I https://mediadex.devporwillie.shop
curl -I https://mediadexapi.devporwillie.shop/swagger/v1/swagger.json
```

Para voltar a uma release já publicada, apontar `current` para a pasta anterior da API/frontend/worker e reiniciar os serviços afetados. Não reverter migrations automaticamente. A instalação anterior à primeira organização em releases permanece no diretório original; `/opt/mediadex-dotnet/dotnet` contém um runtime ASP.NET 8 privado para executá-la caso seja necessário, sem depender do runtime global incompleto.
