using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;

namespace Velos.Domain.Auth;

/// <summary>
/// Par PKCE (RFC 7636) do fluxo de recuperação de senha e do Google (spec 001, T19/T20).
///
/// O <see cref="Verifier"/> fica só num cookie httpOnly do navegador; o <see cref="Challenge"/>
/// (o hash) é o que viaja para o Supabase. Quem intercepta o link do email não consegue trocar
/// o código por uma sessão sem o verifier, que nunca saiu daqui.
/// </summary>
public sealed record PkcePair(string Verifier, string Challenge)
{
    /// <summary>
    /// 32 bytes aleatórios viram 43 caracteres em base64url — dentro dos 43–128 que a RFC 7636
    /// exige, e sem nenhum caractere que precise de escape na URL.
    /// </summary>
    private const int VerifierBytes = 32;

    /// <summary>O único método que o Supabase aceita. Minúsculo: é como o GoTrue espera.</summary>
    public const string Method = "s256";

    public static PkcePair Create()
    {
        var verifier = Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(VerifierBytes));
        return new PkcePair(verifier, ChallengeFor(verifier));
    }

    /// <summary>S256: base64url(SHA-256(verifier)), sobre os bytes ASCII do verifier.</summary>
    public static string ChallengeFor(string verifier) =>
        Base64Url.EncodeToString(SHA256.HashData(Encoding.ASCII.GetBytes(verifier ?? string.Empty)));
}
