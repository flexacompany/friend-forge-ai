-- Adicionar campo avatarType à tabela avatares
ALTER TABLE public.avatares 
ADD COLUMN avatar_type text DEFAULT 'emoji' CHECK (avatar_type IN ('emoji', 'image'));

-- Atualizar registros existentes para ter o tipo 'emoji'
UPDATE public.avatares SET avatar_type = 'emoji' WHERE avatar_type IS NULL;

-- Tornar o campo obrigatório
ALTER TABLE public.avatares ALTER COLUMN avatar_type SET NOT NULL;