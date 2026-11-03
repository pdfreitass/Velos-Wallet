namespace Velos.Domain.Simulation;

/// <summary>
/// RN6 e RN7 da spec 012. As mesmas contas estão no front
/// (<c>web/src/features/simulation/simulation-math.ts</c>), que recalcula em memória enquanto a
/// pessoa move o percentual — e um teste de cada lado prende os dois aos mesmos números.
///
/// Aqui não se soma nada: a média mensal por categoria já vem somada do banco (ADR 0006). O que
/// existe nesta classe é só a projeção sobre esse número.
/// </summary>
public static class SimulationRules
{
    /// <summary>RN7: cortar 0% não é pergunta; cortar tudo é a pergunta original da ideia.</summary>
    public const int MinPercent = 1;

    /// <summary>RN7.</summary>
    public const int MaxPercent = 100;

    /// <summary>Os meses que a tela projeta, além do mensal.</summary>
    public static readonly IReadOnlyList<int> ProjectionMonths = [6, 12];

    /// <summary>RN7.</summary>
    public static bool IsValidPercent(int percent) => percent is >= MinPercent and <= MaxPercent;

    /// <summary>
    /// RN6: quanto sobraria por mês ao cortar <paramref name="percent"/>% de uma categoria que
    /// custa, em média, <paramref name="averageCents"/> por mês.
    ///
    /// A conta é inteira de propósito — nada de <c>double</c> com dinheiro. O <c>+ 50</c> antes da
    /// divisão arredonda o meio centavo para cima, e é **o único arredondamento da feature**: as
    /// projeções multiplicam este resultado, nunca a média original.
    /// </summary>
    /// <exception cref="ArgumentOutOfRangeException">Percentual fora de 1–100, ou média negativa.</exception>
    public static long MonthlySavingCents(long averageCents, int percent)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(averageCents);
        if (!IsValidPercent(percent))
        {
            throw new ArgumentOutOfRangeException(nameof(percent), percent, null);
        }

        return (averageCents * percent + 50) / 100;
    }

    /// <summary>
    /// RN6: a economia projetada em <paramref name="months"/> meses, múltiplo exato do valor mensal
    /// que a tela mostra — para 6× o que está na tela ser o que a tela mostra.
    /// </summary>
    public static long ProjectedCents(long monthlySavingCents, int months)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(monthlySavingCents);
        ArgumentOutOfRangeException.ThrowIfNegative(months);

        return monthlySavingCents * months;
    }
}
