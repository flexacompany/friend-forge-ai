import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationData {
  id: string;
  avatar_id: string;
  avatar_nome: string;
  conteudo: string;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar novas mensagens de reengajamento (após inatividade de 24h)
  const checkForNewMessages = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('Usuário não autenticado:', authError);
        return;
      }

      // Buscar apenas mensagens de reengajamento dos últimos 5 minutos
      // Estas são mensagens que foram enviadas após o usuário ficar inativo por 24h
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Primeiro, buscar conversas que tiveram notificação enviada
      const { data: notifiedConversations, error: activityError } = await supabase
        .from('conversation_activity')
        .select('user_id, avatar_id')
        .eq('user_id', user.id)
        .eq('notification_sent', true);

      if (activityError) {
        console.error('Erro ao buscar atividades:', activityError);
        return;
      }

      if (!notifiedConversations || notifiedConversations.length === 0) {
        return;
      }

      // Buscar mensagens recentes dos avatares que enviaram notificações
      const avatarIds = notifiedConversations.map(conv => conv.avatar_id);
      
      const { data: recentMessages, error } = await supabase
        .from('mensagens')
        .select(`
          id,
          avatar_id,
          conteudo,
          created_at,
          avatares!inner(nome)
        `)
        .eq('user_id', user.id)
        .eq('is_user', false)
        .in('avatar_id', avatarIds)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao verificar novas mensagens:', error);
        return;
      }

      if (recentMessages && recentMessages.length > 0) {
        const formattedNotifications = recentMessages.map(msg => ({
          id: msg.id,
          avatar_id: msg.avatar_id,
          avatar_nome: (msg.avatares as { nome: string })?.nome || 'Avatar',
          conteudo: msg.conteudo,
          created_at: msg.created_at
        }));

        setNotifications(prev => {
          // Evitar duplicatas
          const existingIds = prev.map(n => n.id);
          const newNotifications = formattedNotifications.filter(n => !existingIds.includes(n.id));
          
          // Mostrar toast para novas notificações
          newNotifications.forEach(notification => {
            toast.success(`💬 ${notification.avatar_nome}`, {
              description: notification.conteudo.length > 100 
                ? notification.conteudo.substring(0, 100) + '...' 
                : notification.conteudo,
              duration: 5000,
            });
          });

          return [...newNotifications, ...prev].slice(0, 10); // Manter apenas as 10 mais recentes
        });
      }
    } catch (error) {
      console.error('Erro ao verificar notificações:', error);
    }
  };

  // Marcar notificação como lida
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Limpar todas as notificações
  const clearAll = () => {
    setNotifications([]);
  };

  // Marcar todas as notificações como visualizadas (zerar contador)
  const markAllAsViewed = () => {
    setNotifications([]);
  };

  // Executar verificação manual
  const triggerNotificationCheck = async () => {
    setIsLoading(true);
    try {
      // Chamar a Edge Function para processar notificações
      const { data, error } = await supabase.functions.invoke('notification-system');
      
      if (error) {
        console.error('Erro ao processar notificações:', error);
        toast.error('Erro ao verificar notificações');
        return;
      }

      if (data?.processed > 0) {
        toast.success(`${data.processed} nova(s) mensagem(ns) de seus avatares!`);
        // Aguardar um pouco e verificar novas mensagens
        setTimeout(checkForNewMessages, 2000);
      } else {
        toast.info('Nenhuma nova mensagem no momento');
      }
    } catch (error) {
      console.error('Erro ao executar verificação de notificações:', error);
      toast.error('Erro ao verificar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  // Configurar verificação automática a cada 5 minutos
  useEffect(() => {
    checkForNewMessages(); // Verificação inicial
    
    const interval = setInterval(checkForNewMessages, 5 * 60 * 1000); // A cada 5 minutos
    
    return () => clearInterval(interval);
  }, []);

  // Configurar listener para mudanças em tempo real
  useEffect(() => {
    const setupRealtimeListener = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('Usuário não autenticado para subscription:', authError);
          return;
        }

        // Escutar novas mensagens em tempo real
        const channel = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'mensagens',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              // Só processar se for uma mensagem de avatar E se for uma mensagem de reengajamento
              // Verificamos isso consultando se a notification foi marcada como enviada
              if (!payload.new.is_user) {
                // Aguardar um pouco e verificar se é uma mensagem de reengajamento
                setTimeout(async () => {
                  try {
                    const { data: activityData } = await supabase
                      .from('conversation_activity')
                      .select('notification_sent')
                      .eq('user_id', payload.new.user_id)
                      .eq('avatar_id', payload.new.avatar_id)
                      .single();
                    
                    // Só mostrar notificação se for uma mensagem de reengajamento
                    if (activityData?.notification_sent) {
                      checkForNewMessages();
                    }
                  } catch (error) {
                    console.log('Erro ao verificar se é mensagem de reengajamento:', error);
                  }
                }, 1000);
              }
            }
          )
          .subscribe();

        return channel;
      } catch (error) {
        console.error('Erro ao configurar subscription:', error);
      }
    };

    let channel: ReturnType<typeof supabase.channel> | undefined;
    setupRealtimeListener().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return {
    notifications,
    isLoading,
    checkForNewMessages,
    markAsRead,
    clearAll,
    markAllAsViewed,
    triggerNotificationCheck
  };
};