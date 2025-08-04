
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Settings, Send, Heart, Briefcase, Users, Sparkles, Check } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface AvatarConfig {
  name: string;
  personality: 'friend' | 'consultant' | 'colleague';
  tone: 'friendly' | 'formal' | 'playful';
  avatar: string;
}

const AVATAR_OPTIONS = [
  '👥', '🤖', '👨‍💼', '👩‍💼', '🧑‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍💻',
  '👨‍⚕️', '👩‍⚕️', '🧑‍🔬', '👨‍🎨', '👩‍🎨', '🧑‍🚀', '👨‍🌾', '👩‍🌾'
];

const PERSONALITY_TYPES = [
  {
    id: 'friend',
    name: 'Amigo',
    description: 'Casual e acolhedor, sempre pronto para uma conversa amigável',
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50'
  },
  {
    id: 'consultant',
    name: 'Consultor',
    description: 'Profissional e estratégico, oferece insights práticos',
    icon: Briefcase,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'colleague',
    name: 'Colega de Trabalho',
    description: 'Colaborativo e motivador, ideal para projetos',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-50'
  }
];

const TONE_OPTIONS = [
  { id: 'friendly', name: 'Amigável', description: 'Tom caloroso e próximo' },
  { id: 'formal', name: 'Formal', description: 'Tom profissional e respeitoso' },
  { id: 'playful', name: 'Divertido', description: 'Tom descontraído e alegre' }
];

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({
    name: 'IAmigo',
    personality: 'friend',
    tone: 'friendly',
    avatar: '🤖'
  });

  useEffect(() => {
    // Carregar configuração salva
    const savedConfig = localStorage.getItem('iamigo-config');
    if (savedConfig) {
      setAvatarConfig(JSON.parse(savedConfig));
    }
    
    // Carregar mensagens salvas
    const savedMessages = localStorage.getItem('iamigo-messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    // Salvar configuração
    localStorage.setItem('iamigo-config', JSON.stringify(avatarConfig));
  }, [avatarConfig]);

  useEffect(() => {
    // Salvar mensagens
    localStorage.setItem('iamigo-messages', JSON.stringify(messages));
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-openai', {
        body: {
          message: inputMessage,
          avatarConfig: avatarConfig
        }
      });

      if (error) throw error;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('iamigo-messages');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectedPersonality = PERSONALITY_TYPES.find(p => p.id === avatarConfig.personality);

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
                  IAmigo
                </h1>
                <p className="text-sm text-gray-600">Seu companheiro inteligente</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
          
          {/* Painel de Configurações */}
          {showSettings && (
            <div className="lg:col-span-1">
              <Card className="p-6 h-full overflow-y-auto">
                <div className="flex items-center space-x-2 mb-6">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Personalize seu IAmigo</h2>
                </div>

                <div className="space-y-6">
                  {/* Nome do Avatar */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nome do Avatar</label>
                    <Input
                      value={avatarConfig.name}
                      onChange={(e) => setAvatarConfig(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Digite um nome..."
                      className="w-full"
                    />
                  </div>

                  {/* Personalidade */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Tipo de Personalidade</label>
                    <div className="space-y-3">
                      {PERSONALITY_TYPES.map((personality) => {
                        const Icon = personality.icon;
                        return (
                          <div
                            key={personality.id}
                            className={`personality-card ${avatarConfig.personality === personality.id ? 'selected' : ''} ${personality.bgColor}`}
                            onClick={() => setAvatarConfig(prev => ({ ...prev, personality: personality.id as any }))}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Icon className={`h-5 w-5 ${personality.color}`} />
                                <div>
                                  <h3 className="font-medium">{personality.name}</h3>
                                  <p className="text-sm text-gray-600">{personality.description}</p>
                                </div>
                              </div>
                              {avatarConfig.personality === personality.id && (
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tom de Voz */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Tom de Voz</label>
                    <div className="grid grid-cols-1 gap-2">
                      {TONE_OPTIONS.map((tone) => (
                        <Button
                          key={tone.id}
                          variant={avatarConfig.tone === tone.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAvatarConfig(prev => ({ ...prev, tone: tone.id as any }))}
                          className="justify-start text-left"
                        >
                          <div>
                            <div className="font-medium">{tone.name}</div>
                            <div className="text-xs opacity-75">{tone.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Avatar Visual */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Avatar Visual</label>
                    <div className="grid grid-cols-4 gap-3">
                      {AVATAR_OPTIONS.map((avatar) => (
                        <button
                          key={avatar}
                          className={`avatar-option ${avatarConfig.avatar === avatar ? 'selected' : ''} bg-white text-2xl flex items-center justify-center`}
                          onClick={() => setAvatarConfig(prev => ({ ...prev, avatar }))}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <Button
                    variant="outline"
                    onClick={clearChat}
                    className="w-full"
                    size="sm"
                  >
                    Limpar Conversa
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Área de Chat */}
          <div className={`${showSettings ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <Card className="h-full flex flex-col">
              {/* Header do Chat */}
              <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-green-50 rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-lg bg-white">
                      {avatarConfig.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{avatarConfig.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {selectedPersonality?.name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {TONE_OPTIONS.find(t => t.id === avatarConfig.tone)?.name}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Área de Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-r from-blue-500 to-green-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center animate-pulse-soft">
                      <MessageCircle className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Olá! 👋</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Sou o <strong>{avatarConfig.name}</strong>, seu {selectedPersonality?.name.toLowerCase()}! 
                      Como posso te ajudar hoje?
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-message-slide`}
                  >
                    <div className={`chat-bubble ${message.isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
                      {!message.isUser && (
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm">{avatarConfig.avatar}</span>
                          <span className="text-sm font-medium">{avatarConfig.name}</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-2 opacity-70 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start animate-message-slide">
                    <div className="chat-bubble chat-bubble-bot">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm">{avatarConfig.avatar}</span>
                        <span className="text-sm font-medium">{avatarConfig.name}</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Área de Input */}
              <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                <div className="flex space-x-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Digite sua mensagem para ${avatarConfig.name}...`}
                    className="flex-1 resize-none min-h-[44px] max-h-32"
                    rows={1}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
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
      </div>
    </div>
  );
};

export default Index;
