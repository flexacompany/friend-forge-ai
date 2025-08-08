
-- Criar bucket para avatares
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Política para permitir que usuários façam upload de suas próprias imagens
CREATE POLICY "Users can upload avatar images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir que todos vejam as imagens (já que o bucket é público)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Política para permitir que usuários atualizem suas próprias imagens
CREATE POLICY "Users can update their avatar images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política para permitir que usuários deletem suas próprias imagens
CREATE POLICY "Users can delete their avatar images" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
