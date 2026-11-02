using FluentValidation;
using Velos.Domain.Categories;

namespace Velos.Application.Categories;

/// <summary>
/// O que criar e editar validam em comum. Na edição o tipo é o da categoria salva (RN8).
/// O nome chega já sem os espaços das pontas.
/// </summary>
public sealed record CategoryInput(string Name, CategoryType? Type, string Color, string Icon);

/// <summary>
/// RN8–RN10 com as MESMAS mensagens do Zod do front (<c>web/src/lib/validations/categories.ts</c>).
/// O nome único por tipo não é checado aqui: é o índice do banco que garante (sem corrida).
/// </summary>
public sealed class CategoryInputValidator : AbstractValidator<CategoryInput>
{
    public CategoryInputValidator()
    {
        RuleFor(input => input.Name).Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Informe o nome da categoria")
            .MaximumLength(CategoryRules.NameMaxLength)
                .WithMessage($"O nome pode ter no máximo {CategoryRules.NameMaxLength} caracteres");

        RuleFor(input => input.Type).Cascade(CascadeMode.Stop)
            .NotNull().WithMessage("Escolha o tipo da categoria")
            .IsInEnum().WithMessage("Escolha o tipo da categoria");

        RuleFor(input => input.Color)
            .Must(CategoryCatalog.IsAllowedColor).WithMessage("Escolha uma cor da lista");

        RuleFor(input => input.Icon)
            .Must(CategoryCatalog.IsAllowedIcon).WithMessage("Escolha um ícone da lista");
    }
}
