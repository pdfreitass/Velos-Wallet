using Velos.Domain.Auth;
using static Velos.Domain.Auth.PasswordRequirement;

namespace Velos.Domain.Tests.Auth;

/// <summary>RN1 da spec 001. Os mesmos casos valem para o Zod do front (T6) e para o Supabase (C1).</summary>
public class PasswordPolicyTests
{
    [Theory]
    [InlineData("Pedro10@")]               // exemplo da spec
    [InlineData("Abcdef1!")]
    [InlineData("Senha-Forte9")]
    [InlineData("Z9z~xxxx")]
    [InlineData("Aa1`aaaa")]               // crase
    [InlineData("Aa1\\aaaa")]              // barra invertida
    [InlineData("Aa1\"aaaa")]              // aspas
    [InlineData("Aa1'aaaa")]               // apóstrofo
    [InlineData("Pédro10@")]               // acento não atrapalha: os outros requisitos estão lá
    public void Strong_passwords_are_accepted(string password)
    {
        Assert.Empty(PasswordPolicy.UnmetRequirements(password));
        Assert.True(PasswordPolicy.IsStrong(password));
    }

    [Theory]
    [InlineData("pedro10@", new[] { Uppercase })]
    [InlineData("PEDRO10@", new[] { Lowercase })]
    [InlineData("Pedro10a", new[] { Symbol })]
    [InlineData("Pedro@ab", new[] { Number })]
    [InlineData("Pe10@", new[] { MinLength })]
    [InlineData("Pedrooo1ç", new[] { Symbol })]          // ç não é símbolo para o Supabase
    [InlineData("Pedro 10x", new[] { Symbol })]          // espaço também não
    [InlineData("Pedro10€", new[] { Symbol })]           // nem €
    [InlineData("Ａbcdef1!", new[] { Uppercase })]       // "Ａ" de largura total não é A-Z
    [InlineData("12345678", new[] { Lowercase, Uppercase, Symbol })]
    [InlineData("", new[] { MinLength, Lowercase, Uppercase, Number, Symbol })]
    public void Each_unmet_requirement_is_reported(string password, PasswordRequirement[] expected)
    {
        Assert.Equal(expected, PasswordPolicy.UnmetRequirements(password));
        Assert.False(PasswordPolicy.IsStrong(password));
    }

    [Fact]
    public void Every_supabase_symbol_counts_as_symbol()
    {
        foreach (var symbol in PasswordPolicy.Symbols)
        {
            Assert.Empty(PasswordPolicy.UnmetRequirements($"Abcdef1{symbol}"));
        }
    }

    [Fact]
    public void Length_limit_is_72_characters()
    {
        var atLimit = "Aa1!" + new string('x', PasswordPolicy.MaxLength - 4);

        Assert.True(PasswordPolicy.IsStrong(atLimit));
        Assert.False(PasswordPolicy.IsStrong(atLimit + "x"));
    }
}
