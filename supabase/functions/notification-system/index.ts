import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InactiveConversation {
  user_id: string;
  avatar_id: string;
  avatar_nome: string;
  personalidade: string;
  tom: string;
  categoria: string;
  last_message_at: string;
}

interface ReengagementMessage {
  message_template: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔍 Verificando conversas inativas...');

    // Buscar conversas inativas (mais de 24 horas sem mensagem)
    const { data: inactiveConversations, error: fetchError } = await supabaseClient
      .rpc('get_inactive_conversations')

    if (fetchError) {
      console.error('❌ Erro ao buscar conversas inativas:', fetchError)
      throw fetchError
    }

    console.log(`📊 Encontradas ${inactiveConversations?.length || 0} conversas inativas`);

    if (!inactiveConversations || inactiveConversations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhuma conversa inativa encontrada',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    let processedCount = 0;
    const errors: string[] = [];

    // Processar cada conversa inativa
    for (const conversation of inactiveConversations as InactiveConversation[]) {
      try {
        console.log(`💬 Processando conversa: ${conversation.avatar_nome} (${conversation.avatar_id})`);

        // Buscar template de mensagem apropriado
        let { data: messageTemplates, error: templateError } = await supabaseClient
          .from('reengagement_messages')
          .select('message_template')
          .eq('personalidade', conversation.personalidade)
          .eq('tom', conversation.tom)
          .eq('categoria', conversation.categoria)
          .limit(1)

        // Se não encontrar template específico da categoria, buscar template geral
        if (!messageTemplates || messageTemplates.length === 0) {
          const { data: generalTemplates, error: generalError } = await supabaseClient
            .from('reengagement_messages')
            .select('message_template')
            .eq('personalidade', conversation.personalidade)
            .eq('tom', conversation.tom)
            .eq('categoria', 'geral')
            .limit(1)

          if (generalError) {
            console.error('❌ Erro ao buscar template geral:', generalError)
            throw generalError
          }

          messageTemplates = generalTemplates
        }

        if (templateError) {
          console.error('❌ Erro ao buscar template:', templateError)
          throw templateError
        }

        if (!messageTemplates || messageTemplates.length === 0) {
          // Template padrão como fallback
          messageTemplates = [{
            message_template: 'Oi! Senti sua falta por aqui! Como você está? 😊'
          }]
        }

        const messageTemplate = messageTemplates[0] as ReengagementMessage;
        const messageContent = messageTemplate.message_template;

        console.log(`📝 Enviando mensagem: "${messageContent.substring(0, 50)}..."`);

        // Inserir mensagem de reengajamento
        const { error: messageError } = await supabaseClient
          .from('mensagens')
          .insert({
            user_id: conversation.user_id,
            avatar_id: conversation.avatar_id,
            conteudo: messageContent,
            is_user: false
          })

        if (messageError) {
          console.error('❌ Erro ao inserir mensagem:', messageError)
          throw messageError
        }

        // Marcar notificação como enviada
        const { error: markError } = await supabaseClient
          .rpc('mark_notification_sent', {
            p_user_id: conversation.user_id,
            p_avatar_id: conversation.avatar_id
          })

        if (markError) {
          console.error('❌ Erro ao marcar notificação:', markError)
          throw markError
        }

        processedCount++;
        console.log(`✅ Mensagem enviada com sucesso para ${conversation.avatar_nome}`);

      } catch (error) {
        const errorMsg = `Erro ao processar conversa ${conversation.avatar_nome}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`🎉 Processamento concluído: ${processedCount} mensagens enviadas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processamento concluído com sucesso`,
        processed: processedCount,
        total: inactiveConversations.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})