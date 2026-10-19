# 02 · Auditoria técnica

> Método: leitura de `CLAUDE.md`, `docs/` (ROADMAP, ARQUITETURA, VISAO, LICOES, CHANGELOG, ADRs 6–8), `PRODUCT.md`, das 8 migrations, de `Program.cs`, `UserDbSession`, `VelosDbContext`, `ProfileReader`, middlewares, `MeController`, `router.tsx`, `PanelPage`, `api/client.ts`, helpers de dinheiro/data, `package.json`/`csproj`, e contagem de testes. Os demais arquivos de auth e da landing foram inspecionados por amostragem, não linha a linha.
> **Não verificado por execução:** build, testes, lint, typecheck e o app rodando.

## 1. Stack e versões (conforme manifestos)

| Camada | Tecnologia | Versão |
|---|---|---|
| API | ASP.NET Core, Controllers, Clean Architecture em 4 projetos | .NET 10 (`net10.0`), `Nullable` + `TreatWarningsAsErrors` |
| Dados | EF Core + Npgsql (só mapeia, sem migrations; hoje só `SqlQuery`) | Npgsql.EFCore 10.0.3 |
| Validação | FluentValidation | 12.2.0 |
| Auth | JwtBearer (ES256 via OpenID Discovery) + Supabase GoTrue REST | 10.0.12 |
| Front | React 19.3, Vite 8, TypeScript ~6.0, React Router 8, TanStack Query 5 | — |
| UI | Tailwind 4, shadcn sobre `@base-ui/react` 1.9, lucide, RHF + Zod 4, date-fns 4 | — |
| Banco | Supabase Postgres 17, sa-east-1, 8 migrations aplicadas | — |

Sem Recharts instalado (planejado para a Etapa 6). A raiz tem só a CLI do Supabase.

## 2. Estrutura e arquitetura

```
api/src: Domain (5 arquivos de auth) → Application (casos de uso de auth + Profiles)
         → Infrastructure (UserDbSession, LoginLockoutStore, ProfileReader, SupabaseAuthClient) → Api
web/src: pages (8) · features/auth, landing, showcase · components/ui|shared|brand · lib/api|utils|validations
supabase/migrations: 0001–0008 · templates de email
```

**Avaliação:** a arquitetura real bate com a documentada. Os testes `ArchitectureTests` (um em `Domain.Tests`, um em `Application.Tests`) protegem a regra "dependências só para dentro". A separação por feature no front está limpa.

**Observação importante:** **todo o código de domínio é de autenticação.** `Velos.Domain` tem `EmailAddress`, `PasswordPolicy`, `PkcePair`, `LoginLockoutPolicy`. Nada de `Money`, `Account`, `Transaction`. Isso não é defeito, é o estágio. Mas a primeira decisão da Etapa 4/5 é *onde* mora a regra financeira (ver 02 §6).

## 3. Segurança (o que existe)

| Controle | Evidência | Estado |
|---|---|---|
| Rotas privadas por padrão | `FallbackPolicy` (ADR 0015); `/api/{**path}` devolve 404 JSON; SPA com `AllowAnonymous` explícito (`Program.cs:75-79`) | ✔ |
| Sessão | cookies `velos_at`/`velos_rt`, `HttpOnly; Secure; SameSite=Lax` (`SessionCookies.cs:45-47`); nada em `localStorage` | ✔ |
| CSRF | header `X-Velos-Csrf: 1` em toda mutação em `/api`, antes do refresh (`CsrfHeaderMiddleware`) + `SameSite=Lax` | ✔ |
| Isolamento | role `velos_api` `noinherit nobypassrls`; `UserDbSession` com `set_config(..., true)`; filtro por `userId` na Application + RLS | ✔ |
| Segredos | só a chave **publicável** está em `appsettings.json` (não é segredo; documentado); connection string em user-secrets/variável; `.env*` ignorado | ✔ |
| Limite de taxa | por IP, janela fixa (10/min auth; 3/15 min reset) | ✔ com ressalva (§3.1) |
| Bloqueio de login | `reserve_login_attempt` atômico, hash sha256 do email, vale para email sem conta | ✔ |
| Cabeçalhos | `nosniff`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `Referrer-Policy`, HSTS fora de Development | ✔ parcial (§3.1) |
| Logs | só endpoint, status e `code` do Supabase; sem email, senha ou token | ✔ |
| Erros | `ProblemDetails` com `code` estável; JSON malformado vira mensagem genérica | ✔ |
| Data API do Supabase | desligada (documentado) | ✔ por documentação; **não verificado ao vivo** |

### 3.1 Ressalvas de segurança

| ID | Achado | Impacto | Pri. |
|---|---|---|---|
| S-01 | **Confirmação de email desligada** (Revisão 1 da spec 001). Qualquer um registra uma conta com o email de terceiros ("pre-hijacking"); se a vítima depois entrar com Google no mesmo email, os cenários de vinculação ficam sensíveis | Tomada/impersonação de conta antes do lançamento | **P0 p/ produção** |
| S-02 | Limite de taxa em **memória do processo** e janela fixa: não escala para 2+ instâncias e permite rajada de 2× no limite da janela | Baixo no MVP (1 instância) | P3 |
| S-03 | CSP é só `frame-ancestors 'none'`. Não há `default-src`/`script-src` | Sem defesa em profundidade contra XSS | P2 |
| S-04 | `AllowedHosts: "*"` em `appsettings.json` (já no checklist de deploy) | Aceita qualquer `Host` | P0 p/ produção |
| S-05 | `SSL Mode=Require` (não `VerifyFull`); `ForwardedHeaders` não restrito; chaves do Data Protection não persistidas (todos já no ROADMAP) | Deploy | P0 p/ produção |
| S-06 | O bloqueio por email permite que um atacante **trave o login de uma vítima** (5 erros → 10 min). É um trade-off aceito no ADR 0014, mas deve estar na lista de riscos conhecidos | DoS direcionado, baixo | P2 |
| S-07 | Não existe forma de **excluir a conta** nem **exportar os dados** (LGPD) | Obrigação legal ao operar com público brasileiro | P1 antes do público |
| S-08 | Sem trilha de auditoria de ações sensíveis (troca de senha, login de novo dispositivo) | Detecção de abuso | P3 |

## 4. Testes

| Projeto | Métodos `[Fact]/[Theory]` | O que cobre |
|---|---|---|
| Domain.Tests | 14 | EmailAddress, PasswordPolicy, PkcePair, LoginLockoutPolicy, arquitetura |
| Application.Tests | 39 | handlers de SignIn/SignUp/Google/PasswordReset, AuthErrors, SafeRedirect, arquitetura |
| Infrastructure.IntegrationTests | 7 | `UserDbSession` contra o banco real (anon sem acesso, isolamento, rollback, reset de role) |
| **Front** | **0** | nada (sem Vitest/Jest/Playwright) |

Os docs afirmam "120 testes"; eu contei **60 métodos**. A diferença bate com os casos de `[Theory]`/`InlineData`, mas **não confirmei o número 120 executando**.

**Lacunas de teste:**
- Nenhum teste de endpoint (`WebApplicationFactory`/`TestServer` não aparecem): `FallbackPolicy`, CSRF, `/api/{**path}`, cabeçalhos e rate limit são verificados só por leitura e pelos testes manuais da spec. **P1.**
- Nenhum teste do front, nem dos helpers de dinheiro e data (a regra mais crítica do produto). **P1.**
- Testes de integração tocam o **banco de produção** (único projeto Supabase; `DatabaseFactAttribute` indica que pulam sem connection string). Não li o `TestDatabase` a fundo; **confirmar que nenhum teste grava dados persistentes** antes de ampliar. **P1.**
- Não há como testar views (`account_balances`, `monthly_summary`) sem dados de teste isolados. Ver [09](09-testing-strategy.md).

## 5. Qualidade de código

- **Tamanho de arquivos** (regra do projeto: ~150 linhas): maiores no API são `AuthController` (188), `SupabaseAuthClient` (179); no front `useConvergeStage` (169), `SignInForm` (157), `StepArtifacts` (153), `showcase-data.ts` (152). Os três primeiros já estão na pendência T12. Nada grave.
- **Duplicação:** `result.Error!` repetido nos controllers (T12). Sem outra duplicação relevante vista.
- **Código morto / TODO:** nenhum TODO/FIXME no código-fonte. `cn` (pacote npm) está em `dependencies` ao lado de `clsx`/`tailwind-merge`? **Não verifiquei**: o pacote `cn` é um nome suspeito de duplicar `lib/utils.ts#cn`; conferir se é usado (candidato a dependência desnecessária, **P3**).
- **EF Core:** é usado só com `Database.SqlQuery` e SQL cru; não há entidades mapeadas. Funciona, mas a Etapa 4/5 vai precisar decidir entre continuar com SQL cru (simples, mantém tudo explícito) ou mapear entidades. Ver §6.
- **Artefatos de build** (`bin/`, `obj/`, `web/dist/`) existem na pasta mas estão no `.gitignore`. ✔

## 6. Decisões técnicas que a Etapa 4/5 vai forçar

1. **Onde mora a regra financeira?** Regra do projeto: somas no SQL (views). Para o resto (criar transação, validar combinação tipo/categoria/conta, transferência), a `Application` valida com FluentValidation e o banco reforça com CHECK/FK. Recomendo **não** criar camada de "saldo" no C#.
2. **Acesso a dados:** manter `UserDbSession` + SQL parametrizado (como `ProfileReader`) em vez de mapear entidades EF, pelo menos até haver mais de ~3 consultas por recurso. Mantém a "falha fechada". Documentar em ADR.
3. **Paginação:** a lista de transações cresce sem limite; precisa de paginação por cursor (`date desc, id`) desde o início. O índice `(user_id, date desc)` já existe.
4. **Valores monetários na borda:** o JSON deve carregar centavos como `number` inteiro; validar teto no servidor (ver [05 · FI-07](05-financial-integrity.md)).
5. **Datas:** todo campo de data vem do cliente já como `yyyy-MM-dd`; a API nunca usa `current_date`/`DateTime.Now` para decidir o dia do usuário.

## 7. Infraestrutura e entrega

| Item | Estado |
|---|---|
| CI/CD | **Ausente** (`.github/` não existe). A regra "só dizer pronto se build/test/typecheck/lint/build passarem" depende de disciplina manual |
| Deploy | **A DEFINIR** (Azure *Brazil South* ou Fly.io `gru`) |
| Observabilidade | Só `ILogger` padrão; sem correlação de request, métricas, rastreio ou alerta. `HealthController` existe (conteúdo não inspecionado) |
| Backup/recuperação | Não documentado. O plano Free do Supabase **não** inclui backups diários com restauração pontual |
| Migrations | Só por arquivo + `supabase db push` (✔ ADR 0012). Sem ambiente de staging: `db push` altera produção direto |
| Ambientes | Um único projeto Supabase para dev, testes de integração e produção |

**Achado relevante (P1):** não existe um segundo ambiente. Quando houver usuários reais, rodar testes de integração e migrations experimentais no mesmo banco é um risco. Recomendo, antes do deploy, um projeto Supabase separado para testes (ou *branching*) e backup habilitado.

## 8. Resumo dos problemas concretos

| ID | Problema | Pri. |
|---|---|---|
| T-01 | Sem CI | P1 |
| T-02 | Zero testes no front | P1 |
| T-03 | Zero testes de endpoint na API | P1 |
| T-04 | Dev, testes e produção no mesmo banco; sem backup documentado | P1 |
| T-05 | Confirmação de email desligada (S-01) | P0 p/ produção |
| T-06 | Checklist de deploy pendente (S-04, S-05) | P0 p/ produção |
| T-07 | Sem exclusão/exportação de dados (S-07) | P1 |
| T-08 | CSP mínima (S-03) | P2 |
| T-09 | Pacote `cn` possivelmente redundante | P3 |
| T-10 | Observabilidade mínima | P2 |
