import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  MessageCircle, 
  Settings,
  User,
  Heart,
  Briefcase,
  Users,
  BookOpen,
  Target,
  Brain,
  Wand2,
  ArrowLeft,
  Camera
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

interface SystemAvatarData {
  id: string;
  nome: string;
  personalidade: AvatarPersonality;
  tom: AvatarTone;
  categoria: AvatarCategory;
  avatar: string;
  profissao: string | null;
  caracteristicas: string | null;
  background: string | null;
  interests: string | null;
  inspiracao: string | null;
}

interface FormData {
  nome: string;
  personalidade: AvatarPersonality | '';
  tom: AvatarTone | '';
  avatar: string;
  avatarType: 'emoji' | 'image';
  background: string;
  interests: string;
}

const PERSONALITY_TYPES = [
  { id: 'friend', name: 'Amigo', icon: Heart, description: 'Casual, próximo e sempre disponível para uma conversa' },
  { id: 'consultant', name: 'Consultor', icon: Briefcase, description: 'Profissional e estratégico, oferece insights práticos' },
  { id: 'colleague', name: 'Colega de Trabalho', icon: Users, description: 'Colaborativo e motivador para projetos' },
  { id: 'mentor', name: 'Mentor', icon: BookOpen, description: 'Sábio e orientador para desenvolvimento pessoal' },
  { id: 'coach', name: 'Coach', icon: Target, description: 'Focado em resultados e superação de desafios' },
  { id: 'therapist', name: 'Terapeuta', icon: Brain, description: 'Empático e compreensivo, oferece suporte emocional' }
] as const;

const TONE_OPTIONS = [
  { id: 'friendly', name: 'Amigável', description: 'Caloroso e próximo' },
  { id: 'formal', name: 'Formal', description: 'Profissional e respeitoso' },
  { id: 'playful', name: 'Divertido', description: 'Descontraído e alegre' },
  { id: 'empathetic', name: 'Empático', description: 'Compreensivo e acolhedor' },
  { id: 'witty', name: 'Espirituoso', description: 'Inteligente com humor sutil' },
  { id: 'wise', name: 'Sábio', description: 'Reflexivo e profundo' }
] as const;

const DEFAULT_EMOJIS = ['🤖', '👨‍💼', '👩‍💼', '🧑‍🏫', '👨‍🔬', '👩‍🔬', '🧑‍💻', '👨‍⚕️', '👩‍⚕️', '🧑‍🎨'];

const Personalize = () => {
  const [avatares, setAvatares] = useState<AvatarData[]>([]);
  const [systemAvatars, setSystemAvatars] = useState<SystemAvatarData[]>([]);
  const [editingAvatar, setEditingAvatar] = useState<AvatarData | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    personalidade: '',
    tom: '',
    avatar: '🤖',
    avatarType: 'emoji',
    background: '',
    interests: ''
  });

  useEffect(() => {
    checkAuth();
    loadAvatares();
    loadSystemAvatars();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const loadAvatares = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_avatares');

      if (error) throw error;
      
      setAvatares(data || []);
    } catch (error) {
      console.error('Erro ao carregar avatares:', error);
      toast.error('Erro ao carregar avatares');
    }
  };

  const loadSystemAvatars = async () => {
    try {
      const { data, error } = await supabase.rpc('get_system_avatares', { limit_count: 6 });
      
      if (error) {
        console.error('Erro ao carregar avatares do sistema:', error);
        return;
      }

      setSystemAvatars(data || []);
    } catch (error) {
      console.error('Erro ao carregar avatares do sistema:', error);
    }
  };

  const uploadImageToSupabase = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Obter URL pública da imagem
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      const imageUrl = await uploadImageToSupabase(file);
      
      setFormData(prev => ({
        ...prev,
        avatar: imageUrl,
        avatarType: 'image'
      }));
      
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.personalidade || !formData.tom) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Validação de tipos
    const personalidade = formData.personalidade as AvatarPersonality;
    const tom = formData.tom as AvatarTone;

    const validPersonalities: AvatarPersonality[] = ['friend', 'consultant', 'colleague', 'mentor', 'coach', 'therapist'];
    const validTones: AvatarTone[] = ['friendly', 'formal', 'playful', 'empathetic', 'witty', 'wise'];

    if (!validPersonalities.includes(personalidade) || !validTones.includes(tom)) {
      toast.error('Valores de personalidade ou tom inválidos');
      return;
    }

    setIsLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      setIsLoading(false);
      return;
    }

    try {
      if (editingAvatar) {
        // Atualizar avatar existente
        const { error } = await supabase
          .from('avatares')
          .update({
            nome: formData.nome,
            personalidade: personalidade,
            tom: tom,
            avatar: formData.avatar,
            avatar_type: formData.avatarType,
            background: formData.background || null,
            interests: formData.interests || null
          })
          .eq('id', editingAvatar.id);

        if (error) throw error;
        toast.success('Avatar atualizado com sucesso!');
      } else {
        // Criar novo avatar
        const { error } = await supabase
          .from('avatares')
          .insert({
            user_id: user.id,
            nome: formData.nome,
            personalidade: personalidade,
            tom: tom,
            avatar: formData.avatar,
            avatar_type: formData.avatarType,
            background: formData.background || null,
            interests: formData.interests || null
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

  const handleSystemAvatarSelect = async (systemAvatar: SystemAvatarData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const { error } = await supabase
        .from('avatares')
        .insert({
          user_id: user.id,
          nome: systemAvatar.nome,
          personalidade: systemAvatar.personalidade,
          tom: systemAvatar.tom,
          avatar: systemAvatar.avatar,
          avatar_type: 'emoji',
          background: systemAvatar.background,
          interests: systemAvatar.interests
        });

      if (error) throw error;
      
      toast.success(`Avatar "${systemAvatar.nome}" adicionado aos seus avatares!`);
      loadAvatares();
    } catch (error) {
      console.error('Erro ao adicionar avatar do sistema:', error);
      toast.error('Erro ao adicionar avatar');
    }
  };

  const handleEdit = (avatar: AvatarData) => {
    setEditingAvatar(avatar);
    setFormData({
      nome: avatar.nome,
      personalidade: avatar.personalidade,
      tom: avatar.tom,
      avatar: avatar.avatar,
      avatarType: avatar.avatar_type as 'emoji' | 'image',
      background: avatar.background || '',
      interests: avatar.interests || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (avatarId: string) => {
    if (!confirm('Tem certeza que deseja excluir este avatar?')) return;

    try {
      const { error } = await supabase
        .from('avatares')
        .delete()
        .eq('id', avatarId);

      if (error) throw error;
      toast.success('Avatar excluído com sucesso!');
      loadAvatares();
    } catch (error) {
      console.error('Erro ao excluir avatar:', error);
      toast.error('Erro ao excluir avatar');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      personalidade: '',
      tom: '',
      avatar: '🤖',
      avatarType: 'emoji',
      background: '',
      interests: ''
    });
    setEditingAvatar(null);
    setShowCreateForm(false);
  };

  const handlePersonalityChange = (personalityId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      personalidade: personalityId as AvatarPersonality
    }));
  };

  const handleToneChange = (toneId: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tom: toneId as AvatarTone
    }));
  };

  const renderAvatar = (avatar: AvatarData | SystemAvatarData) => {
    const avatarType = 'avatar_type' in avatar ? avatar.avatar_type : 'emoji';
    
    return (
      <Avatar className="h-12 w-12 flex-shrink-0">
        {avatarType === 'image' ? (
          <AvatarImage src={avatar.avatar} alt={avatar.nome} className="object-cover" />
        ) : (
          <AvatarFallback className="text-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            {avatar.avatar}
          </AvatarFallback>
        )}
      </Avatar>
    );
  };

  const selectedPersonality = PERSONALITY_TYPES.find(p => p.id === formData.personalidade);
  const selectedTone = TONE_OPTIONS.find(t => t.id === formData.tom);

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 container-safe">
        {/* Header */}
        <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Button
                  onClick={resetForm}
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2 px-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg">
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {editingAvatar ? 'Editar Avatar' : 'Criar Novo Avatar'}
                  </h1>
                  <p className="text-sm text-slate-300">Configure a personalidade e características</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 shadow-lg">
                    {formData.avatarType === 'image' ? (
                      <AvatarImage src={formData.avatar} alt="Avatar Preview" className="object-cover" />
                    ) : (
                      <AvatarFallback className="text-4xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                        {formData.avatar}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              <CardTitle className="text-3xl font-bold text-slate-800 mb-2">
                {formData.nome || 'Novo Avatar'}
              </CardTitle>
              {formData.personalidade && formData.tom && (
                <CardDescription className="text-lg text-slate-600">
                  {selectedPersonality?.name} • {selectedTone?.name}
                </CardDescription>
              )}
              {isUploadingImage && (
                <p className="text-sm text-emerald-600">Enviando imagem...</p>
              )}
            </CardHeader>

            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-lg font-semibold text-slate-700">
                    Nome do Avatar *
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Alex, Maria, Dr. Silva..."
                    className="text-lg p-4 border-2 border-slate-200 focus:border-emerald-500 rounded-xl"
                    required
                  />
                </div>

                {/* Avatar Selection */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-slate-700">Escolha um Emoji</Label>
                  <div className="grid grid-cols-5 gap-3">
                    {DEFAULT_EMOJIS.map((emoji) => (
                      <Button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar: emoji, avatarType: 'emoji' }))}
                        className={`h-16 w-16 text-2xl rounded-xl transition-all duration-200 ${
                          formData.avatar === emoji && formData.avatarType === 'emoji'
                            ? 'bg-emerald-500 text-white shadow-lg scale-105' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Personalidade */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-slate-700">Personalidade *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PERSONALITY_TYPES.map((personality) => {
                      const Icon = personality.icon;
                      const isSelected = formData.personalidade === personality.id;
                      
                      return (
                        <Card 
                          key={personality.id}
                          className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                            isSelected 
                              ? 'border-2 border-emerald-500 bg-emerald-50 shadow-lg' 
                              : 'border-2 border-slate-200 hover:border-emerald-300'
                          }`}
                          onClick={() => handlePersonalityChange(personality.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                                <Icon className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                              </div>
                              <div className="flex-1">
                                <h3 className={`font-semibold mb-1 ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                                  {personality.name}
                                </h3>
                                <p className={`text-sm ${isSelected ? 'text-emerald-600' : 'text-slate-600'}`}>
                                  {personality.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Tom */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-slate-700">Tom de Voz *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {TONE_OPTIONS.map((tone) => (
                      <Card
                        key={tone.id}
                        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          formData.tom === tone.id
                            ? 'border-2 border-teal-500 bg-teal-50 shadow-lg'
                            : 'border-2 border-slate-200 hover:border-teal-300'
                        }`}
                        onClick={() => handleToneChange(tone.id)}
                      >
                        <CardContent className="p-4">
                          <h3 className={`font-semibold mb-1 ${formData.tom === tone.id ? 'text-teal-800' : 'text-slate-800'}`}>
                            {tone.name}
                          </h3>
                          <p className={`text-sm ${formData.tom === tone.id ? 'text-teal-600' : 'text-slate-600'}`}>
                            {tone.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Background */}
                <div className="space-y-2">
                  <Label htmlFor="background" className="text-lg font-semibold text-slate-700">
                    História/Background
                  </Label>
                  <Textarea
                    id="background"
                    value={formData.background}
                    onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                    placeholder="Conte um pouco sobre a história e contexto deste avatar..."
                    className="min-h-[100px] border-2 border-slate-200 focus:border-emerald-500 rounded-xl p-4"
                    rows={4}
                  />
                </div>

                {/* Interests */}
                <div className="space-y-2">
                  <Label htmlFor="interests" className="text-lg font-semibold text-slate-700">
                    Interesses e Especialidades
                  </Label>
                  <Textarea
                    id="interests"
                    value={formData.interests}
                    onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                    placeholder="Liste os principais interesses, hobbies e áreas de especialidade..."
                    className="min-h-[100px] border-2 border-slate-200 focus:border-emerald-500 rounded-xl p-4"
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-300 hover:border-slate-400 rounded-xl h-12 text-lg font-semibold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || isUploadingImage || !formData.nome || !formData.personalidade || !formData.tom}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] h-12 text-lg font-semibold"
                  >
                    {isLoading ? 'Salvando...' : editingAvatar ? 'Salvar Alterações' : 'Criar Avatar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 container-safe">
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Seus Avatares
                </h1>
                <p className="text-sm text-slate-300">Personalize seus companheiros de IA</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/chat')}
                className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2 px-4"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
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
        {/* System Avatars Section */}
        {systemAvatars.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Avatares Disponíveis</h2>
                <p className="text-slate-300">Escolha entre nossos avatares pré-configurados</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {systemAvatars.map((avatar) => (
                <Card key={avatar.id} className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      {renderAvatar(avatar)}
                      <div className="flex-1">
                        <CardTitle className="text-xl text-slate-800">{avatar.nome}</CardTitle>
                        <CardDescription className="text-sm font-medium text-slate-600">
                          {avatar.profissao}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          {avatar.categoria}
                        </Badge>
                        <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                          {avatar.personalidade}
                        </Badge>
                      </div>
                      
                      {avatar.caracteristicas && (
                        <p className="text-sm text-slate-600 line-clamp-3">
                          {avatar.caracteristicas}
                        </p>
                      )}
                      
                      <Button
                        onClick={() => handleSystemAvatarSelect(avatar)}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar aos Meus Avatares
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Personal Avatars Section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Meus Avatares</h2>
            <p className="text-slate-300">Gerencie seus avatares personalizados</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] px-6 py-3"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Avatar
          </Button>
        </div>

        {avatares.length === 0 ? (
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-full mb-6">
                <User className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Nenhum avatar criado ainda</h3>
              <p className="text-slate-600 text-center mb-8 max-w-md">
                Crie seu primeiro avatar personalizado para começar conversas incríveis com IA!
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] px-8 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Meu Primeiro Avatar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avatares.map((avatar) => {
              const personality = PERSONALITY_TYPES.find(p => p.id === avatar.personalidade);
              const tone = TONE_OPTIONS.find(t => t.id === avatar.tom);
              
              return (
                <Card key={avatar.id} className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {renderAvatar(avatar)}
                        <div>
                          <CardTitle className="text-xl text-slate-800">{avatar.nome}</CardTitle>
                          <CardDescription className="text-sm font-medium">
                            {personality?.name} • {tone?.name}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          {personality?.name}
                        </Badge>
                        <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                          {tone?.name}
                        </Badge>
                      </div>
                      
                      {avatar.background && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {avatar.background}
                        </p>
                      )}
                      
                      {avatar.interests && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          <strong>Interesses:</strong> {avatar.interests}
                        </p>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEdit(avatar)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-200 hover:border-slate-300 rounded-lg transition-all duration-200"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleDelete(avatar.id)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-200 hover:border-red-300 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Personalize;
