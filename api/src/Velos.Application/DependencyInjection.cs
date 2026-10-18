using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Velos.Application.Accounts;
using Velos.Application.Categories;
using Velos.Application.Dashboard;
using Velos.Application.Auth.Google;
using Velos.Application.Auth.PasswordReset;
using Velos.Application.Auth.SignIn;
using Velos.Application.Auth.SignOut;
using Velos.Application.Auth.SignUp;
using Velos.Application.Profiles;
using Velos.Application.Transactions;

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

        services.AddScoped<ListAccountsHandler>();
        services.AddScoped<GetAccountHandler>();
        services.AddScoped<CreateAccountHandler>();
        services.AddScoped<UpdateAccountHandler>();
        services.AddScoped<GetAccountDeletionImpactHandler>();
        services.AddScoped<DeleteAccountHandler>();

        services.AddScoped<ListCategoriesHandler>();
        services.AddScoped<GetCategoryHandler>();
        services.AddScoped<CreateCategoryHandler>();
        services.AddScoped<UpdateCategoryHandler>();
        services.AddScoped<GetCategoryDeletionImpactHandler>();
        services.AddScoped<DeleteCategoryHandler>();

        services.AddScoped<ListTransactionsHandler>();
        services.AddScoped<GetTransactionHandler>();
        services.AddScoped<CreateTransactionHandler>();
        services.AddScoped<UpdateTransactionHandler>();
        services.AddScoped<DeleteTransactionHandler>();

        services.AddScoped<GetDashboardHandler>();

        return services;
    }
}
