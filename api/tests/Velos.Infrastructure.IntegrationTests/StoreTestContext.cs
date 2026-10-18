using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Velos.Application.Abstractions;
using Velos.Infrastructure.Persistence;

namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// Stores reais ligados ao banco como um usuário (RLS valendo). <see cref="Me"/> é a conta de teste
/// (Tests:UserId); <see cref="Stranger"/> é um usuário que não existe, com sessão própria.
/// </summary>
internal sealed class StoreTestContext : IAsyncDisposable
{
    private readonly VelosDbContext _db;

    private StoreTestContext(Guid userId)
    {
        UserId = userId;
        _db = TestDatabase.CreateContext();
        Session = new UserDbSession(_db, new FakeUserContext(userId));
        Accounts = new AccountStore(Session, NullLogger<AccountStore>.Instance);
        Categories = new CategoryStore(Session, NullLogger<CategoryStore>.Instance);
        Transactions = new TransactionStore(Session, NullLogger<TransactionStore>.Instance);
        Dashboard = new DashboardStore(Session, NullLogger<DashboardStore>.Instance);
        Goals = new GoalStore(Session, NullLogger<GoalStore>.Instance);
    }

    public IDashboardStore Dashboard { get; }

    public IGoalStore Goals { get; }

    public ITransactionStore Transactions { get; }

    public Guid UserId { get; }

    public UserDbSession Session { get; }

    public IAccountStore Accounts { get; }

    public ICategoryStore Categories { get; }

    public static StoreTestContext Me() => new(TestDatabase.TestUserId!.Value);

    public static StoreTestContext Stranger() => new(Guid.NewGuid());

    /// <summary>Nome único por execução (cabe nos 30 caracteres da categoria).</summary>
    public static string UniqueName(string prefix) => $"{prefix} {Guid.NewGuid().ToString("N")[..8]}";

    /// <summary>Movimentação criada por SQL: as telas de transação só chegam na Etapa 5 (CA6b).</summary>
    public Task AddTransactionAsync(string type, Guid accountId, long cents, Guid? transferAccountId = null, Guid? categoryId = null) =>
        Session.AsUserAsync(
            (db, ct) => db.Database.ExecuteSqlAsync($"""
                insert into public.transactions (user_id, account_id, transfer_account_id, category_id, type, amount_cents, date)
                values ({UserId}, {accountId}, {transferAccountId}, {categoryId}, {type}::public.transaction_type, {cents}, current_date)
                """, ct));

    public ValueTask DisposeAsync() => _db.DisposeAsync();
}
