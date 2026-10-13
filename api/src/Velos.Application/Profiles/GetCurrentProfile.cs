using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Profiles;

/// <summary>O que o front precisa do usuário logado ("Olá, {nome}").</summary>
public sealed record CurrentProfile(string Name, string? Email);

public sealed class GetCurrentProfileHandler(IProfileReader profiles)
{
    public Task<Result<CurrentProfile>> HandleAsync(CancellationToken cancellationToken) =>
        profiles.GetCurrentAsync(cancellationToken);
}
