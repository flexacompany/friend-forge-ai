
-- Criar tabela para a loja de avatares
CREATE TABLE public.avatar_store (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_id UUID NOT NULL REFERENCES public.avatares(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  downloads_count INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para avaliações e comentários
CREATE TABLE public.avatar_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_store_id UUID NOT NULL REFERENCES public.avatar_store(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(avatar_store_id, user_id)
);

-- Criar tabela para histórico de downloads
CREATE TABLE public.avatar_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_store_id UUID NOT NULL REFERENCES public.avatar_store(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.avatar_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_downloads ENABLE ROW LEVEL SECURITY;

-- Políticas para avatar_store
CREATE POLICY "Anyone can view published avatars" 
  ON public.avatar_store 
  FOR SELECT 
  USING (true);

CREATE POLICY "Creators can manage their published avatars" 
  ON public.avatar_store 
  FOR ALL 
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Políticas para avatar_ratings
CREATE POLICY "Anyone can view ratings" 
  ON public.avatar_ratings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can rate avatars" 
  ON public.avatar_ratings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
  ON public.avatar_ratings 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
  ON public.avatar_ratings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para avatar_downloads
CREATE POLICY "Users can view their download history" 
  ON public.avatar_downloads 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can download avatars" 
  ON public.avatar_downloads 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_avatar_store_updated_at
  BEFORE UPDATE ON public.avatar_store
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avatar_ratings_updated_at
  BEFORE UPDATE ON public.avatar_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para incrementar downloads
CREATE TRIGGER increment_download_count_trigger
  AFTER INSERT ON public.avatar_downloads
  FOR EACH ROW EXECUTE FUNCTION public.increment_download_count();

-- Função para calcular rating médio
CREATE OR REPLACE FUNCTION public.get_avatar_average_rating(store_id UUID)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating DECIMAL(3,2);
BEGIN
  SELECT ROUND(AVG(overall_rating), 2) INTO avg_rating
  FROM public.avatar_ratings
  WHERE avatar_store_id = store_id;
  
  RETURN COALESCE(avg_rating, 0);
END;
$$;

-- Função para incrementar contador de downloads
CREATE OR REPLACE FUNCTION public.increment_download_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.avatar_store 
  SET downloads_count = downloads_count + 1
  WHERE id = NEW.avatar_store_id;
  RETURN NEW;
END;
$$;
