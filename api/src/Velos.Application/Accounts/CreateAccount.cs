using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Accounts;

namespace Velos.Application.Accounts;

/// <summary>
/// O saldo chega COM sinal: o front converte "devo R$ 640,90" no cartão e o cheque especial
/// em negativo (RN3). Não há campo de usuário: o dono é sempre o do JWT.
/// </summary>
public sealed record CreateAccountCommand(string Name, AccountType? Type, long InitialBalanceCents);

public sealed class CreateAccountHandler(IValidator<AccountInput> validator, IUserContext user, IAccountStore accounts)
{
    public async Task<Result<Guid>> HandleAsync(CreateAccountCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var input = new AccountInput((command.Name ?? string.Empty).Trim(), command.Type, command.InitialBalanceCents);

        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid) return Result.Failure<Guid>(ValidationErrors.From(validation));

        return await accounts.CreateAsync(
            user.UserId, new NewAccount(input.Name, input.Type!.Value, input.InitialBalanceCents), cancellationToken);
    }
}
