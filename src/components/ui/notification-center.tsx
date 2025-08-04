import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, MessageCircle, RefreshCw } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    clearAll, 
    triggerNotificationCheck 
  } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-md mx-4 bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-800">Notificações</h3>
              {notifications.length > 0 && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {notifications.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={triggerNotificationCheck}
                disabled={isLoading}
                className="text-slate-600 hover:text-emerald-600"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-600 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Nenhuma notificação no momento
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Seus avatares enviarão mensagens quando sentirem sua falta!
              </p>
            </div>
          ) : (
            <div className="p-2">
              <div className="flex justify-between items-center px-2 py-1 mb-2">
                <span className="text-xs text-slate-500">
                  {notifications.length} notificação(ões)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-slate-500 hover:text-slate-700 h-auto p-1"
                >
                  Limpar todas
                </Button>
              </div>
              
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 mb-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg relative group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="font-medium text-emerald-800 text-sm">
                          {notification.avatar_nome}
                        </span>
                        <span className="text-xs text-emerald-600">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {notification.conteudo}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 h-auto p-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/50">
            <p className="text-xs text-slate-500 text-center">
              💡 Clique em uma notificação para ir para o chat
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotificationCenter;