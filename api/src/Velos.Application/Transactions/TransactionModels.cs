using Velos.Domain.Categories;
using Velos.Domain.Transactions;

namespace Velos.Application.Transactions;

/// <summary>Conta como aparece numa linha da lista (só o que a tela mostra).</summary>
public sealed record AccountRef(Guid Id, string Name);

/// <summary>Categoria como aparece numa linha da lista, para o <c>CategoryBadge</c>.</summary>
public sealed record CategoryRef(Guid Id, string Name, string Color, string Icon);

/// <summary>
/// Linha da lista do mês. <see cref="Category"/> é <c>null</c> na transferência e na transação cuja
/// categoria foi excluída ("Sem categoria", RN6).
/// </summary>
public sealed record TransactionListItem(
    Guid Id,
    TransactionType Type,
    long AmountCents,
    DateOnly Date,
    string? Description,
    AccountRef Account,
    AccountRef? TransferAccount,
    CategoryRef? Category);

/// <summary>Os totais são do mês inteiro, sem o filtro (RN7: soma no banco, transferência fora).</summary>
public sealed record MonthTotals(long IncomeCents, long ExpenseCents);

/// <summary>A tela de transações: mês no formato <c>yyyy-MM</c>, totais e as linhas.</summary>
public sealed record TransactionMonth(
    string Month,
    long IncomeCents,
    long ExpenseCents,
    IReadOnlyList<TransactionListItem> Items);

/// <summary>Uma transação para o formulário de edição.</summary>
public sealed record TransactionDetail(
    Guid Id,
    TransactionType Type,
    long AmountCents,
    DateOnly Date,
    string? Description,
    Guid AccountId,
    Guid? TransferAccountId,
    Guid? CategoryId);

/// <summary>
/// Dados já validados e normalizados: descrição sem espaços nas pontas (ou <c>null</c>); categoria
/// só em despesa e receita; conta de destino só na transferência. Vale para criar e para editar.
/// </summary>
public sealed record TransactionData(
    TransactionType Type,
    long AmountCents,
    DateOnly Date,
    string? Description,
    Guid AccountId,
    Guid? TransferAccountId,
    Guid? CategoryId);

/// <summary>
/// RN10: o que o store achou das referências, SÓ entre as do usuário. Conta de outra pessoa vem
/// como não encontrada, igual a inexistente.
/// </summary>
public sealed record TransactionReferences(bool AccountFound, bool TransferAccountFound, CategoryType? CategoryType);
