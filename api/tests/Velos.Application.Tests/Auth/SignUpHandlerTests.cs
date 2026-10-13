using Velos.Application.Auth;
using Velos.Application.Auth.SignUp;
using Velos.Application.Common;

namespace Velos.Application.Tests.Auth;

/// <summary>H1, RN1, RN2, CA12, CA13 e CA17 da spec 001.</summary>
public class SignUpHandlerTests
{
    private readonly FakeIdentityProvider _identity = new();

    private SignUpHandler Handler => new(new SignUpValidator(), _identity);

    [Fact]
    public async Task Valid_sign_up_trims_the_name_and_normalizes_the_email()
    {
        var result = await Handler.HandleAsync(
            new SignUpCommand("  Pedro Freitas ", " Pedro@Example.COM", "Pedro10@", "Pedro10@"), default);

        Assert.True(result.IsSuccess);
        Assert.Equal(["sign-up:Pedro Freitas|pedro@example.com"], _identity.Calls);
    }

    [Fact]
    public async Task Different_confirmation_is_reported_on_the_second_field()
    {
        var result = await Handler.HandleAsync(
            new SignUpCommand("Pedro", "pedro@example.com", "Pedro10@", "Pedro10#"), default);

        Assert.Equal(["As senhas não coincidem"], Errors(result)["confirmPassword"]);
        Assert.Empty(_identity.Calls);
    }

    [Fact]
    public async Task Weak_password_lists_exactly_what_is_missing()
    {
        var result = await Handler.HandleAsync(
            new SignUpCommand("Pedro", "pedro@example.com", "Pedroabc", "Pedroabc"), default);

        Assert.Equal(
            ["A senha precisa ter: um número, um caractere especial (ex.: ! @ # $ %)"],
            Errors(result)["password"]);
    }

    [Theory]
    [InlineData("", "Informe seu nome")]
    [InlineData("   ", "Informe seu nome")]
    [InlineData(" P ", "O nome precisa ter pelo menos 2 letras")]
    public async Task Name_errors_say_what_is_wrong(string name, string message)
    {
        var result = await Handler.HandleAsync(
            new SignUpCommand(name, "pedro@example.com", "Pedro10@", "Pedro10@"), default);

        Assert.Equal([message], Errors(result)["name"]);
    }

    [Fact]
    public async Task Taken_email_comes_back_as_its_own_code()
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.EmailTaken);

        var result = await Handler.HandleAsync(
            new SignUpCommand("Pedro", "pedro@example.com", "Pedro10@", "Pedro10@"), default);

        Assert.Equal("email_taken", result.Error!.Code);
    }

    private static Dictionary<string, string[]> Errors(Result<AuthSession> result)
    {
        Assert.Equal("validation_failed", result.Error!.Code);
        return Assert.IsType<Dictionary<string, string[]>>(result.Error.Details!["errors"]);
    }
}
