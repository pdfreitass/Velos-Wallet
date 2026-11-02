using System.Globalization;
using Velos.Domain.Transactions;

namespace Velos.Application.Common;

/// <summary>
/// Mês no formato <c>yyyy-MM</c> vindo da URL (lista de transações e dashboard). Vazio = mês atual de
/// São Paulo. Só aceita de 2000 a 2100: a mesma faixa que a gravação de transações aceita.
/// </summary>
public static class MonthKey
{
    public const int MinYear = 2000;
    public const int MaxYear = 2100;

    public const string InvalidMessage = "Mês inválido";

    /// <returns>O primeiro dia do mês, ou <c>null</c> se o texto não é um mês válido.</returns>
    public static DateOnly? Parse(string? month, TimeProvider time)
    {
        if (string.IsNullOrEmpty(month))
        {
            var today = TransactionRules.Today(time);
            return new DateOnly(today.Year, today.Month, 1);
        }

        if (!DateOnly.TryParseExact(month, "yyyy-MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
        {
            return null;
        }

        return parsed.Year is >= MinYear and <= MaxYear ? parsed : null;
    }

    public static string Format(DateOnly monthStart) => monthStart.ToString("yyyy-MM", CultureInfo.InvariantCulture);
}
