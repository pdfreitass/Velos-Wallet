namespace Velos.Application.Common;

public static class CommonErrors
{
    public static readonly AppError DatabaseUnavailable = new(
        "database_unavailable", ErrorKind.Unavailable,
        "Não foi possível acessar seus dados agora. Tente de novo em instantes.");

    public static readonly AppError ProfileNotFound = new(
        "profile_not_found", ErrorKind.NotFound, "Perfil não encontrado.");
}
