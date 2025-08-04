import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Settings, LogOut, Trash2, Bell } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useNotifications } from '@/hooks/use-notifications';
import NotificationCenter from '@/components/ui/notification-center';

interface AvatarData {
  id: string;
  nome: string;
  personalidade: 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist';
  tom: 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise';
  avatar: string;
  avatarType: 'emoji' | 'image';
  background: string | null;
  interests: string | null;
}

interface Message {
  id: string;
  conteudo: string;
  is_user: boolean;
  created_at: string;
}

const PERSONALITY_TYPES = [
  { id: 'friend', name: 'Amigo' },
  { id: 'consultant', name: 'Consultor' },
  { id: 'colleague', name: 'Colega de Trabalho' },
  { id: 'mentor', name: 'Mentor' },
  { id: 'coach', name: 'Coach' },
  { id: 'therapist', name: 'Terapeuta' }
];

const TONE_OPTIONS = [
  { id: 'friendly', name: 'Amigável' },
  { id: 'formal', name: 'Formal' },
  { id: 'playful', name: 'Divertido' },
  { id: 'empathetic', name: 'Empático' },
  { id: 'witty', name: 'Espirituoso' },
  { id: 'wise', name: 'Sábio' }
];

const Chat = () => {
  const [avatares, setAvatares] = useState<AvatarData[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications } = useNotifications();

  const renderAvatar = (avatar: AvatarData) => {
    if (avatar.avatarType === 'image') {
      return (
        <img 
          src={avatar.avatar} 
          alt={avatar.nome}
          className="w-6 h-6 rounded-full object-cover"
        />
      );
    }
    return <span className="text-lg">{avatar.avatar}</span>;
  };

  const renderAvatarInSelect = (avatar: AvatarData) => {
    if (avatar.avatarType === 'image') {
      return (
        <img 
          src={avatar.avatar} 
          alt={avatar.nome}
          className="w-5 h-5 rounded-full object-cover"
        />
      );
    }
    return <span>{avatar.avatar}</span>;
  };

  useEffect(() => {
    checkAuth();
    loadAvatares();
  }, []);

  useEffect(() => {
    if (selectedAvatarId) {
      const avatar = avatares.find(a => a.id === selectedAvatarId);
      setSelectedAvatar(avatar || null);
      loadMessages(selectedAvatarId);
    }
  }, [selectedAvatarId, avatares]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadAvatares = async () => {
    try {
      const { data, error } = await supabase
        .from('avatares')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedAvatares: AvatarData[] = (data || []).map(avatar => ({
        id: avatar.id,
        nome: avatar.nome,
        personalidade: avatar.personalidade as 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist',
        tom: avatar.tom as 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise',
        avatar: avatar.avatar,
        avatarType: avatar.avatar_type as 'emoji' | 'image' || 'emoji',
        background: avatar.background,
        interests: avatar.interests
      }));
      
      setAvatares(typedAvatares);
      
      if (typedAvatares && typedAvatares.length > 0) {
        setSelectedAvatarId(typedAvatares[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar avatares:', error);
      toast.error('Erro ao carregar avatares');
    }
  };

  const loadMessages = async (avatarId: string) => {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('avatar_id', avatarId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar histórico de conversa');
    }
  };

  const clearChat = async () => {
    if (!selectedAvatarId) return;
    
    if (!confirm('Tem certeza que deseja limpar todo o histórico desta conversa?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mensagens')
        .delete()
        .eq('avatar_id', selectedAvatarId);

      if (error) throw error;
      setMessages([]);
      toast.success('Histórico limpo com sucesso!');
    } catch (error) {
      console.error('Erro ao limpar chat:', error);
      toast.error('Erro ao limpar histórico');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedAvatar || !selectedAvatarId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsLoading(true);

    try {
      // Salvar mensagem do usuário
      const { error: userMessageError } = await supabase
        .from('mensagens')
        .insert({
          user_id: user.id,
          avatar_id: selectedAvatarId,
          conteudo: inputMessage,
          is_user: true
        });

      if (userMessageError) throw userMessageError;

      // Adicionar mensagem à interface imediatamente
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        conteudo: inputMessage,
        is_user: true,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMessage]);

      const currentMessage = inputMessage;
      setInputMessage('');

      // Chamar API da OpenAI com histórico da conversa
      const { data, error } = await supabase.functions.invoke('chat-with-openai', {
        body: {
          message: currentMessage,
          avatarConfig: {
            name: selectedAvatar.nome,
            personality: selectedAvatar.personalidade,
            tone: selectedAvatar.tom,
            avatar: selectedAvatar.avatar,
            background: selectedAvatar.background || '',
            interests: selectedAvatar.interests || ''
          },
          conversationHistory: messages // Enviar histórico atual da conversa
        }
      });

      if (error) throw error;

      // Salvar resposta do bot
      const { error: botMessageError } = await supabase
        .from('mensagens')
        .insert({
          user_id: user.id,
          avatar_id: selectedAvatarId,
          conteudo: data.response,
          is_user: false
        });

      if (botMessageError) throw botMessageError;

      // Recarregar mensagens para sincronizar com o banco
      loadMessages(selectedAvatarId);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectedPersonality = PERSONALITY_TYPES.find(p => p.id === selectedAvatar?.personalidade);
  const selectedTone = TONE_OPTIONS.find(t => t.id === selectedAvatar?.tom);

  if (avatares.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <MessageCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Nenhum avatar encontrado</h2>
          <p className="text-slate-600 text-base mb-6">
            Você precisa criar pelo menos um avatar para começar a conversar.
          </p>
          <Button
            onClick={() => navigate('/personalize')}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] h-12 px-6 text-base font-semibold"
          >
            Criar Avatar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  IAmigo - Chat
                </h1>
                <p className="text-sm text-slate-300">Converse com seu companheiro inteligente</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowNotifications(true)}
                className="relative bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Bell className="h-4 w-4" />
                <span>Notificações</span>
                {notifications.length > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center p-0"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              <Button
                onClick={() => navigate('/personalize')}
                className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Avatares</span>
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-2 md:px-4 sm:px-6 lg:px-8 py-2 md:py-8 h-[calc(100vh-1rem)] md:h-[calc(100vh-5rem)]">
        <Card className="h-full flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <NotificationCenter 
            isOpen={showNotifications} 
            onClose={() => setShowNotifications(false)} 
          />
          {/* Seleção de Avatar */}
          <div className="p-3 md:p-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-2 md:mb-4 space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <label className="text-xs md:text-sm font-semibold text-slate-700">Conversar com:</label>
                <Select value={selectedAvatarId} onValueChange={setSelectedAvatarId}>
                  <SelectTrigger className="w-full sm:w-64 border-2 border-slate-200 focus:border-emerald-500 rounded-lg bg-white min-h-[44px]">
                    <SelectValue placeholder="Selecione um avatar" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 shadow-lg">
                    {avatares.map((avatar) => (
                      <SelectItem 
                        key={avatar.id} 
                        value={avatar.id}
                        className="hover:bg-emerald-50 hover:text-slate-800 focus:bg-emerald-50 focus:text-slate-800 data-[highlighted]:bg-emerald-50 data-[highlighted]:text-slate-800 cursor-pointer text-slate-700"
                      >
                        <div className="flex items-center space-x-2">
                          {renderAvatarInSelect(avatar)}
                          <span>{avatar.nome} - {PERSONALITY_TYPES.find(p => p.id === avatar.personalidade)?.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={clearChat}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:border-slate-400 rounded-lg transition-all duration-200 flex items-center space-x-2 min-h-[44px] w-full sm:w-auto text-xs md:text-sm"
              >
                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Limpar Chat</span>
                <span className="sm:hidden">Limpar</span>
              </Button>
            </div>

            {selectedAvatar && (
              <div className="flex items-center space-x-2 md:space-x-3">
                <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                  {selectedAvatar.avatarType === 'image' ? (
                    <AvatarImage src={selectedAvatar.avatar} alt={selectedAvatar.nome} className="object-cover" />
                  ) : (
                    <AvatarFallback className="text-sm md:text-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                      {selectedAvatar.avatar}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm md:text-base truncate">{selectedAvatar.nome}</h3>
                  <div className="flex flex-wrap items-center gap-1 md:gap-2">
                    <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                      {selectedPersonality?.name}
                    </Badge>
                    <Badge className="text-xs bg-teal-100 text-teal-700 border-teal-200">
                      {selectedTone?.name}
                    </Badge>
                    {messages.length > 0 && (
                      <Badge className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                        {messages.length} msg
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-slate-50">
            {messages.length === 0 && selectedAvatar && (
              <div className="text-center py-6 md:py-12 px-4">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-3 md:p-4 rounded-full w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 flex items-center justify-center animate-pulse shadow-lg">
                  <MessageCircle className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h3 className="text-base md:text-lg font-semibold mb-2 text-slate-800">Olá! 👋</h3>
                <p className="text-sm md:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
                  Sou o <strong>{selectedAvatar.nome}</strong>, seu {selectedPersonality?.name.toLowerCase()}! 
                  {selectedAvatar.interests && (
                    <span> Meus interesses incluem: {selectedAvatar.interests}.</span>
                  )}
                  Como posso te ajudar hoje?
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_user ? 'justify-end' : 'justify-start'} px-1`}
              >
                <div className={`max-w-[85%] sm:max-w-sm lg:max-w-lg xl:max-w-xl p-3 md:p-4 rounded-xl shadow-md ${
                  message.is_user 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                    : 'bg-white border-2 border-slate-200'
                }`}>
                  {!message.is_user && selectedAvatar && (
                    <div className="flex items-center space-x-2 mb-2">
                      {renderAvatar(selectedAvatar)}
                      <span className="text-xs md:text-sm font-semibold text-slate-700 truncate">{selectedAvatar.nome}</span>
                    </div>
                  )}
                  <div className={`whitespace-pre-wrap text-sm md:text-base leading-relaxed ${
                    message.is_user ? 'text-white' : 'text-slate-800'
                  }`}>{message.conteudo}</div>
                  <div className={`text-xs mt-2 opacity-70 ${
                    message.is_user ? 'text-emerald-100' : 'text-slate-500'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && selectedAvatar && (
              <div className="flex justify-start px-1">
                <div className="max-w-[85%] sm:max-w-sm p-3 md:p-4 bg-white border-2 border-slate-200 shadow-md rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    {renderAvatar(selectedAvatar)}
                    <span className="text-xs md:text-sm font-semibold text-slate-700 truncate">{selectedAvatar.nome}</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Área de Input */}
          <div className="p-3 md:p-4 border-t border-slate-200 bg-white rounded-b-lg">
            <div className="flex space-x-2 md:space-x-3">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedAvatar ? `Digite sua mensagem para ${selectedAvatar.nome}...` : 'Selecione um avatar para conversar'}
                className="flex-1 resize-none min-h-[44px] md:min-h-[48px] max-h-32 border-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 text-sm md:text-base p-3"
                rows={1}
                disabled={!selectedAvatar}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || !selectedAvatar}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] h-11 md:h-12 px-3 md:px-4 flex-shrink-0"
              >
                <Send className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2 md:mt-3 text-center">
              <span className="hidden sm:inline">Pressione Enter para enviar, Shift+Enter para nova linha</span>
              <span className="sm:hidden">Enter para enviar</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
