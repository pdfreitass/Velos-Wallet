<#
  Define (ou troca) a senha do role velos_api. Passo C7 do plano da spec 001.

  - Gera uma senha aleatória forte e grava a connection string SÓ no dotnet user-secrets
    da Velos.Api (fora do repositório).
  - Copia para a área de transferência o comando SQL com o HASH SCRAM-SHA-256 da senha:
    a senha em texto nunca vai para o SQL Editor, o histórico do painel ou os logs do banco.
  - Nada sensível aparece na tela.

  Pré-requisito: a migration 0007_api_role.sql já aplicada (npx supabase db push).

  Uso, na raiz do repositório:
      powershell -ExecutionPolicy Bypass -File scripts/set-api-db-password.ps1
  Depois: Supabase -> SQL Editor -> Ctrl+V -> Run.
#>
param(
    # Pooler de SESSÃO do projeto (Supabase -> Connect -> Session pooler).
    [string]$PoolerHost = 'aws-1-sa-east-1.pooler.supabase.com',
    [string]$ProjectRef = 'khvottmyspapwsdeqqnm'
)

$ErrorActionPreference = 'Stop'
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()

# Senha: 32 bytes aleatórios em base64, só com letras e números (não quebra a connection string).
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$password = [Convert]::ToBase64String($bytes) -replace '[+/=]', ''

# Hash SCRAM-SHA-256 no formato do Postgres (RFC 5802/7677, o mesmo cálculo do servidor).
$salt = New-Object byte[] 16
$rng.GetBytes($salt)
$iterations = 4096
$pbkdf2 = [Security.Cryptography.Rfc2898DeriveBytes]::new(
    $password, $salt, $iterations, [Security.Cryptography.HashAlgorithmName]::SHA256)
$saltedPassword = $pbkdf2.GetBytes(32)
$hmac = [Security.Cryptography.HMACSHA256]::new($saltedPassword)
$clientKey = $hmac.ComputeHash([Text.Encoding]::ASCII.GetBytes('Client Key'))
$serverKey = $hmac.ComputeHash([Text.Encoding]::ASCII.GetBytes('Server Key'))
$storedKey = [Security.Cryptography.SHA256]::Create().ComputeHash($clientKey)
$verifier = 'SCRAM-SHA-256$' + $iterations + ':' + [Convert]::ToBase64String($salt) + '$' +
    [Convert]::ToBase64String($storedKey) + ':' + [Convert]::ToBase64String($serverKey)

# Connection string só no user-secrets. O Out-Null evita que o dotnet repita o valor na tela.
$connectionString = "Host=$PoolerHost;Port=5432;Database=postgres;Username=velos_api.$ProjectRef;" +
    "Password=$password;SSL Mode=Require"
dotnet user-secrets set 'ConnectionStrings:Velos' $connectionString --project api/src/Velos.Api | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gravar no dotnet user-secrets (rode na raiz do repositório).' }

Set-Clipboard -Value "alter role velos_api with password '$verifier';"

Remove-Variable password, connectionString, bytes, saltedPassword
Write-Host 'Connection string gravada no dotnet user-secrets da Velos.Api.'
Write-Host 'Comando SQL (com o hash, não a senha) copiado. Supabase -> SQL Editor -> Ctrl+V -> Run.'
