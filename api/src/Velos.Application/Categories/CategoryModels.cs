using Velos.Domain.Categories;

namespace Velos.Application.Categories;

/// <summary>Categoria como a lista e o formulário mostram. A cor é o hex canônico do <see cref="CategoryCatalog"/>.</summary>
public sealed record CategorySummary(Guid Id, string Name, CategoryType Type, string Color, string Icon);

/// <summary>Dados já validados e normalizados (nome sem espaços nas pontas; cor em maiúsculas).</summary>
public sealed record NewCategory(string Name, CategoryType Type, string Color, string Icon);

/// <summary>O tipo fica de fora: não muda depois de criada (RN8).</summary>
public sealed record CategoryChanges(string Name, string Color, string Icon);

/// <summary>RN11: quantas transações passam a "Sem categoria".</summary>
public sealed record CategoryDeletionImpact(int TransactionCount);
