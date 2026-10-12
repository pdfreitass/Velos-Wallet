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
/// Login com bloqueio de tentativas (RN5). Falha FECHADA: sem conseguir consultar ou registrar
/// o bloqueio, o login não acontece. A contagem vale para qualquer email, exista a conta ou não.
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

        var state = await lockout.GetStateAsync(input.Email, cancellationToken);
        if (!state.IsSuccess)
        {
            return Result.Failure<AuthSession>(state.Error!);
        }

        if (LockedError(state.Value) is { } locked)
        {
            return Result.Failure<AuthSession>(locked);
        }

        var signIn = await identity.SignInWithPasswordAsync(input.Email, input.Password, cancellationToken);
        if (signIn.IsSuccess)
        {
            // Login certo zera a contagem. Se zerar falhar, a sessão continua válida (só a contagem fica).
            await lockout.ClearAsync(signIn.Value.User, cancellationToken);
            return signIn;
        }

        if (signIn.Error!.Code != AuthErrors.InvalidCredentialsCode)
        {
            return signIn;
        }

        var after = await lockout.RegisterFailureAsync(input.Email, cancellationToken);
        if (!after.IsSuccess)
        {
            return Result.Failure<AuthSession>(after.Error!);
        }

        return Result.Failure<AuthSession>(
            LockedError(after.Value)
            ?? AuthErrors.InvalidCredentials(LoginLockoutPolicy.AttemptsLeftToWarn(after.Value.FailedCount)));
    }

    private AppError? LockedError(LockoutState state)
    {
        var now = time.GetUtcNow();
        return state.LockedUntil is { } until && until > now
            ? AuthErrors.Locked(LoginLockoutPolicy.MinutesLeft(until, now))
            : null;
    }
}
