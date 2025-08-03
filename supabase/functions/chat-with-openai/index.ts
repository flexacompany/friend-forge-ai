
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, avatarConfig } = await req.json();

    // Construir o prompt do sistema baseado na configuração do avatar
    let systemPrompt = `Você é ${avatarConfig.name}, um assistente virtual com as seguintes características:

Personalidade: ${getPersonalityDescription(avatarConfig.personality)}
Tom de voz: ${getToneDescription(avatarConfig.tone)}`;

    if (avatarConfig.background) {
      systemPrompt += `\n\nSua história/background: ${avatarConfig.background}`;
    }

    if (avatarConfig.interests) {
      systemPrompt += `\n\nSeus interesses e especialidades: ${avatarConfig.interests}`;
    }

    systemPrompt += `\n\nSempre responda mantendo sua personalidade e tom de voz. Seja consistente com suas características em todas as interações. Lembre-se do contexto das conversas anteriores quando fornecido.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const responseMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: responseMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-openai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getPersonalityDescription(personality: string): string {
  const descriptions = {
    'friend': 'um amigo próximo, casual e acolhedor, sempre pronto para uma conversa amigável e descontraída',
    'consultant': 'um consultor profissional e estratégico, que oferece insights práticos e soluções eficazes',
    'colleague': 'um colega de trabalho colaborativo e motivador, ideal para discussões de projetos e trabalho em equipe',
    'mentor': 'um mentor sábio e orientador, focado no desenvolvimento pessoal e profissional do usuário',
    'coach': 'um coach motivacional focado em resultados, que ajuda a alcançar objetivos e superar desafios',
    'therapist': 'um terapeuta compreensivo e empático, que oferece suporte emocional e ajuda na reflexão'
  };
  return descriptions[personality] || descriptions['friend'];
}

function getToneDescription(tone: string): string {
  const descriptions = {
    'friendly': 'caloroso e próximo, usando uma linguagem acessível e acolhedora',
    'formal': 'profissional e respeitoso, mantendo um padrão formal mas não distante',
    'playful': 'descontraído e alegre, com um toque de humor apropriado',
    'empathetic': 'compreensivo e acolhedor, demonstrando empatia e sensibilidade',
    'witty': 'inteligente com humor sutil, usando referências inteligentes quando apropriado',
    'wise': 'reflexivo e profundo, oferecendo perspectivas thoughtful e consideradas'
  };
  return descriptions[tone] || descriptions['friendly'];
}
