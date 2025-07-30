
import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, Settings, LogOut, Trash2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AvatarData {
  id: string;
  nome: string;
  personalidade: 'friend' | 'consultant' | 'colleague';
  tom: 'friendly' | 'formal' | 'playful';
  avatar: string;
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
  { id: 'colleague', name: 'Colega de Trabalho' }
];

const TONE_OPTIONS = [
  { id: 'friendly', name: 'Amigável' },
  { id: 'formal', name: 'Formal' },
  { id: 'playful', name: 'Divertido' }
];

const Chat = () => {
  const [avatares, setAvatares] = useState<AvatarData[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
      setAvatares(data || []);
      
      if (data && data.length > 0) {
        setSelectedAvatarId(data[0].id);
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

      // Chamar API da OpenAI
      const { data, error } = await supabase.functions.invoke('chat-with-openai', {
        body: {
          message: currentMessage,
          avatarConfig: {
            name: selectedAvatar.nome,
            personality: selectedAvatar.personalidade,
            tone: selectedAvatar.tom,
            avatar: selectedAvatar.avatar
          }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <MessageCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum avatar encontrado</h2>
          <p className="text-gray-600 mb-4">
            Você precisa criar pelo menos um avatar para começar a conversar.
          </p>
          <Button
            onClick={() => navigate('/personalize')}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
          >
            Criar Avatar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-2 rounded-xl">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  IAmigo - Chat
                </h1>
                <p className="text-sm text-gray-600">Converse com seu companheiro inteligente</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/personalize')}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Avatares</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-5rem)]">
        <Card className="h-full flex flex-col">
          {/* Seleção de Avatar */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50 rounded-t-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium">Conversar com:</label>
                <Select value={selectedAvatarId} onValueChange={setSelectedAvatarId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione um avatar" />
                  </SelectTrigger>
                  <SelectContent>
                    {avatares.map((avatar) => (
                      <SelectItem key={avatar.id} value={avatar.id}>
                        <div className="flex items-center space-x-2">
                          <span>{avatar.avatar}</span>
                          <span>{avatar.nome} - {PERSONALITY_TYPES.find(p => p.id === avatar.personalidade)?.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Limpar Chat</span>
              </Button>
            </div>

            {selectedAvatar && (
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-lg bg-white">
                    {selectedAvatar.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedAvatar.nome}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedPersonality?.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedTone?.name}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && selectedAvatar && (
              <div className="text-center py-12">
                <div className="bg-gradient-to-r from-blue-500 to-green-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center animate-pulse">
                  <MessageCircle className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Olá! 👋</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Sou o <strong>{selectedAvatar.nome}</strong>, seu {selectedPersonality?.name.toLowerCase()}! 
                  Como posso te ajudar hoje?
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-sm lg:max-w-lg xl:max-w-xl p-3 rounded-lg ${
                  message.is_user 
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white' 
                    : 'bg-white border shadow-sm'
                }`}>
                  {!message.is_user && selectedAvatar && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm">{selectedAvatar.avatar}</span>
                      <span className="text-sm font-medium">{selectedAvatar.nome}</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.conteudo}</div>
                  <div className={`text-xs mt-2 opacity-70 ${
                    message.is_user ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && selectedAvatar && (
              <div className="flex justify-start">
                <div className="max-w-sm p-3 bg-white border shadow-sm rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm">{selectedAvatar.avatar}</span>
                    <span className="text-sm font-medium">{selectedAvatar.nome}</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Área de Input */}
          <div className="p-4 border-t bg-gray-50 rounded-b-lg">
            <div className="flex space-x-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedAvatar ? `Digite sua mensagem para ${selectedAvatar.nome}...` : 'Selecione um avatar para conversar'}
                className="flex-1 resize-none min-h-[44px] max-h-32"
                rows={1}
                disabled={!selectedAvatar}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || !selectedAvatar}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Pressione Enter para enviar, Shift+Enter para nova linha
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
