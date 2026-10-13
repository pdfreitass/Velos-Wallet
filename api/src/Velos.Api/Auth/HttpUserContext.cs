using System.Security.Claims;
using Velos.Application.Abstractions;

namespace Velos.Api.Auth;

/// <summary>Lê o usuário dos claims do JWT validado pelo JwtBearer (MapInboundClaims = false).</summary>
internal sealed class HttpUserContext(IHttpContextAccessor accessor) : IUserContext
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid UserId =>
        Guid.TryParse(Principal?.FindFirstValue("sub"), out var id)
            ? id
            : throw new InvalidOperationException("Request sem usuário autenticado (claim 'sub').");

    public string? Email => Principal?.FindFirstValue("email");
}
