namespace Velos.Domain.Tests;

/// <summary>Clean Architecture: o Domain não depende de nenhuma outra camada.</summary>
public class ArchitectureTests
{
    [Fact]
    public void Domain_does_not_reference_other_velos_projects()
    {
        var references = typeof(AssemblyMarker).Assembly
            .GetReferencedAssemblies()
            .Select(a => a.Name)
            .Where(name => name is not null && name.StartsWith("Velos.", StringComparison.Ordinal));

        Assert.Empty(references);
    }
}
