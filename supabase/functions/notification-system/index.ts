
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

interface ReengagementTemplate {
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
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: inactiveConversations, error: fetchError } = await supabaseClient
      .from('conversation_activity')
      .select(`
        conversation_id,
        last_message_at,
        conversations!inner(
          user_id,
          avatar_id,
          avatares!inner(nome, personalidade, tom, categoria)
        )
      `)
      .lt('last_message_at', twentyFourHoursAgo)
      .eq('notification_sent', false);

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
    for (const activity of inactiveConversations as any[]) {
      try {
        const conversation = activity.conversations;
        const avatar = conversation.avatares;
        
        console.log(`💬 Processando conversa: ${avatar.nome} (${conversation.avatar_id})`);

        // Buscar template de mensagem apropriado
        let { data: messageTemplates, error: templateError } = await supabaseClient
          .from('reengagement_templates')
          .select('message_template')
          .eq('personalidade', avatar.personalidade)
          .eq('tom', avatar.tom)
          .eq('categoria', avatar.categoria)
          .limit(1);
        
        // Se não encontrar template específico da categoria, buscar template geral
        if (!messageTemplates || messageTemplates.length === 0) {
          const { data: generalTemplates, error: generalError } = await supabaseClient
            .from('reengagement_templates')
            .select('message_template')
            .eq('personalidade', avatar.personalidade)
            .eq('tom', avatar.tom)
            .is('categoria', null)
            .limit(1);

          if (generalError) {
            console.error('❌ Erro ao buscar template geral:', generalError);
            throw generalError;
          }

          messageTemplates = generalTemplates;
        }

        if (templateError) {
          console.error('❌ Erro ao buscar template:', templateError);
          throw templateError;
        }

        if (!messageTemplates || messageTemplates.length === 0) {
          // Template padrão como fallback
          messageTemplates = [{
            message_template: 'Oi! Senti sua falta por aqui! Como você está? 😊'
          }];
        }

        const messageTemplate = messageTemplates[0] as ReengagementTemplate;
        const messageContent = messageTemplate.message_template;

        console.log(`📝 Enviando mensagem: "${messageContent.substring(0, 50)}..."`);

        // Inserir mensagem de reengajamento
        const { error: messageError } = await supabaseClient
          .from('messages')
          .insert({
            conversation_id: activity.conversation_id,
            content: messageContent,
            is_user: false
          });

        if (messageError) {
          console.error('❌ Erro ao inserir mensagem:', messageError);
          throw messageError;
        }

        // Marcar notificação como enviada
        const { error: markError } = await supabaseClient
          .from('conversation_activity')
          .update({ notification_sent: true })
          .eq('conversation_id', activity.conversation_id);

        if (markError) {
          console.error('❌ Erro ao marcar notificação:', markError);
          throw markError;
        }

        processedCount++;
        console.log(`✅ Mensagem enviada com sucesso para ${avatar.nome}`);

      } catch (error) {
        const errorMsg = `Erro ao processar conversa: ${error.message}`;
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
