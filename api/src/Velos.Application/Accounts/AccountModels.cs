using Velos.Domain.Accounts;

namespace Velos.Application.Accounts;

/// <summary>Conta como a lista e o formulário mostram. <see cref="BalanceCents"/> vem da view account_balances.</summary>
public sealed record AccountSummary(Guid Id, string Name, AccountType Type, long InitialBalanceCents, long BalanceCents);

/// <summary>Dados já validados e normalizados (nome sem espaços nas pontas; saldo com sinal).</summary>
public sealed record NewAccount(string Name, AccountType Type, long InitialBalanceCents);

/// <summary>O tipo fica de fora: não muda depois de criada (RN1).</summary>
public sealed record AccountChanges(string Name, long InitialBalanceCents);

/// <summary>RN6: o que vai junto ao excluir a conta.</summary>
public sealed record AccountDeletionImpact(
    int IncomeCount,
    int ExpenseCount,
    int TransferCount,
    IReadOnlyList<AffectedAccount> AffectedAccounts);

/// <summary>Outra conta cujo saldo muda porque uma transferência com ela vai sumir.</summary>
public sealed record AffectedAccount(Guid Id, string Name);
