DECLARE
	@clientId INT
	, @clientIdJS INT

SELECT @clientId = id FROM IDS_Clients WHERE ClientId = '$ClientIdMvc$'

SELECT @clientIdJS = id FROM IDS_Clients WHERE ClientId = '$ClientIdJs$'


IF(NOT EXISTS(SELECT * FROM IDS_ClientCorsOrigins AS icco WHERE icco.ClientId = @clientId AND icco.Origin = '$UrlNotificacoes$'))
BEGIN
	INSERT INTO IDS_ClientCorsOrigins (ClientId, Origin) VALUES (@clientId, '$UrlNotificacoes$')
END

IF(NOT EXISTS(SELECT * FROM IDS_ClientCorsOrigins AS icco WHERE icco.ClientId = @clientId AND icco.Origin = '$UrlNotificacoesAPI$'))
BEGIN
	INSERT INTO IDS_ClientCorsOrigins (ClientId, Origin) VALUES (@clientId, '$UrlNotificacoesAPI$')
END

IF(NOT EXISTS(SELECT * FROM IDS_ClientCorsOrigins AS icco WHERE icco.ClientId = @clientIdJS AND icco.Origin = '$UrlCore$'))
BEGIN
	INSERT INTO IDS_ClientCorsOrigins (ClientId, Origin) VALUES (@clientIdJS, '$UrlCore$')
END


IF(NOT EXISTS(SELECT * FROM IDS_ClientRedirectUris AS icru WHERE icru.ClientId = @clientIdJS AND icru.RedirectUri = '$UrlNotificacoesUri$'))
BEGIN
	INSERT INTO IDS_ClientRedirectUris (ClientId, RedirectUri) VALUES (@clientIdJS, '$UrlNotificacoesUri$')
END


IF(NOT EXISTS(SELECT * FROM IDS_ClientPostLogoutRedirectUris AS icplru WHERE icplru.ClientId = @clientId AND icplru.PostLogoutRedirectUri = '$UrlNotificacoesUri$'))
BEGIN
	INSERT INTO IDS_ClientPostLogoutRedirectUris (ClientId, PostLogoutRedirectUri) VALUES (@clientId, '$UrlNotificacoesUri$')
END