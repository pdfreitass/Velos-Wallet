using System.Globalization;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Velos.Api.Auth;
using Velos.Api.Configuration;
using Velos.Api.Http;
using Velos.Application;
using Velos.Application.Abstractions;
using Velos.Domain.Transactions;
using Velos.Infrastructure;
using Velos.Infrastructure.Supabase;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    // Enums como texto em camelCase ("creditCard", "expense"), nunca como número. Na entrada os
    // controllers recebem string e convertem com ApiEnums (erro de campo em português).
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(
        new JsonStringEnumConverter(ApiEnums.Naming, allowIntegerValues: false)))
    .ConfigureApiBehaviorOptions(options =>
    // Corpo ilegível (JSON malformado): resposta genérica, sem repassar a mensagem interna do parser.
    // As regras de campo de verdade são do FluentValidation, com mensagens em português.
    options.InvalidModelStateResponseFactory = context =>
    {
        var factory = context.HttpContext.RequestServices.GetRequiredService<ProblemDetailsFactory>();
        var problem = factory.CreateProblemDetails(
            context.HttpContext, StatusCodes.Status400BadRequest, detail: "Requisição inválida.");
        return new BadRequestObjectResult(problem) { ContentTypes = { "application/problem+json" } };
    });
// Todo erro sai como ProblemDetails (RFC 9457) com um "code" estável, nunca como página HTML ou stack trace.
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
    context.ProblemDetails.Extensions.TryAdd("code", ApiProblems.DefaultCode(context.ProblemDetails.Status)));
builder.Services.AddVelosAuthentication(builder.Configuration);
builder.Services.AddVelosRateLimiting();
// Produção (spec 011): chaves do cookie num volume, para o redeploy não deslogar ninguém, e
// cabeçalhos de proxy aceitos só do proxy do host. Sem a configuração, nenhum dos dois faz nada.
builder.Services.AddVelosDataProtection(builder.Configuration);
builder.Services.AddVelosForwardedHeaders();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserContext, HttpUserContext>();
// Protege os cookies da recuperação de senha (httpOnly não impede o dono do navegador de forjar).
builder.Services.AddSingleton<AuthFlowCookies>();
// Endereço público dos links de volta (Google e email). Dev: appsettings.Development.json.
// Produção: variável App__PublicOrigin com o domínio final.
builder.Services.AddSingleton(new PublicOrigin(new Uri(
    builder.Configuration["App:PublicOrigin"] ?? throw new InvalidOperationException("Configuração 'App:PublicOrigin' ausente."))));
builder.Services.AddApplication();

// Dev: dotnet user-secrets (passo C7 do plano da spec 001). Produção: variável de ambiente
// ConnectionStrings__Velos. Nunca em appsettings*.json.
var connectionString = builder.Configuration.GetConnectionString("Velos")
    ?? throw new InvalidOperationException(
        "Connection string 'Velos' ausente. Em dev: powershell -ExecutionPolicy Bypass -File scripts/set-api-db-password.ps1");
var supabase = new SupabaseSettings(
    new Uri(builder.Configuration["Supabase:Url"] ?? throw new InvalidOperationException("Configuração 'Supabase:Url' ausente.")),
    builder.Configuration["Supabase:PublishableKey"] ?? throw new InvalidOperationException("Configuração 'Supabase:PublishableKey' ausente."));
builder.Services.AddInfrastructure(connectionString, supabase);

var app = builder.Build();

// O app depende de duas coisas que a imagem precisa de trazer e que o build não garante: a base
// de fusos horários (o "hoje" é sempre de São Paulo) e o ICU (ordenação em pt-BR). Quem resolve
// as duas são inicializadores estáticos — TransactionRules e PgEnums — e um inicializador
// estático que lança deixa o tipo quebrado para o RESTO DA VIDA DO PROCESSO: todo endpoint que
// o toque devolve 500, enquanto o /api/health, que não toca no domínio, segue verde e o Fly
// considera a máquina saudável.
//
// Por isso são exercidas aqui, no arranque: se faltar alguma, a API não sobe, o deploy falha e
// a versão anterior continua no ar. Em 2026-11-03 produção quebrou duas vezes assim, uma por
// cada uma delas.
//
// Ao acrescentar outra dependência de ambiente desse tipo, exercê-la aqui também.
foreach (var (nome, verificar) in new (string, Action)[]
{
    ("Base de fusos horários (tzdata)", () => TransactionRules.Today(TimeProvider.System)),
    ("ICU — a imagem está em modo invariante de globalização",
        () => CultureInfo.GetCultureInfo("pt-BR")),
})
{
    try
    {
        verificar();
    }
    catch (Exception ex)
    {
        throw new InvalidOperationException($"Ambiente incompleto: {nome}. Ver o Dockerfile.", ex);
    }
}

// Primeiro de todos: o resto do pipeline (limite por IP, HSTS, links absolutos) tem de enxergar o
// IP e o esquema do cliente, não os do proxy. Em dev não há proxy, e os cabeçalhos de um
// atacante não vêm da rede conhecida, então isto fica sem efeito.
app.UseForwardedHeaders();

app.UseExceptionHandler();
app.UseStatusCodePages();

// CSP montada uma vez, do index.html que será servido: o hash do script do tema sai do arquivo,
// nunca de um valor escrito à mão (ver ContentSecurityPolicy). Em Development não há SPA em
// wwwroot — quem serve o front é o Vite — e a política fica sem hash, o que basta para o JSON.
var indexHtmlPath = Path.Combine(app.Environment.WebRootPath ?? string.Empty, "index.html");
var indexHtml = File.Exists(indexHtmlPath) ? File.ReadAllText(indexHtmlPath) : null;
app.UseSecurityHeaders(ContentSecurityPolicy.Build(indexHtml));
if (!app.Environment.IsDevelopment())
{
    // Só em produção: em localhost o HSTS grudaria no navegador e quebraria o http://localhost.
    app.UseHsts();
}

// Em produção o build do Vite fica em wwwroot e é servido daqui: mesma origem, sem CORS.
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseNoStoreForApi();
// CSRF antes da renovação: uma mutação forjada é recusada sem tocar na sessão.
app.UseMiddleware<CsrfHeaderMiddleware>();
app.UseMiddleware<TokenRefreshMiddleware>();
app.UseAuthentication();
// Entre a autenticação e a autorização: o limite já enxerga a pessoa (sub do JWT) e também conta
// as requests anônimas a rotas privadas, que a autorização recusaria antes de chegar aqui.
app.UseRateLimiter();
app.UseAuthorization();

app.MapControllers();

// Rota de API inexistente: 404 em JSON (401 sem sessão), nunca o index.html do SPA.
app.Map("/api/{**path}", () => Results.NotFound());

// Qualquer outra rota é do SPA (React Router decide). Precisa ser pública:
// a tela de login também vem daqui.
app.MapFallbackToFile("index.html").AllowAnonymous();

app.Run();

// Expõe o Program para o WebApplicationFactory dos testes de endpoint (Velos.Api.Tests).
public partial class Program;
