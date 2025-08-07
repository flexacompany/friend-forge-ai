
-- Primeiro, vamos limpar e reconstruir tudo de forma organizada

-- 1. Remover tabelas existentes que serão recriadas
DROP TABLE IF EXISTS public.conversation_activity CASCADE;
DROP TABLE IF EXISTS public.avatar_downloads CASCADE;
DROP TABLE IF EXISTS public.avatar_ratings CASCADE;
DROP TABLE IF EXISTS public.avatar_review_comments CASCADE;
DROP TABLE IF EXISTS public.avatar_tags CASCADE;
DROP TABLE IF EXISTS public.avatar_store CASCADE;
DROP TABLE IF EXISTS public.mensagens CASCADE;
DROP TABLE IF EXISTS public.avatares CASCADE;
DROP TABLE IF EXISTS public.system_avatars CASCADE;
DROP TABLE IF EXISTS public.reengagement_messages CASCADE;

-- Remover views se existirem
DROP VIEW IF EXISTS public.avatar_store_stats CASCADE;

-- 2. Criar tipos enum para garantir consistência
DROP TYPE IF EXISTS public.avatar_personality CASCADE;
DROP TYPE IF EXISTS public.avatar_tone CASCADE;
DROP TYPE IF EXISTS public.avatar_category CASCADE;

CREATE TYPE public.avatar_personality AS ENUM (
    'friend',
    'consultant', 
    'colleague',
    'mentor',
    'coach',
    'therapist'
);

CREATE TYPE public.avatar_tone AS ENUM (
    'friendly',
    'formal',
    'playful', 
    'empathetic',
    'witty',
    'wise'
);

CREATE TYPE public.avatar_category AS ENUM (
    'business',
    'education',
    'health',
    'creative',
    'technical',
    'personal'
);

-- 3. Tabela principal de avatares (unificada)
CREATE TABLE public.avatares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    personalidade avatar_personality NOT NULL,
    tom avatar_tone NOT NULL,
    categoria avatar_category DEFAULT 'personal',
    avatar TEXT NOT NULL DEFAULT '🤖',
    avatar_type TEXT NOT NULL DEFAULT 'emoji' CHECK (avatar_type IN ('emoji', 'image')),
    background TEXT,
    interests TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    profissao TEXT,
    caracteristicas TEXT,
    inspiracao TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints para garantir integridade
    CONSTRAINT check_user_or_system CHECK (
        (is_system = true AND user_id IS NULL) OR 
        (is_system = false AND user_id IS NOT NULL)
    )
);

-- 4. Tabela de conversas/mensagens
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    avatar_id UUID NOT NULL REFERENCES public.avatares(id) ON DELETE CASCADE,
    title TEXT,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, avatar_id)
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_user BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Tabela para atividade e notificações
CREATE TABLE public.conversation_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notification_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    UNIQUE(conversation_id)
);

-- 6. Tabela para templates de reengajamento
CREATE TABLE public.reengagement_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personalidade avatar_personality NOT NULL,
    tom avatar_tone NOT NULL,
    categoria avatar_category,
    message_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Índices para performance
CREATE INDEX idx_avatares_user_id ON public.avatares(user_id);
CREATE INDEX idx_avatares_is_system ON public.avatares(is_system);
CREATE INDEX idx_avatares_is_public ON public.avatares(is_public);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_avatar_id ON public.conversations(avatar_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_conversation_activity_last_message ON public.conversation_activity(last_message_at);

-- 8. Triggers para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_avatares_updated_at 
    BEFORE UPDATE ON public.avatares 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_activity_updated_at 
    BEFORE UPDATE ON public.conversation_activity 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Trigger para atualizar atividade da conversa
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar última atividade da conversa
    UPDATE public.conversations 
    SET last_activity = NEW.created_at 
    WHERE id = NEW.conversation_id;
    
    -- Atualizar ou inserir atividade para notificações
    INSERT INTO public.conversation_activity (conversation_id, last_message_at, notification_sent)
    VALUES (NEW.conversation_id, NEW.created_at, false)
    ON CONFLICT (conversation_id)
    DO UPDATE SET 
        last_message_at = NEW.created_at,
        notification_sent = false,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_activity
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_activity();

-- 10. Políticas RLS - Limpas e organizadas
ALTER TABLE public.avatares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reengagement_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para avatares
CREATE POLICY "Users can manage their own avatares" ON public.avatares
    FOR ALL USING (
        auth.uid() = user_id OR 
        (is_system = true AND is_public = true)
    )
    WITH CHECK (auth.uid() = user_id);

-- Políticas para conversas
CREATE POLICY "Users can manage their own conversations" ON public.conversations
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para mensagens
CREATE POLICY "Users can manage messages in their conversations" ON public.messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id 
            AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = messages.conversation_id 
            AND c.user_id = auth.uid()
        )
    );

-- Políticas para atividade de conversa
CREATE POLICY "Users can view their conversation activity" ON public.conversation_activity
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_activity.conversation_id 
            AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_activity.conversation_id 
            AND c.user_id = auth.uid()
        )
    );

-- Políticas para templates (somente leitura para usuários autenticados)
CREATE POLICY "Authenticated users can read templates" ON public.reengagement_templates
    FOR SELECT USING (auth.role() = 'authenticated');

-- 11. Funções utilitárias
CREATE OR REPLACE FUNCTION public.get_user_avatares(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    nome TEXT,
    personalidade avatar_personality,
    tom avatar_tone,
    categoria avatar_category,
    avatar TEXT,
    avatar_type TEXT,
    background TEXT,
    interests TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT a.id, a.nome, a.personalidade, a.tom, a.categoria, 
           a.avatar, a.avatar_type, a.background, a.interests, a.created_at
    FROM public.avatares a
    WHERE a.user_id = user_uuid AND a.is_system = false
    ORDER BY a.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_system_avatares(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    nome TEXT,
    personalidade avatar_personality,
    tom avatar_tone,
    categoria avatar_category,
    avatar TEXT,
    profissao TEXT,
    caracteristicas TEXT,
    background TEXT,
    interests TEXT,
    inspiracao TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT a.id, a.nome, a.personalidade, a.tom, a.categoria,
           a.avatar, a.profissao, a.caracteristicas, a.background, 
           a.interests, a.inspiracao
    FROM public.avatares a
    WHERE a.is_system = true AND a.is_public = true
    ORDER BY a.created_at DESC
    LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.get_conversation_with_messages(conversation_uuid UUID)
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT json_build_object(
        'conversation', row_to_json(c),
        'avatar', row_to_json(a),
        'messages', COALESCE((
            SELECT json_agg(json_build_object(
                'id', m.id,
                'content', m.content,
                'is_user', m.is_user,
                'created_at', m.created_at
            ) ORDER BY m.created_at)
            FROM public.messages m
            WHERE m.conversation_id = conversation_uuid
        ), '[]'::json)
    )
    FROM public.conversations c
    JOIN public.avatares a ON c.avatar_id = a.id
    WHERE c.id = conversation_uuid
    AND c.user_id = auth.uid();
$$;

-- 12. Inserir alguns avatares do sistema como exemplo
INSERT INTO public.avatares (
    nome, personalidade, tom, categoria, avatar, is_system, is_public,
    profissao, caracteristicas, background, interests, inspiracao
) VALUES 
(
    'Dr. Ana Silva',
    'therapist',
    'empathetic',
    'health',
    '👩‍⚕️',
    true,
    true,
    'Psicóloga Clínica',
    'Especialista em terapia cognitivo-comportamental com mais de 15 anos de experiência',
    'Formada pela USP, com mestrado em Psicologia Clínica. Atua principalmente com ansiedade e depressão.',
    'Mindfulness, meditação, psicologia positiva, neurociências',
    'Carl Jung e Aaron Beck'
),
(
    'Prof. Carlos Eduardo',
    'mentor',
    'wise',
    'education',
    '👨‍🏫',
    true,
    true,
    'Professor de Filosofia',
    'Educador apaixonado por ensinar pensamento crítico e ética',
    'PhD em Filosofia pela UNICAMP, leciona há 20 anos e orienta projetos de pesquisa.',
    'Filosofia antiga, ética aplicada, pedagogia crítica, literatura clássica',
    'Sócrates e Paulo Freire'
),
(
    'Maria Tech',
    'consultant',
    'friendly',
    'technical',
    '👩‍💻',
    true,
    true,
    'Desenvolvedora Senior',
    'Especialista em tecnologias modernas e arquitetura de software',
    'Engenheira de Software com 10+ anos de experiência em startups e grandes empresas.',
    'React, TypeScript, arquitetura de microsserviços, DevOps, inteligência artificial',
    'Kent Beck e Martin Fowler'
);

-- 13. Inserir alguns templates de reengajamento
INSERT INTO public.reengagement_templates (personalidade, tom, categoria, message_template) VALUES
('friend', 'friendly', 'personal', 'Oi! Senti sua falta por aqui! Como você está? Que tal conversarmos um pouco?'),
('consultant', 'formal', 'business', 'Espero que esteja bem. Gostaria de retomar nossa conversa e ver como posso ajudá-lo com seus projetos.'),
('therapist', 'empathetic', 'health', 'Olá! Estou aqui se precisar conversar. Às vezes um bate-papo pode fazer toda a diferença.'),
('mentor', 'wise', 'education', 'Lembrei de você hoje. Como está caminhando seu desenvolvimento? Estou aqui para ajudar no que precisar.');
