using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Velos.Api.Auth;
using Velos.Api.Configuration;
using Velos.Api.Http;
using Velos.Application.Abstractions;
using Velos.Application.Auth;
using Velos.Application.Auth.Google;
using Velos.Application.Auth.PasswordReset;
using Velos.Application.Auth.SignIn;
using Velos.Application.Auth.SignOut;
using Velos.Application.Auth.SignUp;
using Velos.Application.Common;

namespace Velos.Api.Controllers;

public sealed record SignUpRequest(string? Name, string? Email, string? Password, string? ConfirmPassword);

public sealed record SignInRequest(string? Email, string? Password);

public sealed record PasswordResetRequest(string? Email);

public sealed record ChangePasswordRequest(string? Password, string? ConfirmPassword);

/// <summary>
/// Entrada e saída (spec 001). Públicas por natureza ([AllowAnonymous] explícito); a sessão vai só
/// nos cookies httpOnly, nunca no corpo da resposta.
/// </summary>
[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    [HttpPost("sign-up")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingSetup.Auth)]
    public async Task<IActionResult> SignUp(
        SignUpRequest request, [FromServices] SignUpHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(
            new SignUpCommand(request.Name ?? "", request.Email ?? "", request.Password ?? "", request.ConfirmPassword ?? ""),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return this.ToProblem(result.Error!);
        }

        SessionCookies.Write(HttpContext, result.Value);
        return StatusCode(StatusCodes.Status201Created);
    }

    [HttpPost("sign-in")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingSetup.Auth)]
    public async Task<IActionResult> SignIn(
        SignInRequest request, [FromServices] SignInHandler handler, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        var result = await handler.HandleAsync(
            new SignInCommand(request.Email ?? "", request.Password ?? ""), cancellationToken);

        if (!result.IsSuccess)
        {
            return this.ToProblem(result.Error!);
        }

        SessionCookies.Write(HttpContext, result.Value);
        return NoContent();
    }

    /// <summary>
    /// RN12: revoga a sessão no Supabase e apaga os cookies. Anônimo de propósito: com o token
    /// vencido o usuário ainda precisa conseguir sair (e os cookies precisam ser apagados).
    /// </summary>
    [HttpPost("sign-out")]
    [AllowAnonymous]
    public async Task<IActionResult> SignOut(
        [FromServices] SignOutHandler handler, CancellationToken cancellationToken)
    {
        await handler.HandleAsync(SessionCookies.ReadAccessToken(HttpContext), cancellationToken);
        SessionCookies.Clear(HttpContext);
        return NoContent();
    }

    /// <summary>
    /// Começa o login com Google (H4). Não é chamada por JavaScript: é o navegador seguindo um link,
    /// e por isso responde 302 para o Supabase, que leva ao Google.
    ///
    /// O <c>next</c> é validado AQUI (vai dentro do endereço de volta) e DE NOVO no callback: o que
    /// volta do Google passou por fora do app e não é confiável (RN7, CA9).
    /// </summary>
    [HttpGet("google")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingSetup.Auth)]
    public IActionResult SignInWithGoogle(
        [FromQuery] string? next,
        [FromServices] StartGoogleSignInHandler handler,
        [FromServices] AuthFlowCookies cookies,
        [FromServices] PublicOrigin origin)
    {
        var callback = origin.Url($"/auth/callback?next={Uri.EscapeDataString(SafeRedirect.Resolve(next))}");

        var started = handler.Handle(callback);
        cookies.WriteOAuthVerifier(HttpContext, started.CodeVerifier);
        return Redirect(started.AuthorizeUrl.AbsoluteUri);
    }

    /// <summary>
    /// "Esqueci minha senha" (H5, RN6). Resposta NEUTRA: 202 tanto para email com conta quanto sem
    /// (RN4). O verifier do PKCE fica só no cookie httpOnly, nunca no corpo.
    /// </summary>
    [HttpPost("password-reset")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingSetup.PasswordReset)]
    public async Task<IActionResult> RequestPasswordReset(
        PasswordResetRequest request,
        [FromServices] RequestPasswordResetHandler handler,
        [FromServices] AuthFlowCookies cookies,
        [FromServices] PublicOrigin origin,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        // Da configuração, nunca do Host da request (ver PublicOrigin).
        var redirectTo = origin.Url("/auth/confirm");

        var result = await handler.HandleAsync(
            new RequestPasswordResetCommand(request.Email ?? ""), redirectTo, cancellationToken);

        if (!result.IsSuccess)
        {
            return this.ToProblem(result.Error!);
        }

        cookies.WriteResetVerifier(HttpContext, result.Value.CodeVerifier);
        return Accepted();
    }

    /// <summary>
    /// Grava a senha nova. Privada (sem <c>[AllowAnonymous]</c>) E exige o cookie de recuperação do
    /// MESMO usuário da sessão: sessão aberta, sozinha, não troca a senha (CA7).
    /// </summary>
    [HttpPut("password")]
    [EnableRateLimiting(RateLimitingSetup.Auth)]
    public async Task<IActionResult> ChangePassword(
        ChangePasswordRequest request,
        [FromServices] ChangePasswordHandler handler,
        [FromServices] AuthFlowCookies cookies,
        [FromServices] IUserContext user,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (cookies.ReadTicket(HttpContext) != user.UserId)
        {
            return this.ToProblem(PasswordResetErrors.NotInRecovery);
        }

        if (SessionCookies.ReadAccessToken(HttpContext) is not { Length: > 0 } accessToken)
        {
            return this.ToProblem(AuthErrors.SessionExpired);
        }

        var result = await handler.HandleAsync(
            new ChangePasswordCommand(request.Password ?? "", request.ConfirmPassword ?? ""),
            accessToken,
            new UserIdentity(user.UserId, user.Email),
            cancellationToken);

        if (!result.IsSuccess)
        {
            return this.ToProblem(result.Error!);
        }

        // Uso único: o ticket morre com a troca, e o verifier não serve mais para nada.
        cookies.ClearTicket(HttpContext);
        cookies.ClearResetVerifier(HttpContext);
        return NoContent();
    }
}
