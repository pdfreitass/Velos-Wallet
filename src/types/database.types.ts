/**
 * PLACEHOLDER — substituido na Etapa 2 por `npm run types:db`.
 *
 * Existe desde ja para que os clients Supabase sejam genericos em `Database`
 * desde a primeira linha de codigo, e nao haja um refactor depois.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
