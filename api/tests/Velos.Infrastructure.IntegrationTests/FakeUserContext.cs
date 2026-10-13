using Velos.Application.Abstractions;

namespace Velos.Infrastructure.IntegrationTests;

internal sealed class FakeUserContext(Guid? userId, string? email = null) : IUserContext
{
    public static FakeUserContext Anonymous { get; } = new(null);

    public bool IsAuthenticated => userId.HasValue;

    public Guid UserId => userId ?? throw new InvalidOperationException("Sem usuário autenticado.");

    public string? Email => email;
}
