using Velos.Application.Common;

namespace Velos.Application.Auth.SignUp;

/// <summary>Erros da confirmação de cadastro (spec 013). O front traduz pelo <c>code</c>.</summary>
public static class SignUpConfirmationErrors
{
    /// <summary>Link expirado, já usado ou aberto em outro navegador — sem distinguir qual.</summary>
    public static readonly AppError InvalidLink = new(
        "signup_link_invalid", ErrorKind.Forbidden,
        "Este link não é mais válido. Peça um novo email de confirmação.");
}
