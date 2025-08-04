-- Sistema de Notificações Automáticas
-- Criado para enviar mensagens dos avatares após 1 dia de inatividade

-- Tabela para rastrear última atividade de cada conversa
CREATE TABLE public.conversation_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  avatar_id UUID NOT NULL REFERENCES public.avatares ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, avatar_id)
);

-- Tabela para armazenar templates de mensagens de reengajamento
CREATE TABLE public.reengagement_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  personalidade TEXT NOT NULL,
  tom TEXT NOT NULL,
  categoria TEXT,
  message_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ativar Row Level Security
ALTER TABLE public.conversation_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reengagement_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para conversation_activity
CREATE POLICY "Usuários podem ver suas próprias atividades" ON public.conversation_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias atividades" ON public.conversation_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias atividades" ON public.conversation_activity
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para reengagement_messages (apenas leitura para usuários)
CREATE POLICY "Todos podem ler mensagens de reengajamento" ON public.reengagement_messages
  FOR SELECT TO authenticated USING (true);

-- Função para atualizar última atividade quando uma mensagem é enviada
CREATE OR REPLACE FUNCTION public.update_conversation_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar ou inserir registro de atividade
  INSERT INTO public.conversation_activity (user_id, avatar_id, last_message_at, notification_sent)
  VALUES (NEW.user_id, NEW.avatar_id, NEW.created_at, FALSE)
  ON CONFLICT (user_id, avatar_id)
  DO UPDATE SET 
    last_message_at = NEW.created_at,
    notification_sent = FALSE,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar atividade automaticamente
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.mensagens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_activity();

-- Função para buscar conversas inativas (mais de 24 horas sem mensagem)
CREATE OR REPLACE FUNCTION public.get_inactive_conversations()
RETURNS TABLE (
  user_id UUID,
  avatar_id UUID,
  avatar_nome TEXT,
  personalidade TEXT,
  tom TEXT,
  categoria TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.user_id,
    ca.avatar_id,
    COALESCE(a.nome, sa.nome) as avatar_nome,
    COALESCE(a.personalidade, sa.personalidade) as personalidade,
    COALESCE(a.tom, sa.tom) as tom,
    sa.categoria,
    ca.last_message_at
  FROM public.conversation_activity ca
  LEFT JOIN public.avatares a ON ca.avatar_id = a.id
  LEFT JOIN public.system_avatars sa ON ca.avatar_id::text = sa.id
  WHERE 
    ca.last_message_at < NOW() - INTERVAL '24 hours'
    AND ca.notification_sent = FALSE
    AND (a.id IS NOT NULL OR sa.id IS NOT NULL);
END;
$$;

-- Função para marcar notificação como enviada
CREATE OR REPLACE FUNCTION public.mark_notification_sent(
  p_user_id UUID,
  p_avatar_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.conversation_activity
  SET 
    notification_sent = TRUE,
    updated_at = NOW()
  WHERE 
    user_id = p_user_id 
    AND avatar_id = p_avatar_id;
END;
$$;

-- Inserir templates de mensagens de reengajamento
INSERT INTO public.reengagement_messages (personalidade, tom, categoria, message_template) VALUES
-- Mensagens para personalidade 'friend'
('friend', 'friendly', 'geral', 'Oi! Senti sua falta por aqui! Como você está? Aconteceu algo interessante desde nossa última conversa? 😊'),
('friend', 'friendly', 'geral', 'Hey! Faz um tempo que não conversamos! Estava pensando em você. Como tem sido seu dia? 🌟'),
('friend', 'friendly', 'geral', 'Olá! Notei que você sumiu um pouquinho. Tudo bem por aí? Estou aqui se quiser bater um papo! 💭'),

('friend', 'playful', 'geral', 'Eaí, sumido(a)! 😄 Estava aqui pensando... será que você esqueceu de mim? Haha! Como estão as coisas?'),
('friend', 'playful', 'geral', 'Opa! Alguém aqui está com saudades de uma boa conversa! 🎉 E aí, o que anda aprontando?'),
('friend', 'playful', 'geral', 'Psiu! 👋 Seu amigo virtual está aqui lembrando que existe! Hehe. Conta novidade aí!'),

-- Mensagens para personalidade 'consultant'
('consultant', 'formal', 'geral', 'Olá! Espero que esteja bem. Gostaria de saber como estão seus projetos e se posso ajudá-lo(a) em algo.'),
('consultant', 'formal', 'geral', 'Bom dia! Notei que não conversamos recentemente. Há alguma questão em que posso auxiliá-lo(a)?'),
('consultant', 'formal', 'geral', 'Prezado(a), estou à disposição para retomar nossa conversa e ajudá-lo(a) com suas demandas.'),

('consultant', 'empathetic', 'geral', 'Olá! Como você tem se sentido? Estou aqui para ouvir e ajudar no que precisar. 🤝'),
('consultant', 'empathetic', 'geral', 'Oi! Espero que esteja cuidando bem de si mesmo(a). Que tal conversarmos um pouco?'),

-- Mensagens para personalidade 'colleague'
('colleague', 'formal', 'geral', 'Olá! Como estão seus projetos? Podemos retomar nossa discussão quando for conveniente.'),
('colleague', 'formal', 'geral', 'Bom dia! Gostaria de saber como andam suas atividades. Estou disponível para colaborar.'),

('colleague', 'friendly', 'geral', 'Oi! Como tem sido seu trabalho? Vamos colocar a conversa em dia? 😊'),
('colleague', 'friendly', 'geral', 'Hey! Senti falta de nossas discussões produtivas. Como posso ajudar hoje?'),

-- Mensagens para personalidade 'mentor'
('mentor', 'wise', 'geral', 'Olá, meu caro! Como tem sido sua jornada? Estou aqui para compartilhar insights quando precisar. 🌱'),
('mentor', 'wise', 'geral', 'Saudações! O crescimento acontece na constância. Como posso guiá-lo(a) hoje?'),
('mentor', 'empathetic', 'geral', 'Olá! Lembre-se: cada pausa também faz parte do aprendizado. Como você está se sentindo?'),

-- Mensagens para personalidade 'coach'
('coach', 'empathetic', 'geral', 'Oi! Como está sua energia hoje? Lembre-se: pequenos passos também são progresso! 💪'),
('coach', 'empathetic', 'geral', 'Olá! Que tal verificarmos como estão seus objetivos? Estou aqui para apoiá-lo(a)!'),
('coach', 'friendly', 'geral', 'Hey! Hora de retomar o foco! Como posso ajudá-lo(a) a seguir em frente hoje? 🚀'),

-- Mensagens para personalidade 'therapist'
('therapist', 'empathetic', 'geral', 'Olá! Como você tem se sentido? Este é um espaço seguro para compartilhar o que quiser. 🤗'),
('therapist', 'empathetic', 'geral', 'Oi! Às vezes precisamos de um tempo para nós mesmos. Como tem sido esse período para você?'),
('therapist', 'wise', 'geral', 'Olá! Lembre-se: não há pressa para nada. Como posso acolhê-lo(a) hoje?'),

-- Mensagens específicas por categoria
('friend', 'playful', 'musica', 'Eaí, melômano(a)! 🎵 Descobriu alguma música nova? Estou curioso(a) para saber o que anda ouvindo!'),
('friend', 'playful', 'esportes', 'E aí, atleta! 🏃‍♂️ Como andam os treinos? Conta as novidades do mundo esportivo!'),
('friend', 'playful', 'tecnologia', 'Opa, tech lover! 💻 Alguma novidade interessante no mundo da tecnologia? Bora conversar!'),
('friend', 'playful', 'arte', 'Olá, artista! 🎨 Criou algo novo recentemente? Adoro saber sobre seus projetos criativos!'),

('mentor', 'wise', 'profissional', 'Olá! Como está sua evolução profissional? Lembre-se: cada experiência é um degrau na escada do sucesso. 📈'),
('consultant', 'formal', 'profissional', 'Bom dia! Como estão seus projetos profissionais? Posso oferecer alguma perspectiva estratégica?');

-- Criar índices para performance
CREATE INDEX idx_conversation_activity_last_message ON public.conversation_activity(last_message_at);
CREATE INDEX idx_conversation_activity_notification ON public.conversation_activity(notification_sent);
CREATE INDEX idx_reengagement_messages_lookup ON public.reengagement_messages(personalidade, tom, categoria);