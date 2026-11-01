# 06 · Auditoria de UI/UX

> **Limite:** análise **estática**, por leitura de `PRODUCT.md`, `DESIGN.md` (existência), `globals.css` (via ARQUITETURA e CHANGELOG), `button.tsx`, `PanelPage`, `router.tsx`, `api/client.ts` e dos relatos de acessibilidade/Lighthouse no CHANGELOG. **Não abri o app no navegador** nem medi contrastes. Tudo o que depende de ver a tela está marcado como não verificado.
> Referência: já existe design system (`DESIGN.md`, `.impeccable/design.json`, tokens em `globals.css`). Nada abaixo propõe trocar a identidade.

## 1. O que está bom e deve ser preservado

| Ponto | Evidência |
|---|---|
| Identidade coerente: verde profundo = marca, verde vivo = dinheiro; verde vivo nunca é botão principal no claro | CLAUDE.md, ADR 0016, tokens |
| Tokens `income`/`expense` com contraste **medido em comentário** (4,5:1+) e regra "nunca depender só da cor" (sinal +/− e ícone) | ARQUITETURA, `formatSignedCurrency` |
| Tema claro e escuro sem flash (script inline), escuro como padrão, `theme-color` acompanha | `index.html` |
| Mobile-first em 375 px declarado como princípio; viewport do Playwright MCP em 375×812 | `.mcp.json` |
| Formulários com erros anunciados a leitor de tela, `FormField`/`FormAlert` reutilizáveis | CHANGELOG, `features/auth/components` |
| Landing com Lighthouse 93–96 e acessibilidade 100 (registro, não reexecutado) | CHANGELOG |
| Estados de carga/erro de página inteira (`FullPageLoader`) | `router.tsx` |
| Textos em pt-BR com acento, voz próxima e direta | `PRODUCT.md` |

## 2. Problemas visuais (aparência)

| ID | Pri. | Problema | Benefício de corrigir |
|---|---|---|---|
| UX-V1 | P1 | **Alvos de toque abaixo de 44 px**: `Button` padrão tem `h-8` (32 px) e `lg` `h-9` (36 px) (`button.tsx:23,26`), contra os 44 px do `PRODUCT.md` | O app é de uso em uma mão no celular; botões de salvar/excluir pequenos geram toque errado em operação financeira. É a T8, já agendada para a Etapa 4 |
| UX-V2 | P2 | Vermelho de despesa `#E96368` sobre o card escuro do `PanelStage` dá 3,71:1 (T10) | Cumprir a regra de 4,5:1 também no decorativo |
| UX-V3 | P2 | `--sidebar-ring` claro em `#2ED38C` (1,80:1), ainda sem uso | Evitar que vire problema quando houver sidebar no desktop |
| UX-V4 | P3 | T7: fios da landing não chegam à linha exata da tela | Acabamento |

## 3. Problemas funcionais / de experiência

| ID | Pri. | Problema | Benefício |
|---|---|---|---|
| UX-F1 | **P1** | **O app logado não tem navegação nem layout.** `PanelPage` desenha o próprio cabeçalho; não existe `AppShell` (barra inferior no celular, lateral no desktop) | Contas, Lançamentos, Painel, Metas precisam de uma casca comum antes da Etapa 4, senão cada página reinventa o cabeçalho |
| UX-F2 | P1 | **Não existe o fluxo de "lançar em ≤ 3 toques"** (princípio de produto) | É o que define hábito (métrica de ativação 60% em 24 h). Precisa de botão de ação rápida, conta/data padrão, `MoneyInput` com teclado numérico |
| UX-F3 | P1 | **Sem padrão de lista** com skeleton, vazio e erro (regra do projeto) | A Etapa 4 cria o primeiro; vale extrair um `ListState` reutilizável |
| UX-F4 | P1 | **Sem padrão de confirmação destrutiva** | Excluir conta/transação precisa explicar a consequência (ver FI-01) e permitir arquivar |
| UX-F5 | P2 | **Estado vazio pós-cadastro**: o usuário novo cai num painel sem nada. Há 10 categorias padrão, mas nenhuma conta | Onboarding mínimo: "crie sua primeira conta" leva à primeira transação (ativação) |
| UX-F6 | P2 | **Erros de rede**: `ApiError(0, "network_error")` existe, mas sem padrão de "tentar de novo" nem aviso de perda de dado digitado | Evita perder um lançamento por sinal fraco no celular |
| UX-F7 | P2 | **Sem política de privacidade/termos** linkados no cadastro | Exigência para o público e para o Google OAuth sair do modo Teste |
| UX-F8 | P2 | **Promessa "Sem loja de apps"** na landing sem PWA entregue | Coerência marketing × produto |
| UX-F9 | P3 | Textos fixos "10 minutos"/"5 senhas" no front (T12) | Evitar divergência com a API |
| UX-F10 | P3 | Gráficos: nenhum ainda. Quando vier o Recharts, exigir tabela/valor textual alternativo e não só cor | Acessibilidade de gráficos |

## 4. Acessibilidade (WCAG 2.1 AA)

| Critério | Estado |
|---|---|
| Contraste 4,5:1 nos tokens | Medido no CSS (relato); **não remedi**. Exceções conhecidas T8/T10 |
| Foco visível, rótulo em todo campo, erros anunciados | Relatado e corrigido na T23 |
| Alvo de toque 44 px | **Não cumprido** (UX-V1) |
| Sem rolagem horizontal em 375 px | Declarado; **não verificado** |
| Não depender só da cor | Regra e helper existem; ainda sem listas para aplicar |
| Navegação por teclado em tabelas/listas/diálogos | Sem componentes ainda; `@base-ui/react` dá base boa para Dialog/Select |

## 5. Componentes existentes e faltantes

Existem: `Button`, `Card`, `Input`, `Label`, `PasswordInput`, `FormField`, `FormAlert`, `ThemeToggle`, `FullPageState`, `VelosMark`.
Planejados e ausentes: `MoneyInput`, `CategoryBadge` (Etapa 4). Faltam ainda, sem estarem planejados: `Dialog`/`AlertDialog`, `Select`, `DatePicker` (ou `<input type="date">` nativo, que é aceitável no MVP e mais acessível), `Tabs`, `Skeleton`, `EmptyState`, `Toast`, `AppShell`, gráfico base.

## 6. Recomendações

1. Criar o `AppShell` e os componentes base (`Dialog`/`AlertDialog`, `Skeleton`, `EmptyState`, `Toast`) como **primeira tarefa da Etapa 4**, junto com a correção da T8 (alvos de 44 px).
2. Definir o fluxo "novo lançamento" como protótipo antes de codar: campos mínimos (valor, categoria, conta, data=hoje), teclado numérico, 3 toques.
3. Usar `<input type="date">` nativo no MVP (acessível e rápido) em vez de um datepicker customizado.
4. Verificação visual na implementação: Playwright MCP em 375×812, claro e escuro, em cada etapa.
