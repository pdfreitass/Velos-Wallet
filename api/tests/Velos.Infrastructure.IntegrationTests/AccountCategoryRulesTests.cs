using System.Text.Json;
using Npgsql;

namespace Velos.Infrastructure.IntegrationTests;

/// <summary>
/// Regras que o BANCO garante para contas e categorias (migration 0009, spec 002), contra o banco
/// real, como a conta de teste (RLS valendo). Tudo roda numa transação DESFEITA no final: nenhum
/// teste deixa dado gravado.
/// </summary>
public class AccountCategoryRulesTests
{
    [DatabaseFact(RequiresTestUser = true)]
    public async Task Initial_balance_sign_depends_on_the_account_type()
    {
        await InUserTransactionAsync(async sql =>
        {
            Assert.True(await sql.SucceedsAsync("insert into public.accounts (user_id, name, type, initial_balance_cents) values (@u, 'Corrente', 'checking', -35000)"));
            Assert.True(await sql.SucceedsAsync("insert into public.accounts (user_id, name, type, initial_balance_cents) values (@u, 'Cartão', 'credit_card', -64090)"));
            Assert.True(await sql.SucceedsAsync("insert into public.accounts (user_id, name, type, initial_balance_cents) values (@u, 'Cartão zerado', 'credit_card', 0)"));

            Assert.Equal(PostgresErrorCodes.CheckViolation, await sql.FailsWithAsync("insert into public.accounts (user_id, name, type, initial_balance_cents) values (@u, 'Poupança', 'savings', -1)"));
            Assert.Equal(PostgresErrorCodes.CheckViolation, await sql.FailsWithAsync("insert into public.accounts (user_id, name, type, initial_balance_cents) values (@u, 'Dinheiro', 'cash', -1)"));
            Assert.Equal(PostgresErrorCodes.CheckViolation, await sql.FailsWithAsync("insert into public.accounts (user_id, name, type, initial_balance_cents) values (@u, 'Cartão', 'credit_card', 1)"));
        });
    }

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Names_have_a_maximum_length()
    {
        await InUserTransactionAsync(async sql =>
        {
            Assert.True(await sql.SucceedsAsync($"insert into public.accounts (user_id, name, type) values (@u, '{new string('a', 40)}', 'cash')"));
            Assert.Equal(PostgresErrorCodes.CheckViolation, await sql.FailsWithAsync($"insert into public.accounts (user_id, name, type) values (@u, '{new string('a', 41)}', 'cash')"));
            Assert.Equal(PostgresErrorCodes.CheckViolation, await sql.FailsWithAsync($"insert into public.categories (user_id, name, type) values (@u, '{new string('a', 31)}', 'expense')"));
        });
    }

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Category_name_is_unique_per_type_ignoring_case()
    {
        await InUserTransactionAsync(async sql =>
        {
            // "Lazer" de despesa já existe entre as categorias padrão.
            Assert.True(await sql.SucceedsAsync("insert into public.categories (user_id, name, type) values (@u, 'Lazer', 'income')"));
            Assert.Equal(PostgresErrorCodes.UniqueViolation, await sql.FailsWithAsync("insert into public.categories (user_id, name, type) values (@u, 'lazer', 'expense')"));
        });
    }

    [DatabaseFact(RequiresTestUser = true)]
    public async Task Deleting_a_category_keeps_its_transactions_without_category()
    {
        await InUserTransactionAsync(async sql =>
        {
            var accountId = await sql.ScalarAsync<Guid>("insert into public.accounts (user_id, name, type) values (@u, 'Conta T11', 'cash') returning id");
            var categoryId = await sql.ScalarAsync<Guid>("insert into public.categories (user_id, name, type) values (@u, 'Categoria T11', 'expense') returning id");
            var transactionId = await sql.ScalarAsync<Guid>(
                $"insert into public.transactions (user_id, account_id, category_id, type, amount_cents, date) values (@u, '{accountId}', '{categoryId}', 'expense', 1000, current_date) returning id");

            // Antes da 0009 este delete falhava (o set null tentava anular também o user_id).
            Assert.True(await sql.SucceedsAsync($"delete from public.categories where id = '{categoryId}'"));

            Assert.Null(await sql.ScalarAsync<Guid?>($"select category_id from public.transactions where id = '{transactionId}'"));
            Assert.Equal(TestDatabase.TestUserId, await sql.ScalarAsync<Guid>($"select user_id from public.transactions where id = '{transactionId}'"));
        });
    }

    private static async Task InUserTransactionAsync(Func<Sql, Task> body)
    {
        var userId = TestDatabase.TestUserId!.Value;
        await using var connection = new NpgsqlConnection(TestDatabase.ConnectionString);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        var claims = JsonSerializer.Serialize(new Dictionary<string, string> { ["sub"] = userId.ToString(), ["role"] = "authenticated" });
        await using (var setup = new NpgsqlCommand("select set_config('role', 'authenticated', true), set_config('request.jwt.claims', @c, true)", connection, transaction))
        {
            setup.Parameters.AddWithValue("c", claims);
            await setup.ExecuteNonQueryAsync();
        }

        try
        {
            await body(new Sql(connection, transaction, userId));
        }
        finally
        {
            await transaction.RollbackAsync();
        }
    }

    /// <summary>Cada comando roda num savepoint: um erro esperado não aborta a transação inteira.</summary>
    private sealed class Sql(NpgsqlConnection connection, NpgsqlTransaction transaction, Guid userId)
    {
        public async Task<bool> SucceedsAsync(string text)
        {
            await ExecuteAsync(text);
            return true;
        }

        public async Task<string> FailsWithAsync(string text)
        {
            await transaction.SaveAsync("caso");
            try
            {
                await ExecuteAsync(text);
            }
            catch (PostgresException error)
            {
                await transaction.RollbackAsync("caso");
                return error.SqlState;
            }

            throw new Xunit.Sdk.XunitException($"Era para falhar, mas passou: {text}");
        }

        public async Task<T> ScalarAsync<T>(string text)
        {
            await using var command = Command(text);
            var value = await command.ExecuteScalarAsync();
            return value is null or DBNull ? default! : (T)value;
        }

        private async Task ExecuteAsync(string text)
        {
            await using var command = Command(text);
            await command.ExecuteNonQueryAsync();
        }

        private NpgsqlCommand Command(string text)
        {
            var command = new NpgsqlCommand(text, connection, transaction);
            command.Parameters.AddWithValue("u", userId);
            return command;
        }
    }
}
