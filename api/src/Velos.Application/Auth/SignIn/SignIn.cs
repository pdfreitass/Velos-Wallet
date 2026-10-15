using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;
using Velos.Domain.Auth;

namespace Velos.Application.Auth.SignIn;

public sealed record SignInCommand(string Email, string Password);

public sealed class SignInValidator : AbstractValidator<SignInCommand>
{
    public SignInValidator()
    {
        RuleFor(command => command.Email).Cascade(CascadeMode.Stop).ValidEmail();

        // No login a senha só precisa existir: a regra forte (RN1) vale para senhas novas.
        RuleFor(command => command.Password).Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Informe sua senha")
            .MaximumLength(PasswordPolicy.MaxLength).WithMessage("Email ou senha incorretos");
    }
}

/// <summary>
/// Login com bloqueio de tentativas (RN5). Falha FECHADA: sem conseguir reservar a tentativa, o
/// login não acontece. A contagem vale para qualquer email, exista a conta ou não.
///
/// A tentativa é reservada ANTES de chamar o Supabase (migration 0008): conferir e registrar em
/// passos separados deixava tentativas em paralelo passarem do limite (achado S3 da T23).
/// </summary>
public sealed class SignInHandler(
    IValidator<SignInCommand> validator,
    ILoginLockout lockout,
    IIdentityProvider identity,
    TimeProvider time)
{
    public async Task<Result<AuthSession>> HandleAsync(SignInCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var input = command with { Email = EmailAddress.Normalize(command.Email) };

        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid)
        {
            return Result.Failure<AuthSession>(ValidationErrors.From(validation));
        }

        var reservation = await lockout.ReserveAttemptAsync(input.Email, cancellationToken);
        if (!reservation.IsSuccess)
        {
            return Result.Failure<AuthSession>(reservation.Error!);
        }

        var state = reservation.Value.State;
        if (!reservation.Value.Allowed)
        {
            return Result.Failure<AuthSession>(
                LockedError(state) ?? AuthErrors.Locked((int)LoginLockoutPolicy.LockDuration.TotalMinutes));
        }

        var signIn = await identity.SignInWithPasswordAsync(input.Email, input.Password, cancellationToken);
        if (signIn.IsSuccess)
        {
            // Login certo zera a contagem. Se zerar falhar, a sessão continua válida (só a contagem fica).
            await lockout.ClearAsync(signIn.Value.User, cancellationToken);
            return signIn;
        }

        // Outro erro (Supabase fora do ar, limite): passa adiante. A tentativa reservada continua
        // contando de propósito (ver migration 0008).
        if (signIn.Error!.Code != AuthErrors.InvalidCredentialsCode)
        {
            return signIn;
        }

        return Result.Failure<AuthSession>(
            LockedError(state)
            ?? AuthErrors.InvalidCredentials(LoginLockoutPolicy.AttemptsLeftToWarn(state.FailedCount)));
    }

    private AppError? LockedError(LockoutState state)
    {
        var now = time.GetUtcNow();
        return state.LockedUntil is { } until && until > now
            ? AuthErrors.Locked(LoginLockoutPolicy.MinutesLeft(until, now))
            : null;
    }
}
