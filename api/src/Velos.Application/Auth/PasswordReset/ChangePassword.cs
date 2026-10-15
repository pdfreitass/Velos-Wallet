using FluentValidation;
using Velos.Application.Abstractions;
using Velos.Application.Common;

namespace Velos.Application.Auth.PasswordReset;

public sealed record ChangePasswordCommand(string Password, string ConfirmPassword);

public sealed class ChangePasswordValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordValidator()
    {
        RuleFor(command => command.Password).Cascade(CascadeMode.Stop).StrongPassword();

        // RN2, igual ao cadastro: o erro aparece no segundo campo.
        RuleFor(command => command.ConfirmPassword).Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Confirme sua senha")
            .Equal(command => command.Password).WithMessage("As senhas não coincidem");
    }
}

/// <summary>
/// Grava a senha nova (H5). Quem chega aqui já provou ter o link do email: a API só aceita com o
/// cookie de recuperação do MESMO usuário da sessão.
///
/// Redefinir a senha LIBERA o bloqueio de tentativas (RN5): quem esqueceu a senha e errou cinco
/// vezes não fica mais 10 minutos de fora depois de provar que é dono do email.
/// </summary>
public sealed class ChangePasswordHandler(
    IValidator<ChangePasswordCommand> validator,
    IIdentityProvider identity,
    ILoginLockout lockout)
{
    public async Task<Result<Unit>> HandleAsync(
        ChangePasswordCommand command, string accessToken, UserIdentity user, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        var input = command with
        {
            Password = command.Password ?? string.Empty,
            ConfirmPassword = command.ConfirmPassword ?? string.Empty,
        };

        var validation = await validator.ValidateAsync(input, cancellationToken);
        if (!validation.IsValid)
        {
            return Result.Failure<Unit>(ValidationErrors.From(validation));
        }

        var updated = await identity.UpdatePasswordAsync(accessToken, input.Password, cancellationToken);
        if (!updated.IsSuccess)
        {
            return updated;
        }

        // A senha já mudou. Se zerar o bloqueio falhar, a troca continua valendo: no pior caso o
        // usuário espera os 10 minutos. Fazer o contrário (desfazer a senha) seria pior.
        await lockout.ClearAsync(user, cancellationToken);
        return Result.Ok();
    }
}
