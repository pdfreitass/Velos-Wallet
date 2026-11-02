# Certificado raiz do Supabase

`supabase-prod-ca-2021.crt` — **Supabase Root 2021 CA**, válido até 26/04/2031.

Baixado do painel em 2026-11-02 (*Settings → Database → SSL Configuration → Download certificate*),
que aponta para:

```
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt
```

> A URL curta `https://supabase.com/downloads/prod-ca-2021.crt`, que aparece em tutoriais antigos,
> hoje devolve **HTML** em vez do certificado. Se o download vier com ~15 KB em vez de ~1,4 KB,
> foi isso que aconteceu.

## Por que está versionado

Um certificado **raiz público** não é segredo: é o que permite *verificar* o servidor, não o que dá
acesso a ele. Está aqui para a imagem de produção poder usá-lo (spec 011, RN2).

O `SSL Mode=Require` de hoje **cifra mas não valida o servidor** — aceita qualquer certificado,
inclusive o de alguém no meio do caminho. O `VerifyFull` valida, e para isso precisa da raiz que
assinou o certificado do banco.

Isso é necessário porque o certificado do pooler é emitido pela **"Supabase Intermediate 2021 CA"**,
que **não** está nas CAs públicas do sistema. Sem esta raiz, o `VerifyFull` recusa a ligação.

## Como usar

Na connection string de produção, com o caminho dentro da imagem:

```
...;SSL Mode=VerifyFull;Root Certificate=/app/certs/supabase-prod-ca-2021.crt
```

O `Dockerfile` copia o arquivo para `/app/certs/`.

## Como conferir que ainda serve

```bash
openssl x509 -in supabase-prod-ca-2021.crt -noout -issuer -subject -dates

echo | openssl s_client -starttls postgres \
  -connect aws-1-sa-east-1.pooler.supabase.com:5432 \
  -servername aws-1-sa-east-1.pooler.supabase.com \
  -CAfile supabase-prod-ca-2021.crt 2>/dev/null | grep "Verify return code"
```

Deve dizer `Verify return code: 0 (ok)`. Em 2026-11-02 dizia.

## Quando mexer nisto

Quando o Supabase rodar a CA (o nome `2021` sugere que acontece), ou quando a validade se
aproximar de 2031. O sintoma de uma raiz errada é a API não conseguir falar com o banco **só em
produção**, enquanto em dev (com `SSL Mode=Require`) tudo funciona.
