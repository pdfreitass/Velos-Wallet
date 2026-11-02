using Velos.Application.Accounts;
using Velos.Application.Common;
using Velos.Domain.Accounts;
using static Velos.Application.Tests.Accounts.SaveAccountHandlerTests;

namespace Velos.Application.Tests.Accounts;

/// <summary>Listar, abrir, impacto da exclusão e excluir: RN6, RN12, CA6, CA6b e CA11 da spec 002.</summary>
public class ReadAndDeleteAccountHandlerTests
{
    private static readonly Guid OtherUser = Guid.Parse("99999999-9999-9999-9999-999999999999");

    private readonly FakeUserContext _user = new();
    private readonly FakeAccountStore _store = new();

    [Fact]
    public async Task List_returns_only_the_accounts_of_the_jwt_user()
    {
        var mine = _store.Add(FakeUserContext.DefaultUserId, Account(AccountType.Checking, 100));
        _store.Add(OtherUser, Account(AccountType.Cash, 200));

        var result = await new ListAccountsHandler(_user, _store).HandleAsync(default);

        Assert.Equal([mine], result.Value);
        Assert.Equal([FakeUserContext.DefaultUserId], _store.UserIds);
    }

    [Fact]
    public async Task Get_returns_my_account()
    {
        var mine = _store.Add(FakeUserContext.DefaultUserId, Account(AccountType.Savings, 500));

        var result = await new GetAccountHandler(_user, _store).HandleAsync(mine.Id, default);

        Assert.Equal(mine, result.Value);
    }

    /// <summary>CA11: de outra pessoa e inexistente dão exatamente o mesmo erro, em toda operação por id.</summary>
    [Fact]
    public async Task Someone_elses_and_missing_accounts_give_the_same_not_found()
    {
        var theirs = _store.Add(OtherUser, Account(AccountType.Cash, 1_000)).Id;
        var missing = Guid.NewGuid();

        foreach (var id in new[] { theirs, missing })
        {
            Assert.Equal(AccountErrors.NotFound, (await new GetAccountHandler(_user, _store).HandleAsync(id, default)).Error);
            Assert.Equal(AccountErrors.NotFound, (await new GetAccountDeletionImpactHandler(_user, _store).HandleAsync(id, default)).Error);
            Assert.Equal(AccountErrors.NotFound, (await new DeleteAccountHandler(_user, _store).HandleAsync(id, default)).Error);
        }

        Assert.NotNull(_store.Find(theirs));
        Assert.All(_store.UserIds, id => Assert.Equal(FakeUserContext.DefaultUserId, id));
    }

    [Fact]
    public async Task Deletion_impact_is_returned_for_my_account()
    {
        var mine = _store.Add(FakeUserContext.DefaultUserId, Account(AccountType.Checking, 0));
        _store.Impact = new AccountDeletionImpact(3, 8, 1, [new AffectedAccount(Guid.NewGuid(), "Poupança")]);

        var result = await new GetAccountDeletionImpactHandler(_user, _store).HandleAsync(mine.Id, default);

        Assert.Equal(_store.Impact, result.Value);
    }

    [Fact]
    public async Task Delete_removes_my_account()
    {
        var mine = _store.Add(FakeUserContext.DefaultUserId, Account(AccountType.Cash, 0));

        var result = await new DeleteAccountHandler(_user, _store).HandleAsync(mine.Id, default);

        Assert.True(result.IsSuccess);
        Assert.Null(_store.Find(mine.Id));
    }

    [Fact]
    public async Task Database_failure_is_passed_through()
    {
        _store.Failure = CommonErrors.DatabaseUnavailable;

        Assert.Equal(CommonErrors.DatabaseUnavailable, (await new ListAccountsHandler(_user, _store).HandleAsync(default)).Error);
        Assert.Equal(CommonErrors.DatabaseUnavailable, (await new DeleteAccountHandler(_user, _store).HandleAsync(Guid.NewGuid(), default)).Error);
    }
}
