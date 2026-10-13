using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Velos.Application.Abstractions;
using Velos.Application.Auth;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Infrastructure.Supabase;

/// <summary>
/// Supabase Auth (GoTrue) pela REST, servidor a servidor. Traduz todo erro para <see cref="AuthErrors"/>:
/// mensagem do Supabase nunca sobe. Nunca loga email, senha ou token.
/// </summary>
internal sealed partial class SupabaseAuthClient(HttpClient http, ILogger<SupabaseAuthClient> logger) : IIdentityProvider
{
    public Task<Result<AuthSession>> SignInWithPasswordAsync(string email, string password, CancellationToken cancellationToken) =>
        RequestSessionAsync("token?grant_type=password", new { email, password }, isSignUp: false, cancellationToken);

    public Task<Result<AuthSession>> SignUpAsync(string name, string email, string password, CancellationToken cancellationToken) =>
        // full_name vira o nome do perfil pelo trigger handle_new_user (RN9).
        RequestSessionAsync("signup", new { email, password, data = new { full_name = name } }, isSignUp: true, cancellationToken);

    public Task<Result<AuthSession>> RefreshAsync(string refreshToken, CancellationToken cancellationToken) =>
        RequestSessionAsync("token?grant_type=refresh_token", new { refresh_token = refreshToken }, isSignUp: false, cancellationToken);

    public async Task SignOutAsync(string accessToken, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "logout?scope=local");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        try
        {
            using var response = await http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode && response.StatusCode != HttpStatusCode.Unauthorized)
            {
                LogSignOutRejected(logger, (int)response.StatusCode);
            }
        }
        catch (Exception exception) when (IsTransient(exception, cancellationToken))
        {
            LogUnavailable(logger, "logout", exception);
        }
    }

    public Uri BuildGoogleAuthorizeUrl(string codeChallenge, string redirectTo)
    {
        var query = $"authorize?provider=google&redirect_to={Uri.EscapeDataString(redirectTo)}"
            + $"&code_challenge={Uri.EscapeDataString(codeChallenge)}&code_challenge_method={PkcePair.Method}";

        // BaseAddress é a URL do Supabase com /auth/v1/ (ver DependencyInjection).
        return new Uri(http.BaseAddress!, query);
    }

    public async Task<Result<Unit>> SendPasswordResetAsync(
        string email, string codeChallenge, string redirectTo, CancellationToken cancellationToken)
    {
        // redirect_to vai na QUERY (é assim que o GoTrue lê) e precisa estar nas Redirect URLs (C2).
        var path = $"recover?redirect_to={Uri.EscapeDataString(redirectTo)}";
        var body = new { email, code_challenge = codeChallenge, code_challenge_method = PkcePair.Method };
        return await PostAsync("recover", path, body, cancellationToken);
    }

    public Task<Result<AuthSession>> ExchangeCodeAsync(string code, string codeVerifier, CancellationToken cancellationToken) =>
        RequestSessionAsync(
            "token?grant_type=pkce", new { auth_code = code, code_verifier = codeVerifier }, isSignUp: false, cancellationToken);

    public async Task<Result<Unit>> UpdatePasswordAsync(string accessToken, string newPassword, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, "user")
        {
            Content = JsonContent.Create(new { password = newPassword }),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return await SendAsync("user", request, cancellationToken);
    }

    private async Task<Result<Unit>> PostAsync(
        string endpoint, string path, object body, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, path) { Content = JsonContent.Create(body) };
        return await SendAsync(endpoint, request, cancellationToken);
    }

    private async Task<Result<Unit>> SendAsync(
        string endpoint, HttpRequestMessage request, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await http.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                return Result.Ok();
            }

            var code = await ReadErrorCodeAsync(response, cancellationToken) ?? "?";
            LogRejected(logger, endpoint, (int)response.StatusCode, code);
            return Result.Failure<Unit>(MapError(code, response.StatusCode));
        }
        catch (Exception exception) when (IsTransient(exception, cancellationToken))
        {
            LogUnavailable(logger, endpoint, exception);
            return Result.Failure<Unit>(AuthErrors.Unavailable);
        }
    }

    private async Task<Result<AuthSession>> RequestSessionAsync(
        string path, object body, bool isSignUp, CancellationToken cancellationToken)
    {
        var endpoint = path.Split('?')[0]; // só o endpoint vai para o log, sem query string
        try
        {
            using var response = await http.PostAsJsonAsync(path, body, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var session = await response.Content.ReadFromJsonAsync<GoTrueSession>(cancellationToken);
                if (session is { AccessToken.Length: > 0, RefreshToken.Length: > 0, User: { } user })
                {
                    return Result.Success(new AuthSession(
                        session.AccessToken, session.RefreshToken, session.ExpiresIn, new UserIdentity(user.Id, user.Email)));
                }

                // Cadastro aceito sem sessão: o projeto voltou a exigir confirmação de email.
                return Result.Failure<AuthSession>(isSignUp ? AuthErrors.ConfirmationRequired : AuthErrors.Unavailable);
            }

            var code = await ReadErrorCodeAsync(response, cancellationToken) ?? "?";
            LogRejected(logger, endpoint, (int)response.StatusCode, code);
            return Result.Failure<AuthSession>(MapError(code, response.StatusCode));
        }
        catch (Exception exception) when (IsTransient(exception, cancellationToken))
        {
            LogUnavailable(logger, endpoint, exception);
            return Result.Failure<AuthSession>(AuthErrors.Unavailable);
        }
    }

    private static async Task<string?> ReadErrorCodeAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        try
        {
            var error = await response.Content.ReadFromJsonAsync<GoTrueError>(cancellationToken);
            return error?.Resolve();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static AppError MapError(string? code, HttpStatusCode status) => code switch
    {
        "invalid_credentials" or "invalid_grant" => AuthErrors.InvalidCredentials(null),
        "user_already_exists" or "email_exists" => AuthErrors.EmailTaken,
        "weak_password" => AuthErrors.WeakPassword,
        "email_not_confirmed" => AuthErrors.EmailNotConfirmed,
        "email_address_invalid" => AuthErrors.EmailNotAccepted,
        "over_request_rate_limit" or "over_email_send_rate_limit" => AuthErrors.RateLimited,
        "refresh_token_not_found" or "refresh_token_already_used" or "session_expired"
            or "session_not_found" or "user_not_found" or "bad_jwt" => AuthErrors.SessionExpired,
        _ when status == HttpStatusCode.TooManyRequests => AuthErrors.RateLimited,
        _ => AuthErrors.Unavailable,
    };

    /// <summary>Rede fora, timeout ou resposta ilegível. Cancelamento pedido pelo cliente não entra.</summary>
    private static bool IsTransient(Exception exception, CancellationToken cancellationToken) =>
        exception is HttpRequestException or JsonException
        || (exception is TaskCanceledException && !cancellationToken.IsCancellationRequested);

    [LoggerMessage(Level = LogLevel.Information, Message = "Supabase Auth recusou {Endpoint}: HTTP {Status}, código {Code}")]
    private static partial void LogRejected(ILogger logger, string endpoint, int status, string code);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Supabase Auth indisponível em {Endpoint}")]
    private static partial void LogUnavailable(ILogger logger, string endpoint, Exception exception);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Supabase Auth recusou o logout: HTTP {Status}")]
    private static partial void LogSignOutRejected(ILogger logger, int status);
}
