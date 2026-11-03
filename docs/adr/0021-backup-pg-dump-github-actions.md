# ADR 0021 — Backup do banco com pg_dump agendado no GitHub Actions

- **Status:** Aceita
- **Data:** 2026-11-03
- **Etapa:** Infraestrutura (pré-divulgação)

## Contexto

O Supabase está no plano **free**, que não inclui backup automático nem PITR. Se o banco for
corrompido ou o projeto pausar/apagar, os dados financeiros dos usuários somem sem volta — é o
único risco do projeto que não tem remediação depois.

Restrições que moldaram a decisão:

- A conexão direta (`db.<ref>.supabase.co`) é **IPv6-only** no plano free, e os runners
  hospedados do GitHub são **IPv4-only**. O caminho suportado é o **pooler de sessão**
  (`aws-1-sa-east-1.pooler.supabase.com:5432`, usuário `postgres.<ref>`).
- O servidor é **Postgres 17.11**; o runner do GitHub só traz o cliente 16, e `pg_dump` mais
  antigo que o servidor se recusa a rodar.
- O repositório é **público**: um dump em texto puro como artefato do Actions vazaria dados
  financeiros de todos os usuários.
- Regras do projeto: segredos nunca em commit nem em chat; infraestrutura em São Paulo; o
  `postgres` é o único role capaz de ler o schema `auth` no Supabase hospedado.

## Decisão

Um workflow do GitHub Actions roda **diariamente às 03:00 UTC (00:00 em São Paulo)** e sob
demanda (`workflow_dispatch`): instala o `postgresql-client-17`, despeja o banco com
`pg_dump --format=custom --no-owner --no-privileges` pelo pooler de sessão, confere o arquivo
com `pg_restore --list`, **cifra com GPG simétrico (AES256)** usando uma frase que vive só nas
Actions secrets, e sobe o `.gpg` como artefato. Se qualquer passo falhar, o workflow **abre uma
issue automaticamente**.

O dump inclui `public` (dados financeiros), `auth` (contas e identidades) e
`supabase_migrations` (histórico de migrations); exclui apenas os schemas gerenciados pela
plataforma (`storage`, `realtime`, `vault`, `extensions`, `cron`, `pgsodium`, etc.).

Os dois segredos são criados pelo Pedro em *Settings → Secrets and variables → Actions*:

- `SUPABASE_DB_PASSWORD` — a senha do banco (a mesma usada no `supabase link`).
- `BACKUP_PASSPHRASE` — frase nova, forte e exclusiva para o backup.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Tarefa agendada no Windows (Task Scheduler) | Depende do PC do Pedro estar ligado na hora; fácil de esquecer |
| `supabase db dump` da CLI no workflow | O default é schema-only; exige Docker no runner e senha percent-encoded no `--db-url` |
| Serviço de backup de terceiros | Pago e mais um serviço para vigiar |
| Artefato em texto puro | Repo público: vazaria dados financeiros de todos |
| Enviar o `.gpg` para S3/R2/B2 | Bom destino de longo prazo, mas mais um serviço; revisitar se 90 dias ficar curto |

## Consequências

- **Positivas:** perda máxima de 24h de dados; custo zero; roda sozinho; falha vira issue (o
  aviso que faltava); o artefato é cifrado, então pode ficar num repo público.
- **Negativas / riscos aceitos:** a retenção de artefatos é de 90 dias — não é arquivo de longo
  prazo; restaurar `auth` num projeto **novo** só funciona com os mesmos segredos de auth
  (senhas são cifradas com chaves do projeto); o backup depende do GitHub Actions estar de pé e
  dos dois segredos existirem.
- **O que passa a ser regra:** o workflow `backup.yml` não pode ser desligado sem substituto;
  `SUPABASE_DB_PASSWORD` e `BACKUP_PASSPHRASE` existem só nas Actions secrets, nunca em arquivo
  do repo nem em conversa.

## Restauração (como usar o backup)

Em todos os casos, primeiro baixar o artefato da execução e decifrar (no Git Bash, que já traz
`gpg`):

```bash
gpg --batch --decrypt --passphrase "$BACKUP_PASSPHRASE" \
  -o velos-backup.dump velos-backup-AAAA-MM-DD.dump.gpg
```

Conferir o conteúdo:

```bash
docker run --rm -v "$(pwd):/backup" postgres:17 pg_restore --list /backup/velos-backup.dump
```

### Cenário 1 — dados apagados por engano no MESMO projeto (o mais comum)

Restaurar **só os dados** do schema `public`. As tabelas, grants e RLS continuam como estão:

```bash
docker run --rm -v "$(pwd):/backup" -e PGPASSWORD='senha' postgres:17 \
  pg_restore --data-only --no-owner --no-privileges --schema=public \
  --dbname="postgresql://postgres.khvottmyspapwsdeqqnm@aws-1-sa-east-1.pooler.supabase.com:5432/postgres" \
  /backup/velos-backup.dump
```

Para restaurar uma tabela só, acrescentar `--table=public.transactions` (ou o nome desejado).

### Cenário 2 — projeto novo (último recurso)

1. Criar o projeto novo em `sa-east-1` e aplicar as migrations: `npx supabase db push`.
2. Restaurar os dados de `public` e `auth`:

```bash
docker run --rm -v "$(pwd):/backup" -e PGPASSWORD='senha' postgres:17 \
  pg_restore --data-only --no-owner --no-privileges \
  --dbname="postgresql://postgres.<ref-novo>@aws-0-<regiao>.pooler.supabase.com:5432/postgres" \
  /backup/velos-backup.dump
```

**Ressalvas do auth:** as senhas e identidades do `auth.users` são cifradas com segredos do
projeto de origem. Num projeto novo com segredos diferentes, ninguém consegue entrar com a
senha antiga — é preciso redefinir senhas e religar o Google OAuth. Por isso este é o último
recurso, e o login real tem de ser testado depois.

## Quando revisitar

- Quando o Supabase passar ao **plano pago** (backup diário e PITR incluídos) — esta decisão
  pode ser substituída.
- Se o dump diário passar de ~20 min ou o banco crescer para perto de 1 GB.
- Se 90 dias de retenção ficarem curtos — mover os `.gpg` para R2/B2 e ajustar o workflow.
