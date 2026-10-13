using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Velos.Api.Auth;
using Velos.Api.Http;
using Velos.Application.Auth.SignIn;
using Velos.Application.Auth.SignOut;
using Velos.Application.Auth.SignUp;

namespace Velos.Api.Controllers;

public sealed record SignUpRequest(string? Name, string? Email, string? Password, string? ConfirmPassword);

public sealed record SignInRequest(string? Email, string? Password);

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
}
