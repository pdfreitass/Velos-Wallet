using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Velos.Api.Auth;
using Velos.Api.Configuration;
using Velos.Api.Http;
using Velos.Application;
using Velos.Application.Abstractions;
using Velos.Infrastructure;
using Velos.Infrastructure.Supabase;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
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

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseSecurityHeaders();
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
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

// Rota de API inexistente: 404 em JSON (401 sem sessão), nunca o index.html do SPA.
app.Map("/api/{**path}", () => Results.NotFound());

// Qualquer outra rota é do SPA (React Router decide). Precisa ser pública:
// a tela de login também vem daqui.
app.MapFallbackToFile("index.html").AllowAnonymous();

app.Run();

// Expõe o Program para o WebApplicationFactory dos testes de endpoint (Velos.Api.Tests).
public partial class Program;
