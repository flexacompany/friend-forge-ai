
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus, Settings, LogOut, MessageCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AvatarData {
  id?: string;
  nome: string;
  personalidade: 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist';
  tom: 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise';
  avatar: string;
  background: string;
  interests: string;
}

const PERSONALITY_TYPES = [
  { id: 'friend', name: 'Amigo', description: 'Casual e acolhedor, sempre pronto para uma conversa amigável.' },
  { id: 'consultant', name: 'Consultor', description: 'Profissional e estratégico, oferece insights práticos e soluções eficazes.' },
  { id: 'colleague', name: 'Colega de Trabalho', description: 'Colaborativo e motivador, ideal para discussões de projetos e trabalho em equipe.' },
  { id: 'mentor', name: 'Mentor', description: 'Sábio e orientador, focado no desenvolvimento pessoal e profissional.' },
  { id: 'coach', name: 'Coach', description: 'Motivacional focado em resultados, ajuda a alcançar objetivos e superar desafios.' },
  { id: 'therapist', name: 'Terapeuta', description: 'Compreensivo e empático, oferece suporte emocional e ajuda na reflexão.' }
];

const TONE_OPTIONS = [
  { id: 'friendly', name: 'Amigável', description: 'Caloroso e próximo, usando uma linguagem acessível e acolhedora.' },
  { id: 'formal', name: 'Formal', description: 'Profissional e respeitoso, mantendo um padrão formal mas não distante.' },
  { id: 'playful', name: 'Divertido', description: 'Descontraído e alegre, com um toque de humor apropriado.' },
  { id: 'empathetic', name: 'Empático', description: 'Compreensivo e acolhedor, demonstrando empatia e sensibilidade.' },
  { id: 'witty', name: 'Espirituoso', description: 'Inteligente com humor sutil, usando referências inteligentes quando apropriado.' },
  { id: 'wise', name: 'Sábio', description: 'Reflexivo e profundo, oferecendo perspectivas thoughtful e consideradas.' }
];

const AVATAR_OPTIONS = ['😀', '😎', '🤓', '🧐', '🤖', '👻', '👽', '😻', '🐶', '🦊', '🐻', '🐼', '🦁', '🐯', '🐴', '🦄', '🦋', '🐞', '🐢', '🌱', '🍄', '🌟', '🌈', '🍕', '🍔', '🍦', '⚽', '🏀', '🎮', '🎨', '📚', '🎵', '📸', '🚀', '💡', '🔑', '🎁', '🎈', '🎉'];

const Personalize = () => {
  const [avatares, setAvatares] = useState<AvatarData[]>([]);
  const [formData, setFormData] = useState<AvatarData>({
    nome: '',
    personalidade: 'friend',
    tom: 'friendly',
    avatar: '😀',
    background: '',
    interests: ''
  });
  const [editingAvatar, setEditingAvatar] = useState<AvatarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Usuário não autenticado');
        return;
      }

      if (editingAvatar) {
        // Atualizar avatar existente
        const { error } = await supabase
          .from('avatares')
          .update(formData)
          .eq('id', editingAvatar.id);

        if (error) throw error;
        toast.success('Avatar atualizado com sucesso!');
      } else {
        // Criar novo avatar - adicionar user_id do usuário logado
        const avatarToInsert = {
          ...formData,
          user_id: session.user.id
        };

        const { data, error } = await supabase
          .from('avatares')
          .insert([avatarToInsert])
          .select();

        if (error) throw error;
        toast.success('Avatar criado com sucesso!');
      }

      loadAvatares();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
      toast.error('Erro ao salvar avatar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAvatar = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este avatar?')) {
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
      toast.error('Erro ao excluir avatar. Tente novamente.');
    }
  };

  const editAvatar = (avatar: AvatarData) => {
    setEditingAvatar(avatar);
    setFormData({ ...avatar });
  };

  const cancelEdit = () => {
    setEditingAvatar(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      personalidade: 'friend',
      tom: 'friendly',
      avatar: '😀',
      background: '',
      interests: ''
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-2 rounded-xl">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  IAmigo - Avatares
                </h1>
                <p className="text-sm text-gray-600">Personalize seus companheiros inteligentes</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/chat')}
                className="flex items-center space-x-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat</span>
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
          {/* Formulário de Criação/Edição */}
          <Card className="order-2 lg:order-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {editingAvatar ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                <span>{editingAvatar ? 'Editar Avatar' : 'Criar Novo Avatar'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="nome">Nome do Avatar</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Ana, Carlos, Sofia..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Avatar Visual</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {AVATAR_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: option }))}
                      className={`p-3 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                        formData.avatar === option 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Personalidade</Label>
                <Select 
                  value={formData.personalidade} 
                  onValueChange={(value: 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist') => 
                    setFormData(prev => ({ ...prev, personalidade: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolha a personalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONALITY_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{type.name}</span>
                          <span className="text-sm text-gray-500">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tom de Voz</Label>
                <Select 
                  value={formData.tom} 
                  onValueChange={(value: 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise') => 
                    setFormData(prev => ({ ...prev, tom: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Escolha o tom de voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((tone) => (
                      <SelectItem key={tone.id} value={tone.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{tone.name}</span>
                          <span className="text-sm text-gray-500">{tone.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="background">História/Background</Label>
                <Textarea
                  id="background"
                  value={formData.background}
                  onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                  placeholder="Conte a história do seu avatar, sua formação, experiências..."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="interests">Interesses e Especialidades</Label>
                <Textarea
                  id="interests"
                  value={formData.interests}
                  onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                  placeholder="Quais são os interesses, hobbies ou especialidades do avatar?"
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading || !formData.nome.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  {isLoading ? 'Salvando...' : editingAvatar ? 'Atualizar' : 'Criar Avatar'}
                </Button>
                {editingAvatar && (
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Avatares */}
          <Card className="order-1 lg:order-2">
            <CardHeader>
              <CardTitle>Meus Avatares ({avatares.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {avatares.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-r from-blue-500 to-green-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Plus className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum avatar criado</h3>
                  <p className="text-gray-600">
                    Crie seu primeiro avatar para começar a conversar!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {avatares.map((avatar) => (
                    <div
                      key={avatar.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-all bg-white/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="text-3xl">{avatar.avatar}</div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{avatar.nome}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {PERSONALITY_TYPES.find(p => p.id === avatar.personalidade)?.name}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {TONE_OPTIONS.find(t => t.id === avatar.tom)?.name}
                              </Badge>
                            </div>
                            {avatar.background && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{avatar.background}</p>
                            )}
                            {avatar.interests && (
                              <p className="text-sm text-blue-600 mt-1">
                                <span className="font-medium">Interesses:</span> {avatar.interests}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editAvatar(avatar)}
                            className="p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAvatar(avatar.id!)}
                            className="p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Personalize;
