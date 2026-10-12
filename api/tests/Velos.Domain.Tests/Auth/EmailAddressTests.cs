using Velos.Domain.Auth;

namespace Velos.Domain.Tests.Auth;

public class EmailAddressTests
{
    [Theory]
    [InlineData("  Pedro@Example.COM ", "pedro@example.com")]
    [InlineData("pedro@example.com", "pedro@example.com")]
    [InlineData("", "")]
    [InlineData(null, "")]
    public void Normalize_trims_and_lowercases(string? input, string expected)
    {
        Assert.Equal(expected, EmailAddress.Normalize(input));
    }
}
