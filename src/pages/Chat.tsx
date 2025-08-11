import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Send, 
  Plus, 
  User, 
  Bot, 
  Settings, 
  Sparkles,
  Store,
  ArrowLeft,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";

type AvatarPersonality = Database["public"]["Enums"]["avatar_personality"];
type AvatarTone = Database["public"]["Enums"]["avatar_tone"];
type AvatarCategory = Database["public"]["Enums"]["avatar_category"];

interface AvatarData {
  id: string;
  nome: string;
  personalidade: AvatarPersonality;
  tom: AvatarTone;
  categoria: AvatarCategory;
  avatar: string;
  avatar_type: string;
  background: string | null;
  interests: string | null;
  created_at: string;
}

interface Message {
  id: string;
  content: string;
  is_user: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  avatar_id: string;
  user_id: string;
  avatar?: AvatarData;
  messages?: Message[];
}

const Chat = () => {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Scroll to bottom when messages load or update
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedConversation?.messages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
    }
  };

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          avatar:avatares(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setSelectedConversation((prevConversation) => {
        if (prevConversation) {
          return { ...prevConversation, messages: data || [] };
        }
        return prevConversation;
      });
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    }
  };

  const handleNewConversation = async () => {
    navigate('/personalize');
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          content: newMessage,
          is_user: true
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update conversation's last activity
      await supabase
        .from('conversations')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      // Optimistically update the UI
      setSelectedConversation((prevConversation) => {
        if (prevConversation) {
          return {
            ...prevConversation,
            messages: [...(prevConversation.messages || []), data],
          };
        }
        return prevConversation;
      });

      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      toast.success('Conversa excluída com sucesso!');
      loadConversations();
      setSelectedConversation(null);
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      toast.error('Erro ao excluir conversa');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 container-safe">
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {selectedConversation ? (
                <>
                  <Button
                    onClick={() => setSelectedConversation(null)}
                    className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2 px-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Voltar</span>
                  </Button>
                  {selectedConversation.avatar && (
                    <>
                      <Avatar className="h-8 w-8">
                        {selectedConversation.avatar.avatar_type === 'image' ? (
                          <AvatarImage src={selectedConversation.avatar.avatar} alt={selectedConversation.avatar.nome} className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {selectedConversation.avatar.avatar}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h1 className="text-xl font-bold text-white">
                          {selectedConversation.avatar.nome}
                        </h1>
                        <p className="text-sm text-slate-300">
                          {selectedConversation.avatar.personalidade} • {selectedConversation.avatar.tom}
                        </p>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Chat com IA
                    </h1>
                    <p className="text-sm text-slate-300">Converse com seus avatares personalizados</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/avatar-store')}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 rounded-lg transition-all duration-200 flex items-center space-x-2 px-4"
              >
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Loja</span>
              </Button>
              <Button
                onClick={() => navigate('/personalize')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-lg transition-all duration-200 flex items-center space-x-2 px-4"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Avatares</span>
              </Button>
              <Button
                onClick={() => navigate('/settings')}
                className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2 px-4"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedConversation ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl h-[calc(100vh - 180px)]">
                <CardContent className="h-full flex flex-col">
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 p-4">
                    {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                      selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex flex-col ${message.is_user ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`rounded-xl px-4 py-2 max-w-[80%] ${message.is_user
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-100 text-slate-800'
                              }`}
                          >
                            {message.content}
                          </div>
                          <span className="text-xs text-slate-500 mt-1">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-500 py-12">
                        Nenhuma mensagem nesta conversa ainda.
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center space-x-3">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 rounded-xl"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !newMessage.trim()}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
                      >
                        {isSending ? (
                          <>Enviando...</>
                        ) : (
                          <>
                            Enviar
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Conversation Details */}
            <div className="lg:col-span-1">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Detalhes da Conversa</CardTitle>
                  <CardDescription>Informações sobre esta conversa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedConversation.avatar && (
                    <div className="flex flex-col items-center">
                      <Avatar className="h-20 w-20">
                        {selectedConversation.avatar.avatar_type === 'image' ? (
                          <AvatarImage src={selectedConversation.avatar.avatar} alt={selectedConversation.avatar.nome} className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-3xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {selectedConversation.avatar.avatar}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <h3 className="text-xl font-semibold mt-3">{selectedConversation.avatar.nome}</h3>
                      <p className="text-sm text-slate-500">
                        {selectedConversation.avatar.personalidade} • {selectedConversation.avatar.tom}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => handleDeleteConversation(selectedConversation.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Conversa
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-24">
                <h2 className="text-2xl text-slate-300">Carregando conversas...</h2>
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <CardHeader className="flex items-center space-x-4">
                    {conversation.avatar && (
                      <Avatar className="h-10 w-10">
                        {conversation.avatar.avatar_type === 'image' ? (
                          <AvatarImage src={conversation.avatar.avatar} alt={conversation.avatar.nome} className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {conversation.avatar.avatar}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    <div>
                      <CardTitle className="text-lg font-semibold">{conversation.avatar?.nome}</CardTitle>
                      <CardDescription className="text-sm text-slate-500">
                        {conversation.avatar?.personalidade} • {conversation.avatar?.tom}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">
                      {conversation.messages && conversation.messages.length > 0
                        ? conversation.messages[conversation.messages.length - 1].content
                        : 'Nenhuma mensagem ainda'}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-24">
                <h2 className="text-2xl text-slate-300">Nenhuma conversa encontrada</h2>
                <p className="text-slate-500 mt-4">Comece uma nova conversa criando um avatar personalizado.</p>
                <Button
                  onClick={handleNewConversation}
                  className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Avatar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
