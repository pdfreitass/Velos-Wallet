using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Velos.Api.Auth;
using Velos.Application.Auth.Google;
using Velos.Application.Auth.PasswordReset;
using Velos.Application.Common;

namespace Velos.Api.Controllers;

/// <summary>
/// Volta dos links do Supabase. Fora de <c>/api</c> de propósito: isto não é chamado pelo
/// JavaScript do SPA, é o navegador abrindo o link do email. Por isso responde com 302, não JSON.
/// </summary>
[ApiController]
[Route("auth")]
public sealed class AuthCallbackController : ControllerBase
{
    /// <summary>Para onde o usuário vai escolher a senha nova.</summary>
    private const string ResetPage = "/redefinir-senha";

    /// <summary>Link velho, já usado ou aberto em outro navegador: pedir outro, com o aviso na tela.</summary>
    private const string RetryPage = "/recuperar-senha?erro=link";

    /// <summary>Google cancelado ou recusado.</summary>
    private const string GoogleErrorPage = "/auth/erro?motivo=google";

    [HttpGet("confirm")]
    [AllowAnonymous]
    public async Task<IActionResult> Confirm(
        [FromQuery] string? code,
        [FromServices] ConfirmPasswordResetHandler handler,
        [FromServices] AuthFlowCookies cookies,
        CancellationToken cancellationToken)
    {
        var verifier = cookies.ReadResetVerifier(HttpContext);

        // Uso único: o verifier cai aqui, dê certo ou não. Um link reaberto não tenta de novo.
        cookies.ClearResetVerifier(HttpContext);

        var result = await handler.HandleAsync(code, verifier, cancellationToken);
        if (!result.IsSuccess)
        {
            return Redirect(RetryPage);
        }

        SessionCookies.Write(HttpContext, result.Value);
        cookies.WriteTicket(HttpContext, result.Value.User.Id);
        return Redirect(ResetPage);
    }

    /// <summary>
    /// Volta do Google (H4). O <c>next</c> faz a viagem de ida e volta pela URL, então passa pelo
    /// <see cref="SafeRedirect"/> na volta: <c>?next=https://site-falso.com</c> vai para o painel (RN7, CA9).
    /// </summary>
    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleCallback(
        [FromQuery] string? code,
        [FromQuery] string? next,
        [FromQuery] string? error,
        [FromServices] CompleteGoogleSignInHandler handler,
        [FromServices] AuthFlowCookies cookies,
        CancellationToken cancellationToken)
    {
        var verifier = cookies.ReadOAuthVerifier(HttpContext);
        cookies.ClearOAuthVerifier(HttpContext);

        // Cancelou na tela do Google: o Supabase devolve ?error=... e nenhum código.
        if (!string.IsNullOrEmpty(error))
        {
            return Redirect(GoogleErrorPage);
        }

        var result = await handler.HandleAsync(code, verifier, cancellationToken);
        if (!result.IsSuccess)
        {
            return Redirect(GoogleErrorPage);
        }

        SessionCookies.Write(HttpContext, result.Value);
        return Redirect(SafeRedirect.Resolve(next));
    }
}
