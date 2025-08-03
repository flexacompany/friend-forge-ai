
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  personalidade: 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist';
  tom: 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise';
  avatar: string;
  background?: string;
  interests?: string;
}

const AVATAR_OPTIONS = [
  '👥', '🤖', '👨‍💼', '👩‍💼', '🧑‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍💻',
  '👨‍⚕️', '👩‍⚕️', '🧑‍🔬', '👨‍🎨', '👩‍🎨', '🧑‍🚀', '👨‍🌾', '👩‍🌾',
  '🦄', '🐉', '🦊', '🐺', '🦝', '🐨', '🐼', '🦁', '🐯', '🐸', '🐙', '🦋'
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
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Sábio e orientador, foca no seu desenvolvimento pessoal'
  },
  {
    id: 'coach',
    name: 'Coach',
    description: 'Motivacional e focado em resultados, te ajuda a alcançar objetivos'
  },
  {
    id: 'therapist',
    name: 'Terapeuta',
    description: 'Compreensivo e empático, oferece suporte emocional'
  }
];

const TONE_OPTIONS = [
  { id: 'friendly', name: 'Amigável', description: 'Tom caloroso e próximo' },
  { id: 'formal', name: 'Formal', description: 'Tom profissional e respeitoso' },
  { id: 'playful', name: 'Divertido', description: 'Tom descontraído e alegre' },
  { id: 'empathetic', name: 'Empático', description: 'Tom compreensivo e acolhedor' },
  { id: 'witty', name: 'Espirituoso', description: 'Tom inteligente com humor sutil' },
  { id: 'wise', name: 'Sábio', description: 'Tom reflexivo e profundo' }
];

const Personalize = () => {
  const [avatares, setAvatares] = useState<AvatarData[]>([]);
  const [editingAvatar, setEditingAvatar] = useState<AvatarData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<{
    nome: string;
    personalidade: 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist';
    tom: 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise';
    avatar: string;
    background: string;
    interests: string;
  }>({
    nome: '',
    personalidade: 'friend' as 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist',
    tom: 'friendly' as 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise',
    avatar: '🤖',
    background: '',
    interests: ''
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
      
      const typedAvatares: AvatarData[] = (data || []).map(avatar => ({
        id: avatar.id,
        nome: avatar.nome,
        personalidade: avatar.personalidade as 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist',
        tom: avatar.tom as 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise',
        avatar: avatar.avatar,
        background: avatar.background || '',
        interests: avatar.interests || ''
      }));
      
      setAvatares(typedAvatares);
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
      personalidade: 'friend' as 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist',
      tom: 'friendly' as 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise',
      avatar: '🤖',
      background: '',
      interests: ''
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
            background: formData.background,
            interests: formData.interests,
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
            avatar: formData.avatar,
            background: formData.background,
            interests: formData.interests
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
      avatar: avatar.avatar,
      background: avatar.background || '',
      interests: avatar.interests || ''
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 mobile-safe-area">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-2 rounded-xl">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  IAmigo - Personalização
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Gerencie seus avatares</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/chat')}
                className="btn-outline text-xs sm:text-sm"
              >
                Chat
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 btn-outline text-xs sm:text-sm"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Lista de Avatares */}
          <div>
            <Card className="card-content animate-fade-in">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <h2 className="text-base sm:text-lg font-semibold text-foreground">Meus Avatares</h2>
                  </div>
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="btn-primary text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                  >
                    <span className="hidden sm:inline">Criar Novo</span>
                    <span className="sm:hidden">+</span>
                  </Button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {avatares.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Nenhum avatar criado ainda</p>
                      <Button
                        onClick={() => setIsCreating(true)}
                        variant="outline"
                        className="btn-outline"
                      >
                        Criar Primeiro Avatar
                      </Button>
                    </div>
                  ) : (
                    avatares.map((avatar) => (
                      <Card key={avatar.id} className="p-3 sm:p-4 border-l-4 border-l-primary card-content">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 avatar-option">
                              <AvatarFallback className="text-base sm:text-lg bg-card text-card-foreground">
                                {avatar.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base text-foreground">{avatar.nome}</h3>
                              <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {PERSONALITY_TYPES.find(p => p.id === avatar.personalidade)?.name}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {TONE_OPTIONS.find(t => t.id === avatar.tom)?.name}
                                </Badge>
                              </div>
                              {avatar.interests && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  Interesses: {avatar.interests}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-1 sm:space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAvatar(avatar)}
                              className="btn-outline p-1 sm:p-2"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAvatar(avatar.id)}
                              className="btn-outline p-1 sm:p-2"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Formulário de Criação/Edição */}
          {isCreating && (
            <div>
              <Card className="card-content animate-fade-in">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <h2 className="text-base sm:text-lg font-semibold text-foreground">
                      {editingAvatar ? 'Editar Avatar' : 'Criar Novo Avatar'}
                    </h2>
                  </div>

                  <div className="space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Nome do Avatar */}
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Nome do Avatar</label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Digite um nome para seu avatar..."
                        className="input-field"
                      />
                    </div>

                    {/* Personalidade */}
                    <div>
                      <label className="text-sm font-medium mb-3 block text-foreground">Tipo de Personalidade</label>
                      <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                        {PERSONALITY_TYPES.map((personality) => (
                          <div
                            key={personality.id}
                            className={`personality-card ${
                              formData.personalidade === personality.id ? 'selected' : ''
                            }`}
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              personalidade: personality.id as 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist'
                            }))}
                          >
                            <h3 className="font-medium text-foreground text-sm sm:text-base">{personality.name}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">{personality.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tom de Voz */}
                    <div>
                      <label className="text-sm font-medium mb-3 block text-foreground">Tom de Voz</label>
                      <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                        {TONE_OPTIONS.map((tone) => (
                          <div
                            key={tone.id}
                            className={`tone-option ${
                              formData.tom === tone.id ? 'selected' : ''
                            }`}
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              tom: tone.id as 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise'
                            }))}
                          >
                            <div className="font-medium text-sm sm:text-base">{tone.name}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">{tone.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Background/História */}
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">História/Background</label>
                      <Textarea
                        value={formData.background}
                        onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                        placeholder="Descreva a história, experiência ou contexto do seu avatar..."
                        className="input-field resize-none h-20"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Isso ajudará o avatar a ter um contexto mais rico nas conversas
                      </p>
                    </div>

                    {/* Interesses */}
                    <div>
                      <label className="text-sm font-medium mb-2 block text-foreground">Interesses e Especialidades</label>
                      <Input
                        value={formData.interests}
                        onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                        placeholder="Ex: tecnologia, música, esportes, negócios..."
                        className="input-field"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separe os interesses por vírgulas
                      </p>
                    </div>

                    {/* Avatar Visual */}
                    <div>
                      <label className="text-sm font-medium mb-3 block text-foreground">Avatar Visual</label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3 max-h-32 overflow-y-auto">
                        {AVATAR_OPTIONS.map((avatar) => (
                          <button
                            key={avatar}
                            className={`avatar-option text-lg sm:text-2xl ${
                              formData.avatar === avatar ? 'selected' : ''
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                          >
                            {avatar}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button
                        onClick={handleSaveAvatar}
                        disabled={isLoading}
                        className="flex-1 btn-primary"
                      >
                        {isLoading ? 'Salvando...' : (editingAvatar ? 'Atualizar Avatar' : 'Salvar Avatar')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetForm}
                        disabled={isLoading}
                        className="btn-outline"
                      >
                        Cancelar
                      </Button>
                    </div>
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
