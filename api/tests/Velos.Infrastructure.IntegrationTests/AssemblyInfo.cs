// Todas as classes usam o mesmo usuário de teste no banco real, e várias comparam totais "antes/depois"
// (DashboardStoreTests). Em paralelo, uma classe cria ou apaga contas no meio da conta da outra.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
