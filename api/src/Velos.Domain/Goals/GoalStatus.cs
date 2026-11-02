namespace Velos.Domain.Goals;

/// <summary>RN5 da spec 006: o texto de estado da meta sai daqui (nunca só a cor).</summary>
public enum GoalStatus
{
    /// <summary>Nenhum aporte ainda: "Comece com o primeiro aporte".</summary>
    NotStarted,

    /// <summary>"Faltam R$ X".</summary>
    InProgress,

    /// <summary>Juntado ≥ alvo: "Meta atingida" (continua aceitando aportes).</summary>
    Reached,
}
