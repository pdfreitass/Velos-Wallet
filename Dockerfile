# Velos Wallet — imagem de producao (spec 011, ADR 0020).
#
# Um processo so: a API serve o build do Vite em wwwroot, na mesma origem (ADR 0013). E por isso
# que a sessao vive num cookie httpOnly sem CORS, entao front e API tem de viajar juntos.
#
# NENHUM SEGREDO ENTRA AQUI (RN7). Connection string e afins chegam por variavel de ambiente,
# postas com `fly secrets set`.

# ---------- 1. build do front ----------
FROM node:24-alpine AS web
WORKDIR /src/web

# O lockfile primeiro: enquanto ele nao mudar, esta camada vem do cache.
COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./
# `npm run build` = `tsc -b && vite build`: o deploy quebra se os tipos quebrarem.
RUN npm run build

# ---------- 2. build da API ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS api
WORKDIR /src

# Mesma ideia: restore numa camada propria, com so o que ele precisa ler.
COPY api/Directory.Build.props api/Velos.slnx ./api/
COPY api/src/Velos.Api/Velos.Api.csproj ./api/src/Velos.Api/
COPY api/src/Velos.Application/Velos.Application.csproj ./api/src/Velos.Application/
COPY api/src/Velos.Domain/Velos.Domain.csproj ./api/src/Velos.Domain/
COPY api/src/Velos.Infrastructure/Velos.Infrastructure.csproj ./api/src/Velos.Infrastructure/
RUN dotnet restore api/src/Velos.Api/Velos.Api.csproj

COPY api/ ./api/
RUN dotnet publish api/src/Velos.Api/Velos.Api.csproj -c Release -o /app --no-restore

# O build do front entra como wwwroot. Vem depois do publish de proposito: assim mexer no front
# nao invalida a camada do publish da API.
COPY --from=web /src/web/dist /app/wwwroot

# ---------- 3. imagem final ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
WORKDIR /app

# O que a imagem Alpine NAO traz, e o app precisa. Faltou as duas coisas em producao no
# 2026-11-03, uma de cada vez:
#
# - `tzdata`: sem /usr/share/zoneinfo o `America/Sao_Paulo` do TransactionRules nao existe.
# - `icu-libs` + `icu-data-full`: sem ICU, a imagem liga o modo invariante de globalizacao e o
#   `CultureInfo.GetCultureInfo("pt-BR")` do PgEnums lanca CultureNotFoundException.
#
# Nos dois casos quem lanca e um inicializador estatico, e ai o tipo fica quebrado para o resto
# da vida do processo: todo endpoint que o toque devolve 500, enquanto o /api/health, que nao
# toca no dominio, segue verde e o Fly considera a maquina saudavel.
RUN apk add --no-cache tzdata icu-libs icu-data-full

# A imagem da Microsoft define DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=true, porque sem ICU nao ha
# alternativa. A variavel de ambiente GANHA do <InvariantGlobalization>false</InvariantGlobalization>
# do Directory.Build.props — foi por isso que o projeto parecia configurado certo e nao estava.
# Instalado o ICU acima, desligamos o modo aqui.
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

# RN8: sem privilegio. O usuario `app` ja vem na imagem da Microsoft.
# O volume das chaves do Data Protection (RN3) e montado em /data pelo fly.toml, e precisa
# de ser gravavel por ele — o diretorio e criado aqui para o dono ficar certo mesmo que o
# volume venha vazio.
RUN mkdir -p /data/keys && chown -R app:app /data

COPY --from=api --chown=app:app /app ./

# Certificado raiz do Supabase (publico, versionado em api/src/Velos.Api/certs/).
# E necessario para o `SSL Mode=VerifyFull` da connection string: o certificado do pooler e
# emitido pela "Supabase Intermediate 2021 CA", que NAO esta nas CAs publicas do sistema, entao
# sem esta raiz o VerifyFull recusa a ligacao. Conferido com openssl em 2026-11-02:
# `Verification: OK` contra este arquivo.
COPY --chown=app:app api/src/Velos.Api/certs/supabase-prod-ca-2021.crt /app/certs/

USER app

# O Fly manda tudo para esta porta (fly.toml -> internal_port).
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Velos.Api.dll"]
