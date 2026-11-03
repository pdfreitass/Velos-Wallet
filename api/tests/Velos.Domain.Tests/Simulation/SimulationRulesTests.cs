using Velos.Domain.Simulation;

namespace Velos.Domain.Tests.Simulation;

/// <summary>
/// Spec 012. Os números do CA1 e do CA2 estão escritos à mão aqui e, iguais, no teste do front
/// (<c>simulation-math.test.ts</c>): é esse par que impede os dois cálculos de divergirem.
/// </summary>
public sealed class SimulationRulesTests
{
    /// <summary>CA1: média de R$ 400,00 em "Lazer", corte de 20% ⇒ R$ 80,00 por mês.</summary>
    [Fact]
    public void Ca1_corte_de_20_por_cento_sobre_400_reais_da_80_reais()
    {
        Assert.Equal(8_000, SimulationRules.MonthlySavingCents(40_000, 20));
    }

    /// <summary>CA2: 6 e 12 meses são múltiplos exatos do mensal que a tela mostra.</summary>
    [Fact]
    public void Ca2_projecoes_sao_multiplos_exatos_do_mensal()
    {
        var mensal = SimulationRules.MonthlySavingCents(40_000, 20);

        Assert.Equal(48_000, SimulationRules.ProjectedCents(mensal, 6));
        Assert.Equal(96_000, SimulationRules.ProjectedCents(mensal, 12));
    }

    /// <summary>
    /// RN6, e a razão de o arredondamento ser um só: arredondar a média e depois multiplicar daria
    /// um número diferente de multiplicar e depois arredondar. A tela mostra o mensal, então é o
    /// mensal que manda.
    /// </summary>
    [Fact]
    public void Rn6_projecao_usa_o_mensal_ja_arredondado()
    {
        // 33% de R$ 100,01 = R$ 33,0033 ⇒ R$ 33,00 por mês.
        var mensal = SimulationRules.MonthlySavingCents(10_001, 33);
        Assert.Equal(3_300, mensal);

        // 12× o arredondado = R$ 396,00. Já 12× o valor exato daria R$ 396,04: a tela mentiria.
        Assert.Equal(39_600, SimulationRules.ProjectedCents(mensal, 12));
    }

    [Theory]
    // O meio centavo sobe.
    [InlineData(1_010, 50, 505)]
    [InlineData(101, 50, 51)]
    // Abaixo do meio, desce.
    [InlineData(100, 33, 33)]
    // Cortar tudo é cortar tudo (RN7).
    [InlineData(12_345, 100, 12_345)]
    // Média zero não vira dinheiro do nada.
    [InlineData(0, 100, 0)]
    public void Arredonda_ao_centavo_meio_para_cima(long mediaCents, int percentual, long esperado)
    {
        Assert.Equal(esperado, SimulationRules.MonthlySavingCents(mediaCents, percentual));
    }

    /// <summary>CA8.</summary>
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(101)]
    public void Ca8_percentual_fora_de_1_a_100_e_recusado(int percentual)
    {
        Assert.False(SimulationRules.IsValidPercent(percentual));
        Assert.Throws<ArgumentOutOfRangeException>(() => SimulationRules.MonthlySavingCents(40_000, percentual));
    }

    /// <summary>CA8: 100% é válido, e 1% também.</summary>
    [Theory]
    [InlineData(1)]
    [InlineData(100)]
    public void Ca8_as_pontas_da_faixa_sao_aceitas(int percentual)
    {
        Assert.True(SimulationRules.IsValidPercent(percentual));
    }

    /// <summary>Uma média negativa seria um erro de leitura, não um caso de uso: falhar alto.</summary>
    [Fact]
    public void Media_negativa_e_erro_de_programacao()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => SimulationRules.MonthlySavingCents(-1, 20));
    }

    /// <summary>O teto do app (R$ 999.999.999,99) projetado em 12 meses ainda cabe num long.</summary>
    [Fact]
    public void Teto_do_app_projetado_nao_estoura()
    {
        var mensal = SimulationRules.MonthlySavingCents(99_999_999_999, 100);

        Assert.Equal(99_999_999_999, mensal);
        Assert.Equal(1_199_999_999_988, SimulationRules.ProjectedCents(mensal, 12));
    }
}
