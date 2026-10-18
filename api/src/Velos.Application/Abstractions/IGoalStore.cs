using Velos.Application.Common;
using Velos.Application.Goals;

namespace Velos.Application.Abstractions;

/// <summary>
/// Metas e aportes do usuário no banco (spec 006). O <c>userId</c> vem SEMPRE do <see cref="IUserContext"/>,
/// passado pelo handler; a implementação filtra por ele além da RLS. O que é de outra pessoa responde
/// igual a inexistente (<c>null</c> / <c>false</c>).
/// </summary>
public interface IGoalStore
{
    /// <summary>RN8: em andamento primeiro (prazo mais próximo; sem prazo por último), depois as atingidas.</summary>
    Task<Result<IReadOnlyList<GoalProgress>>> ListAsync(Guid userId, CancellationToken cancellationToken);

    Task<Result<GoalProgress?>> GetAsync(Guid userId, Guid goalId, CancellationToken cancellationToken);

    /// <summary>Aportes da meta, do mais recente para o mais antigo.</summary>
    Task<Result<IReadOnlyList<Contribution>>> ListContributionsAsync(Guid userId, Guid goalId, CancellationToken cancellationToken);

    Task<Result<Guid>> CreateAsync(Guid userId, GoalData data, CancellationToken cancellationToken);

    /// <returns><c>false</c> se a meta não existe para este usuário.</returns>
    Task<Result<bool>> UpdateAsync(Guid userId, Guid goalId, GoalData data, CancellationToken cancellationToken);

    /// <summary>RN7: os aportes vão junto (<c>on delete cascade</c>).</summary>
    /// <returns><c>false</c> se a meta não existe para este usuário.</returns>
    Task<Result<bool>> DeleteAsync(Guid userId, Guid goalId, CancellationToken cancellationToken);

    /// <returns>O id do aporte, ou <c>null</c> se a meta não existe para este usuário.</returns>
    Task<Result<Guid?>> AddContributionAsync(Guid userId, Guid goalId, ContributionData data, CancellationToken cancellationToken);

    /// <returns><c>false</c> se o aporte não existe nesta meta, para este usuário.</returns>
    Task<Result<bool>> UpdateContributionAsync(
        Guid userId, Guid goalId, Guid contributionId, ContributionData data, CancellationToken cancellationToken);

    /// <returns><c>false</c> se o aporte não existe nesta meta, para este usuário.</returns>
    Task<Result<bool>> DeleteContributionAsync(Guid userId, Guid goalId, Guid contributionId, CancellationToken cancellationToken);
}
