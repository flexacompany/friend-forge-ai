
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Settings, Sparkles, User, Trash2, Edit, LogOut } from 'lucide-react';
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

const AVATAR_OPTIONS = [
  '👥', '🤖', '👨‍💼', '👩‍💼', '🧑‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍💻',
  '👨‍⚕️', '👩‍⚕️', '🧑‍🔬', '👨‍🎨', '👩‍🎨', '🧑‍🚀', '👨‍🌾', '👩‍🌾'
];

const PERSONALITY_TYPES = [
  {
    id: 'friend',
    name: 'Amigo',
    description: 'Casual e acolhedor, sempre pronto para uma conversa amigável'
  },
  {
    id: 'consultant',
    name: 'Consultor',
    description: 'Profissional e estratégico, oferece insights práticos'
  },
  {
    id: 'colleague',
    name: 'Colega de Trabalho',
    description: 'Colaborativo e motivador, ideal para projetos'
  }
];

const TONE_OPTIONS = [
  { id: 'friendly', name: 'Amigável', description: 'Tom caloroso e próximo' },
  { id: 'formal', name: 'Formal', description: 'Tom profissional e respeitoso' },
  { id: 'playful', name: 'Divertido', description: 'Tom descontraído e alegre' }
];

const Personalize = () => {
  const [avatares, setAvatares] = useState<AvatarData[]>([]);
  const [editingAvatar, setEditingAvatar] = useState<AvatarData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: '',
    personalidade: 'friend' as const,
    tom: 'friendly' as const,
    avatar: '🤖'
  });

  useEffect(() => {
    checkAuth();
    loadAvatares();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const loadAvatares = async () => {
    try {
      const { data, error } = await supabase
        .from('avatares')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvatares(data || []);
    } catch (error) {
      console.error('Erro ao carregar avatares:', error);
      toast.error('Erro ao carregar avatares');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      personalidade: 'friend',
      tom: 'friendly',
      avatar: '🤖'
    });
    setEditingAvatar(null);
    setIsCreating(false);
  };

  const handleSaveAvatar = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (editingAvatar) {
        const { error } = await supabase
          .from('avatares')
          .update({
            nome: formData.nome,
            personalidade: formData.personalidade,
            tom: formData.tom,
            avatar: formData.avatar,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAvatar.id);

        if (error) throw error;
        toast.success('Avatar atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('avatares')
          .insert({
            user_id: user.id,
            nome: formData.nome,
            personalidade: formData.personalidade,
            tom: formData.tom,
            avatar: formData.avatar
          });

        if (error) throw error;
        toast.success('Avatar criado com sucesso!');
      }

      resetForm();
      loadAvatares();
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
      toast.error('Erro ao salvar avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAvatar = (avatar: AvatarData) => {
    setFormData({
      nome: avatar.nome,
      personalidade: avatar.personalidade,
      tom: avatar.tom,
      avatar: avatar.avatar
    });
    setEditingAvatar(avatar);
    setIsCreating(true);
  };

  const handleDeleteAvatar = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este avatar? O histórico de conversas também será perdido.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('avatares')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Avatar excluído com sucesso!');
      loadAvatares();
    } catch (error) {
      console.error('Erro ao excluir avatar:', error);
      toast.error('Erro ao excluir avatar');
    }
  };

  const selectedPersonality = PERSONALITY_TYPES.find(p => p.id === formData.personalidade);

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
                  IAmigo - Personalização
                </h1>
                <p className="text-sm text-gray-600">Gerencie seus avatares</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/chat')}
              >
                Ir para Chat
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lista de Avatares */}
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">Meus Avatares</h2>
                </div>
                <Button
                  onClick={() => setIsCreating(true)}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  Criar Novo Avatar
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {avatares.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Nenhum avatar criado ainda</p>
                    <Button
                      onClick={() => setIsCreating(true)}
                      variant="outline"
                    >
                      Criar Primeiro Avatar
                    </Button>
                  </div>
                ) : (
                  avatares.map((avatar) => (
                    <Card key={avatar.id} className="p-4 border-l-4 border-l-blue-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="text-lg bg-white">
                              {avatar.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{avatar.nome}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {PERSONALITY_TYPES.find(p => p.id === avatar.personalidade)?.name}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {TONE_OPTIONS.find(t => t.id === avatar.tom)?.name}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAvatar(avatar)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAvatar(avatar.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Formulário de Criação/Edição */}
          {isCreating && (
            <div>
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-semibold">
                    {editingAvatar ? 'Editar Avatar' : 'Criar Novo Avatar'}
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* Nome do Avatar */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nome do Avatar</label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Digite um nome..."
                      className="w-full"
                    />
                  </div>

                  {/* Personalidade */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Tipo de Personalidade</label>
                    <div className="space-y-3">
                      {PERSONALITY_TYPES.map((personality) => (
                        <div
                          key={personality.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.personalidade === personality.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, personalidade: personality.id as any }))}
                        >
                          <h3 className="font-medium">{personality.name}</h3>
                          <p className="text-sm text-gray-600">{personality.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tom de Voz */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Tom de Voz</label>
                    <div className="grid grid-cols-1 gap-2">
                      {TONE_OPTIONS.map((tone) => (
                        <Button
                          key={tone.id}
                          variant={formData.tom === tone.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, tom: tone.id as any }))}
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
                          className={`p-3 border-2 rounded-lg text-2xl flex items-center justify-center transition-colors ${
                            formData.avatar === avatar 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex space-x-3">
                    <Button
                      onClick={handleSaveAvatar}
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                    >
                      {isLoading ? 'Salvando...' : (editingAvatar ? 'Atualizar Avatar' : 'Salvar Avatar')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Personalize;
