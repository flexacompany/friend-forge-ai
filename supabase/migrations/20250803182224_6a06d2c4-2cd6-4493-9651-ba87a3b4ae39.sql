
-- Adicionar colunas background e interests à tabela avatares
ALTER TABLE public.avatares 
ADD COLUMN background text,
ADD COLUMN interests text;
