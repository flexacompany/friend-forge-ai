-- Atualizar constraints da tabela avatares para incluir novos tipos de personalidade
ALTER TABLE public.avatares 
DROP CONSTRAINT IF EXISTS avatares_personalidade_check;

ALTER TABLE public.avatares 
ADD CONSTRAINT avatares_personalidade_check 
CHECK (personalidade IN (
  'friend', 'consultant', 'colleague', 'mentor', 'coach', 'therapist',
  'romantic', 'father', 'mother', 'sibling', 'neighbor', 'grandparent',
  'bestfriend', 'collegestudent', 'schoolmate'
));

-- Atualizar constraints da tabela avatares para incluir novos tons de voz
ALTER TABLE public.avatares 
DROP CONSTRAINT IF EXISTS avatares_tom_check;

ALTER TABLE public.avatares 
ADD CONSTRAINT avatares_tom_check 
CHECK (tom IN (
  'friendly', 'formal', 'playful', 'empathetic', 'witty', 'wise'
));