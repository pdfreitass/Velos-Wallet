/**
 * Leitura centralizada das variaveis de ambiente publicas.
 *
 * A validacao e preguicosa (getters) de proposito: se fosse feita no topo do
 * modulo, o `next build` falharia em qualquer maquina sem `.env.local` — por
 * exemplo num CI — mesmo que a pagina nem use Supabase. Assim o erro aparece
 * onde o problema esta: na primeira chamada que precisa da chave.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variavel de ambiente ${name} nao definida. ` +
        `Copie .env.example para .env.local e preencha com os valores do seu ` +
        `projeto Supabase (Project Settings -> API).`,
    );
  }
  return value;
}

/** Ha chaves de Supabase configuradas? Usado para degradar sem explodir. */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export const env = {
  get supabaseUrl(): string {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseAnonKey(): string {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  /**
   * Endereco publico do app, sem barra final. Base dos links de email e do
   * retorno do Google. Vem do ambiente, nunca do header `Host` da request:
   * esse header e controlado por quem faz o pedido.
   */
  get siteUrl(): string {
    const value = required(
      "NEXT_PUBLIC_SITE_URL",
      process.env.NEXT_PUBLIC_SITE_URL,
    );
    return new URL(value).origin;
  },
};
