using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Auth;

/// <summary>
/// Erros da autenticação com os códigos que o front traduz (spec 001). As mensagens seguem a RN4:
/// login e "esqueci a senha" nunca revelam se o email tem conta.
/// </summary>
public static class AuthErrors
{
    public const string InvalidCredentialsCode = "invalid_credentials";

    public static AppError InvalidCredentials(int? attemptsLeft) => new(
        InvalidCredentialsCode,
        ErrorKind.InvalidCredentials,
        attemptsLeft is int left
            ? $"Email ou senha incorretos. Mais {Plural(left, "tentativa incorreta", "tentativas incorretas")} e o acesso será bloqueado por {Plural((int)LoginLockoutPolicy.LockDuration.TotalMinutes, "minuto", "minutos")}."
            : "Email ou senha incorretos.",
        attemptsLeft is int value ? new Dictionary<string, object?> { ["attemptsLeft"] = value } : null);

    public static AppError Locked(int minutesLeft) => new(
        "locked",
        ErrorKind.TooManyRequests,
        $"Muitas tentativas incorretas. Tente novamente em {Plural(minutesLeft, "minuto", "minutos")} ou redefina sua senha.",
        new Dictionary<string, object?> { ["minutesLeft"] = minutesLeft });

    /// <summary>"1 minuto" / "10 minutos": nada de "minuto(s)" na tela.</summary>
    private static string Plural(int count, string singular, string plural) =>
        $"{count} {(count == 1 ? singular : plural)}";

    public static readonly AppError EmailTaken = new(
        "email_taken", ErrorKind.Conflict, "Este email já está cadastrado.");

    /// <summary>O Supabase recusa domínios de exemplo/teste (ex.: example.com).</summary>
    public static readonly AppError EmailNotAccepted = new(
        "validation_failed", ErrorKind.Validation, "Revise os campos destacados.",
        new Dictionary<string, object?>
        {
            ["errors"] = new Dictionary<string, string[]> { ["email"] = ["Este email não é aceito. Use outro endereço."] },
        });

    public static readonly AppError WeakPassword = new(
        "weak_password", ErrorKind.Validation, "A senha não atende aos requisitos de segurança.");

    public static readonly AppError EmailNotConfirmed = new(
        "email_not_confirmed", ErrorKind.Forbidden, "Confirme seu email antes de entrar.");

    /// <summary>Cadastro aceito, mas sem sessão: o Supabase está exigindo confirmação por email.</summary>
    public static readonly AppError ConfirmationRequired = new(
        "confirmation_required", ErrorKind.Forbidden, "Enviamos um link de confirmação para o seu email.");

    public static readonly AppError RateLimited = new(
        "rate_limited", ErrorKind.TooManyRequests, "Muitas solicitações em pouco tempo. Aguarde e tente de novo.");

    public static readonly AppError SessionExpired = new(
        "session_expired", ErrorKind.Unauthorized, "Sua sessão expirou. Entre novamente.");

    public static readonly AppError Unavailable = new(
        "auth_unavailable", ErrorKind.Unavailable,
        "Não foi possível falar com o servidor de autenticação. Tente de novo em instantes.");

    /// <summary>Falha fechada: sem conseguir consultar o bloqueio, o login nem é tentado.</summary>
    public static readonly AppError LockoutUnavailable = new(
        "lockout_unavailable", ErrorKind.Unavailable,
        "Não foi possível verificar o acesso agora. Tente de novo em instantes.");
}
