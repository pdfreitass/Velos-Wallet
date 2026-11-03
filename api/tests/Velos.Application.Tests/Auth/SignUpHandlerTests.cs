using Velos.Application.Auth;
using Velos.Application.Auth.SignUp;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Tests.Auth;

/// <summary>H1, RN1, RN2, CA12, CA13 e CA17 da spec 001; spec 013 (cadastro com confirmação).</summary>
public class SignUpHandlerTests
{
    private const string RedirectTo = "http://localhost:3000/auth/confirmar-cadastro";

    private readonly FakeIdentityProvider _identity = new();

    private SignUpHandler Handler => new(new SignUpValidator(), _identity);

    [Fact]
    public async Task Valid_sign_up_trims_the_name_and_normalizes_the_email()
    {
        var result = await Handler.HandleAsync(
            new SignUpCommand("  Pedro Freitas ", " Pedro@Example.COM", "Pedro10@", "Pedro10@"), RedirectTo, default);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value.Session);
        Assert.Null(result.Value.CodeVerifier);
        var call = Assert.Single(_identity.Calls);
        Assert.StartsWith("sign-up:Pedro Freitas|pedro@example.com|", call, StringComparison.Ordinal);
        Assert.EndsWith($"|{RedirectTo}", call, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Confirmation_required_returns_the_verifier_without_a_session()
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.ConfirmationRequired);

        var result = await Handler.HandleAsync(
            new SignUpCommand("Pedro", "pedro@example.com", "Pedro10@", "Pedro10@"), RedirectTo, default);

        Assert.True(result.IsSuccess);
        Assert.Null(result.Value.Session);
        Assert.False(string.IsNullOrWhiteSpace(result.Value.CodeVerifier));

        // O que foi para o Supabase é o HASH do verifier, nunca o verifier.
        var call = Assert.Single(_identity.Calls);
        var parts = call.Split('|');
        Assert.Equal(PkcePair.ChallengeFor(result.Value.CodeVerifier), parts[2]);
        Assert.DoesNotContain(result.Value.CodeVerifier, parts[2], StringComparison.Ordinal);
        Assert.Equal(RedirectTo, parts[3]);
    }

    [Fact]
    public async Task Each_sign_up_gets_a_new_verifier()
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.ConfirmationRequired);
        var command = new SignUpCommand("Pedro", "pedro@example.com", "Pedro10@", "Pedro10@");

        var first = await Handler.HandleAsync(command, RedirectTo, default);
        var second = await Handler.HandleAsync(command, RedirectTo, default);

        Assert.NotEqual(first.Value.CodeVerifier, second.Value.CodeVerifier);
    }

    [Fact]
    public async Task Different_confirmation_is_reported_on_the_second_field()
    {
        var result = await Handler.HandleAsync(
            new SignUpCommand("Pedro", "pedro@example.com", "Pedro10@", "Pedro10#"), RedirectTo, default);

        Assert.Equal(["As senhas não coincidem"], Errors(result)["confirmPassword"]);
        Assert.Empty(_identity.Calls);
    }

    [Fact]
    public async Task Weak_password_lists_exactly_what_is_missing()
    {
        var result = await Handler.HandleAsync(
            new SignUpCommand("Pedro", "pedro@example.com", "Pedroabc", "Pedroabc"), RedirectTo, default);

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
            new SignUpCommand(name, "pedro@example.com", "Pedro10@", "Pedro10@"), RedirectTo, default);

        Assert.Equal([message], Errors(result)["name"]);
    }

    [Fact]
    public async Task Taken_email_comes_back_as_its_own_code()
    {
        _identity.NextResult = Result.Failure<AuthSession>(AuthErrors.EmailTaken);

        var result = await Handler.HandleAsync(
            new SignUpCommand("Pedro", "pedro@example.com", "Pedro10@", "Pedro10@"), RedirectTo, default);

        Assert.Equal("email_taken", result.Error!.Code);
    }

    private static Dictionary<string, string[]> Errors(Result<SignUpStarted> result)
    {
        Assert.Equal("validation_failed", result.Error!.Code);
        return Assert.IsType<Dictionary<string, string[]>>(result.Error.Details!["errors"]);
    }
}
