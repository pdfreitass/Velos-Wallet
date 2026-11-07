using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Velos.Api.Auth;
using Velos.Api.Configuration;
using Velos.Application.Auth.Google;
using Velos.Application.Auth.PasswordReset;
using Velos.Application.Auth.SignUp;
using Velos.Application.Common;

namespace Velos.Api.Controllers;

/// <summary>
/// Volta dos links do Supabase. Fora de <c>/api</c> de propósito: isto não é chamado pelo
/// JavaScript do SPA, é o navegador abrindo o link do email. Por isso responde com 302, não JSON.
/// </summary>
[ApiController]
[Route("auth")]
public sealed partial class AuthCallbackController : ControllerBase
{
    /// <summary>Para onde o usuário vai escolher a senha nova.</summary>
    private const string ResetPage = "/redefinir-senha";

    /// <summary>Link velho, já usado ou aberto em outro navegador: pedir outro, com o aviso na tela.</summary>
    private const string RetryPage = "/recuperar-senha?erro=link";

    /// <summary>Google cancelado ou recusado.</summary>
    private const string GoogleErrorPage = "/auth/erro?motivo=google";

    /// <summary>Cadastro confirmado: quem clicou no link já volta logado (RN3 da spec 013).</summary>
    private const string SignUpConfirmedPage = "/painel";

    /// <summary>Link de cadastro velho ou já usado: pedir outro, com o aviso na tela.</summary>
    private const string SignUpRetryPage = "/entrar?erro=confirmacao";

    /// <summary>
    /// Link aberto em outro navegador: o email FOI confirmado, só a sessão não dá para criar aqui.
    /// Dizer "peça outro link" mandava a pessoa a um ciclo sem fim, com a conta já confirmada.
    /// </summary>
    private const string SignUpConfirmedElsewherePage = "/entrar?aviso=confirmado";

    [HttpGet("confirm")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingSetup.Auth)]
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
    /// Volta do link do email de confirmação de cadastro (spec 013). Mesmo molde do reset: lê o
    /// <c>code</c> da query e o verifier do cookie PRÓPRIO do cadastro, consome o verifier sempre
    /// (link de uso único, dê certo ou não) e troca pela sessão. Sucesso: já logado em /painel.
    /// <para>
    /// Três desfechos, e não dois (RN9): com <c>code</c> e sem verifier, o GoTrue JÁ confirmou o
    /// email (ele valida o token antes de redirecionar) e só a troca PKCE é impossível, porque o
    /// verifier vive no navegador do cadastro — cadastra no celular, abre o email no computador.
    /// Esse caso vai para /entrar?aviso=confirmado ("é só entrar"). Sem <c>code</c>, ou com a troca
    /// recusada, o link é que não valeu: /entrar?erro=confirmacao ("peça outro").
    /// </para>
    /// </summary>
    [HttpGet("confirmar-cadastro")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingSetup.Auth)]
    public async Task<IActionResult> ConfirmSignUp(
        [FromQuery] string? code,
        [FromQuery] string? error,
        [FromQuery(Name = "error_code")] string? errorCode,
        [FromServices] ConfirmSignUpHandler handler,
        [FromServices] AuthFlowCookies cookies,
        [FromServices] ILogger<AuthCallbackController> logger,
        CancellationToken cancellationToken)
    {
        var verifier = cookies.ReadSignupVerifier(HttpContext);

        // Cookie que chegou e não desprotegeu: adulterado, de outro fluxo (RN6) ou vencido. O
        // desfecho é o mesmo de não ter cookie — sem sessão —, mas é tentativa de ataque, e sem
        // este log ela não deixaria rastro nenhum. Sem email e sem o valor do cookie.
        if (string.IsNullOrWhiteSpace(verifier) && AuthFlowCookies.HasSignupVerifierCookie(HttpContext))
        {
            LogRejectedSignUpVerifier(logger);
        }

        // Erro declarado pelo GoTrue manda, mesmo que venha um `code` junto: aqui não se afirma
        // "foi confirmado" sem base. Ele recusa o token do email ANTES de redirecionar e volta com
        // ?error= / &error_code= (ex.: otp_expired). É o que transforma a premissa da RN9 num
        // contrato declarado, em vez de uma inferência pela ausência de `code`.
        if (!string.IsNullOrWhiteSpace(error) || !string.IsNullOrWhiteSpace(errorCode))
        {
            cookies.ClearSignupVerifier(HttpContext);
            return Redirect(SignUpRetryPage);
        }

        // Uso único, mas só quando há código para trocar. Apagar sempre deixava qualquer página de
        // terceiros matar um cadastro em andamento com um <img src=".../auth/confirmar-cadastro">:
        // o cookie é SameSite=Lax, então a navegação de imagem o levaria junto. Sem `code` nada foi
        // gasto do lado do GoTrue, então não há o que consumir aqui.
        if (!string.IsNullOrWhiteSpace(code))
        {
            cookies.ClearSignupVerifier(HttpContext);
        }

        // Outro navegador (ou o mesmo link reaberto depois do sucesso): o email está confirmado,
        // só não há verifier para trocar o código. Sem sessão, mas com o recado certo.
        //
        // A afirmação "foi confirmado" se apoia no GoTrue: ele valida o token do email ANTES de
        // redirecionar, e volta sem `code` quando o token não presta. Quem montar a URL à mão com
        // um `code` inventado vê o mesmo recado — e não ganha nada com isso: aqui não há consulta
        // a conta nenhuma (não dá para enumerar email), não se chama o Supabase e não se cria
        // sessão. O preço de aceitar esse caso forjado é menor que o de mandar quem confirmou de
        // verdade pedir link novo para sempre.
        if (!string.IsNullOrWhiteSpace(code) && string.IsNullOrWhiteSpace(verifier))
        {
            return Redirect(SignUpConfirmedElsewherePage);
        }

        var result = await handler.HandleAsync(code, verifier, cancellationToken);
        if (!result.IsSuccess)
        {
            return Redirect(SignUpRetryPage);
        }

        SessionCookies.Write(HttpContext, result.Value);
        return Redirect(SignUpConfirmedPage);
    }

    /// <summary>
    /// Volta do Google (H4). O <c>next</c> faz a viagem de ida e volta pela URL, então passa pelo
    /// <see cref="SafeRedirect"/> na volta: <c>?next=https://site-falso.com</c> vai para o painel (RN7, CA9).
    /// </summary>
    [HttpGet("callback")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitingSetup.Auth)]
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

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Verifier de cadastro recusado: o cookie veio, mas não desprotegeu")]
    private static partial void LogRejectedSignUpVerifier(ILogger logger);
}
