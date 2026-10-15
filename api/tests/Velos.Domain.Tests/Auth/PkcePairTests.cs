using System.Security.Cryptography;
using System.Text;
using Velos.Domain.Auth;

namespace Velos.Domain.Tests.Auth;

/// <summary>PKCE (RFC 7636) do fluxo de recuperação de senha.</summary>
public class PkcePairTests
{
    /// <summary>O exemplo do apêndice B da RFC 7636: prova que o S256 está certo.</summary>
    [Fact]
    public void Challenge_matches_the_rfc_7636_example()
    {
        const string verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

        Assert.Equal("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM", PkcePair.ChallengeFor(verifier));
    }

    [Fact]
    public void Verifier_length_is_inside_the_rfc_range()
    {
        var pair = PkcePair.Create();

        Assert.InRange(pair.Verifier.Length, 43, 128);
    }

    /// <summary>base64url: nada de +, / ou =, que precisariam de escape na URL.</summary>
    [Fact]
    public void Verifier_and_challenge_are_url_safe()
    {
        for (var i = 0; i < 50; i++)
        {
            var pair = PkcePair.Create();

            Assert.Matches("^[A-Za-z0-9_-]+$", pair.Verifier);
            Assert.Matches("^[A-Za-z0-9_-]+$", pair.Challenge);
        }
    }

    [Fact]
    public void Each_pair_is_different()
    {
        var verifiers = Enumerable.Range(0, 100).Select(_ => PkcePair.Create().Verifier).ToHashSet(StringComparer.Ordinal);

        Assert.Equal(100, verifiers.Count);
    }

    [Fact]
    public void Challenge_is_the_sha256_of_the_verifier()
    {
        var pair = PkcePair.Create();
        var expected = Convert.ToBase64String(SHA256.HashData(Encoding.ASCII.GetBytes(pair.Verifier)))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');

        Assert.Equal(expected, pair.Challenge);
    }

    /// <summary>O desafio não pode deixar o verifier legível: é o ponto do PKCE.</summary>
    [Fact]
    public void Challenge_does_not_contain_the_verifier()
    {
        var pair = PkcePair.Create();

        Assert.NotEqual(pair.Verifier, pair.Challenge);
        Assert.DoesNotContain(pair.Verifier, pair.Challenge, StringComparison.Ordinal);
    }
}
