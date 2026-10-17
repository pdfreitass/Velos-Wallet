using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Accounts;

/// <summary>O tipo não entra: não muda depois de criada (RN1).</summary>
public sealed record UpdateAccountCommand(Guid AccountId, string Name, long InitialBalanceCents);

public sealed class UpdateAccountHandler(IValidator<AccountInput> validator, IUserContext user, IAccountStore accounts)
{
    public async Task<Result<Unit>> HandleAsync(UpdateAccountCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var userId = user.UserId;

        // O sinal do saldo depende do tipo salvo (RN3), então a conta é lida antes de validar.
        var found = await accounts.GetAsync(userId, command.AccountId, cancellationToken);
        if (!found.IsSuccess) return Result.Failure<Unit>(found.Error!);
        if (found.Value is not { } account) return Result.Failure<Unit>(AccountErrors.NotFound);

        var input = new AccountInput((command.Name ?? string.Empty).Trim(), account.Type, command.InitialBalanceCents);
        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid) return Result.Failure<Unit>(ValidationErrors.From(validation));

        var updated = await accounts.UpdateAsync(
            userId, command.AccountId, new AccountChanges(input.Name, input.InitialBalanceCents), cancellationToken);
        if (!updated.IsSuccess) return Result.Failure<Unit>(updated.Error!);

        // Sumiu entre a leitura e a gravação (excluída em outra aba).
        return updated.Value ? Result.Ok() : Result.Failure<Unit>(AccountErrors.NotFound);
    }
}
