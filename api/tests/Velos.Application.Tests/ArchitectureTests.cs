namespace Velos.Application.Tests;

/// <summary>Clean Architecture: a Application só conhece o Domain.</summary>
public class ArchitectureTests
{
    [Theory]
    [InlineData("Velos.Infrastructure")]
    [InlineData("Velos.Api")]
    public void Application_does_not_reference_outer_layers(string forbidden)
    {
        var references = typeof(AssemblyMarker).Assembly
            .GetReferencedAssemblies()
            .Select(a => a.Name);

        Assert.DoesNotContain(forbidden, references);
    }
}
