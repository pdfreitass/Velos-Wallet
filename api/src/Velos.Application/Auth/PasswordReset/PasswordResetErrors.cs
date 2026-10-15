using Velos.Application.Common;

namespace Velos.Application.Auth.PasswordReset;

/// <summary>Erros da recuperação de senha (RN6). O front traduz pelo <c>code</c>.</summary>
public static class PasswordResetErrors
{
    /// <summary>Link expirado, já usado ou aberto em outro navegador — sem distinguir qual.</summary>
    public static readonly AppError InvalidLink = new(
        "reset_link_invalid", ErrorKind.Forbidden,
        "Este link não é mais válido. Peça um novo email de redefinição.");

    /// <summary>
    /// CA7: sem o cookie de recuperação, trocar a senha é proibido. Sem isso, quem estivesse com
    /// uma sessão aberta (computador emprestado) trocaria a senha sem saber a atual.
    /// </summary>
    public static readonly AppError NotInRecovery = new(
        "reset_not_allowed", ErrorKind.Forbidden,
        "Para trocar a senha, use o link enviado para o seu email.");
}
