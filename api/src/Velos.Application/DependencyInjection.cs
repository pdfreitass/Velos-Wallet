using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Velos.Application.Auth.Google;
using Velos.Application.Auth.PasswordReset;
using Velos.Application.Auth.SignIn;
using Velos.Application.Auth.SignOut;
using Velos.Application.Auth.SignUp;
using Velos.Application.Profiles;

namespace Velos.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(AssemblyMarker).Assembly, includeInternalTypes: true);
        services.TryAddSingleton(TimeProvider.System);

        services.AddScoped<SignInHandler>();
        services.AddScoped<SignUpHandler>();
        services.AddScoped<SignOutHandler>();
        services.AddScoped<GetCurrentProfileHandler>();
        services.AddScoped<RequestPasswordResetHandler>();
        services.AddScoped<ConfirmPasswordResetHandler>();
        services.AddScoped<ChangePasswordHandler>();
        services.AddScoped<StartGoogleSignInHandler>();
        services.AddScoped<CompleteGoogleSignInHandler>();

        return services;
    }
}
