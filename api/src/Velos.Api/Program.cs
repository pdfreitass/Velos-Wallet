using Velos.Api.Configuration;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
// Todo erro sai como ProblemDetails (RFC 9457), nunca como página HTML ou stack trace.
builder.Services.AddProblemDetails();
builder.Services.AddVelosAuthentication(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

// Em produção o build do Vite fica em wwwroot e é servido daqui: mesma origem, sem CORS.
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseNoStoreForApi();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Rota de API inexistente: 404 em JSON (401 sem sessão), nunca o index.html do SPA.
app.Map("/api/{**path}", () => Results.NotFound());

// Qualquer outra rota é do SPA (React Router decide). Precisa ser pública:
// a tela de login também vem daqui.
app.MapFallbackToFile("index.html").AllowAnonymous();

app.Run();
