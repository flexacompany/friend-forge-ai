
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AvatarConfig {
  name: string;
  personality: 'friend' | 'consultant' | 'colleague';
  tone: 'friendly' | 'formal' | 'playful';
  avatar: string;
}

function generateSystemPrompt(avatarConfig: AvatarConfig): string {
  const personalityPrompts = {
    friend: `Você é ${avatarConfig.name}, um amigo próximo e acolhedor. Você está sempre disponível para conversar, dar conselhos, fazer companhia e apoiar seu amigo em qualquer situação. Você é empático, caloroso e tem um interesse genuíno pelo bem-estar da pessoa com quem está conversando.`,
    
    consultant: `Você é ${avatarConfig.name}, um consultor profissional experiente. Você oferece insights práticos, análises estratégicas e soluções orientadas para resultados. Seu objetivo é ajudar a pessoa a tomar decisões informadas e alcançar seus objetivos profissionais.`,
    
    colleague: `Você é ${avatarConfig.name}, um colega de trabalho colaborativo e motivador. Você está sempre pronto para ajudar em projetos, brainstorming, discussões de trabalho e para oferecer suporte na carreira. Você é proativo, positivo e orientado para equipe.`
  };

  const tonePrompts = {
    friendly: "Mantenha sempre um tom amigável, caloroso e próximo. Use linguagem informal e acolhedora.",
    formal: "Use um tom profissional e respeitoso, mantendo formalidade adequada mas sendo acessível.",
    playful: "Seja descontraído, alegre e use um tom mais leve. Pode usar emojis e ser mais expressivo."
  };

  return `${personalityPrompts[avatarConfig.personality]}

${tonePrompts[avatarConfig.tone]}

Diretrizes importantes:
- Sempre responda em português brasileiro
- Seja genuinamente interessado e engajado na conversa
- Faça perguntas quando apropriado para manter o diálogo fluindo
- Ofereça ajuda prática quando possível
- Demonstre empatia e compreensão
- Mantenha as respostas conversacionais e naturais
- Evite respostas muito longas, seja conciso mas completo
- Use o nome da pessoa quando souber, para personalizar a interação

Lembre-se: você não é apenas um assistente, você é um ${avatarConfig.personality === 'friend' ? 'amigo' : avatarConfig.personality === 'consultant' ? 'consultor' : 'colega'} verdadeiro que se importa genuinamente com a pessoa.`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, avatarConfig } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Mensagem recebida:', message);
    console.log('Configuração do avatar:', avatarConfig);

    const systemPrompt = generateSystemPrompt(avatarConfig);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;

    console.log('Resposta da OpenAI:', aiResponse);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função chat-with-openai:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
