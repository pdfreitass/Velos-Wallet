using Velos.Application.Auth;

namespace Velos.Application.Tests.Auth;

/// <summary>Mensagens do bloqueio (CA14, spec 001; T17): plural de verdade, nunca "minuto(s)".</summary>
public class AuthErrorsTests
{
    [Theory]
    [InlineData(2, "Email ou senha incorretos. Mais 2 tentativas incorretas e o acesso será bloqueado por 10 minutos.")]
    [InlineData(1, "Email ou senha incorretos. Mais 1 tentativa incorreta e o acesso será bloqueado por 10 minutos.")]
    public void Attempts_warning_uses_singular_and_plural(int attemptsLeft, string expected)
    {
        Assert.Equal(expected, AuthErrors.InvalidCredentials(attemptsLeft).Message);
    }

    [Theory]
    [InlineData(10, "Muitas tentativas incorretas. Tente novamente em 10 minutos ou redefina sua senha.")]
    [InlineData(1, "Muitas tentativas incorretas. Tente novamente em 1 minuto ou redefina sua senha.")]
    public void Locked_message_uses_singular_and_plural(int minutesLeft, string expected)
    {
        Assert.Equal(expected, AuthErrors.Locked(minutesLeft).Message);
    }
}
