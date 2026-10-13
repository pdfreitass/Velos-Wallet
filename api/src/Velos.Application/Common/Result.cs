namespace Velos.Application.Common;

/// <summary>Valor de um caso de uso que não devolve nada além do sucesso.</summary>
public readonly record struct Unit
{
    public static readonly Unit Value;
}

/// <summary>Sucesso com valor, ou falha com um <see cref="AppError"/>. Erros esperados não viram exceção.</summary>
public sealed class Result<T>
{
    private readonly T? _value;

    internal Result(T? value, AppError? error)
    {
        _value = value;
        Error = error;
    }

    public AppError? Error { get; }

    public bool IsSuccess => Error is null;

    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException($"Resultado com erro '{Error!.Code}' não tem valor.");
}

public static class Result
{
    public static Result<T> Success<T>(T value) => new(value, null);

    public static Result<T> Failure<T>(AppError error) => new(default, error);

    public static Result<Unit> Ok() => new(Unit.Value, null);
}
