-- Bucket publico com a identidade visual (spec 001, RN13).
--
-- Os emails de confirmacao e de redefinicao de senha precisam da logo numa
-- URL publica: Gmail e Outlook nao mostram SVG nem imagens em base64 de forma
-- confiavel.
--
-- Leitura publica pela URL do bucket. SEM policies em storage.objects: nenhum
-- utilizador do app consegue enviar, trocar ou apagar ficheiros. O upload e
-- feito so pelo painel do Supabase.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand',
  'brand',
  true,
  1048576, -- 1 MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;
