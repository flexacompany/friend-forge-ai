import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Palette, 
  MessageSquare, 
  Sparkles, 
  ArrowLeft, 
  Save, 
  Upload,
  Store,
  Plus,
  Edit
} from 'lucide-react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams } from "react-router-dom";

type AvatarPersonality = 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist';
type AvatarTone = 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise';
type AvatarCategory = 'personal' | 'professional' | 'educational' | 'entertainment';
type AvatarType = 'emoji' | 'image';

interface FormData {
  nome: string;
  personalidade: AvatarPersonality;
  tom: AvatarTone;
  avatar: string;
  avatarType: AvatarType;
  background: string;
  interests: string;
  publishToStore: boolean;
  storeTitle: string;
  storeDescription: string;
}

const Personalize = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<FormData>({
    nome: '',
    personalidade: 'friend',
    tom: 'friendly',
    avatar: '🤖',
    avatarType: 'emoji',
    background: '',
    interests: '',
    publishToStore: false,
    storeTitle: '',
    storeDescription: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (isEditing && id) {
      loadAvatarData(id);
    }
  }, [id, isEditing]);

  const loadAvatarData = async (avatarId: string) => {
    try {
      const { data, error } = await supabase
        .from('avatares')
        .select('*')
        .eq('id', avatarId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          nome: data.nome,
          personalidade: data.personalidade,
          tom: data.tom,
          avatar: data.avatar,
          avatarType: data.avatar_type as AvatarType,
          background: data.background || '',
          interests: data.interests || '',
          publishToStore: false,
          storeTitle: '',
          storeDescription: ''
        });

        if (data.avatar_type === 'image') {
          setImageUrl(data.avatar);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar avatar:', error);
      toast.error('Erro ao carregar dados do avatar');
    }
  };

  const personalities: { value: AvatarPersonality; label: string; description: string }[] = [
    { value: 'friend', label: 'Amigo', description: 'Casual, descontraído e próximo' },
    { value: 'consultant', label: 'Consultor', description: 'Profissional e orientado a soluções' },
    { value: 'colleague', label: 'Colega', description: 'Colaborativo e respeitoso' },
    { value: 'mentor', label: 'Mentor', description: 'Experiente e orientador' },
    { value: 'coach', label: 'Coach', description: 'Motivador e focado em resultados' },
    { value: 'therapist', label: 'Terapeuta', description: 'Empático e compreensivo' }
  ];

  const tones: { value: AvatarTone; label: string; description: string }[] = [
    { value: 'friendly', label: 'Amigável', description: 'Caloroso e acolhedor' },
    { value: 'formal', label: 'Formal', description: 'Profissional e estruturado' },
    { value: 'playful', label: 'Brincalhão', description: 'Divertido e descontraído' },
    { value: 'empathetic', label: 'Empático', description: 'Compreensivo e solidário' },
    { value: 'witty', label: 'Espirituoso', description: 'Inteligente e bem-humorado' },
    { value: 'wise', label: 'Sábio', description: 'Reflexivo e ponderado' }
  ];

  const categories: { value: AvatarCategory; label: string }[] = [
    { value: 'personal', label: 'Pessoal' },
    { value: 'professional', label: 'Profissional' },
    { value: 'educational', label: 'Educacional' },
    { value: 'entertainment', label: 'Entretenimento' }
  ];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB.');
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para fazer upload de imagens');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      setFormData(prev => ({
        ...prev,
        avatar: publicUrl,
        avatarType: 'image'
      }));

      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (formData.publishToStore && !formData.storeTitle.trim()) {
      toast.error('Título da loja é obrigatório quando publicar na loja');
      return;
    }

    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado');
        return;
      }

      const avatarData = {
        nome: formData.nome,
        personalidade: formData.personalidade,
        tom: formData.tom,
        avatar: formData.avatar,
        avatar_type: formData.avatarType,
        background: formData.background || null,
        interests: formData.interests || null,
        user_id: user.id
      };

      let avatarId: string;

      if (isEditing && id) {
        const { error } = await supabase
          .from('avatares')
          .update(avatarData)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        avatarId = id;
        toast.success('Avatar atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('avatares')
          .insert(avatarData)
          .select('id')
          .single();

        if (error) throw error;
        avatarId = data.id;
        toast.success('Avatar criado com sucesso!');
      }

      // Publish to store if requested
      if (formData.publishToStore && avatarId) {
        const { error: storeError } = await supabase
          .from('avatar_store')
          .insert({
            avatar_id: avatarId,
            creator_id: user.id,
            title: formData.storeTitle,
            description: formData.storeDescription || null
          });

        if (storeError) {
          console.error('Erro ao publicar na loja:', storeError);
          toast.error('Avatar criado, mas houve erro ao publicar na loja');
        } else {
          toast.success('Avatar publicado na loja com sucesso!');
        }
      }

      navigate('/chat');
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
      toast.error('Erro ao salvar avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryFromPersonality = (personality: AvatarPersonality): AvatarCategory => {
    const mapping: Record<AvatarPersonality, AvatarCategory> = {
      'friend': 'personal',
      'consultant': 'professional',
      'colleague': 'professional',
      'mentor': 'educational',
      'coach': 'professional',
      'therapist': 'personal'
    };
    return mapping[personality] || 'personal';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 container-safe">
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate('/chat')}
                className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2 px-4"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl shadow-lg">
                {isEditing ? <Edit className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {isEditing ? 'Editar Avatar' : 'Criar Novo Avatar'}
                </h1>
                <p className="text-sm text-slate-300">
                  {isEditing ? 'Modifique as características do seu avatar' : 'Personalize seu assistente de IA'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Preview */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2 text-slate-800">
                <User className="h-5 w-5" />
                <span>Preview do Avatar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 shadow-lg">
                {formData.avatarType === 'image' && imageUrl ? (
                  <AvatarImage src={imageUrl} alt={formData.nome} className="object-cover" />
                ) : (
                  <AvatarFallback className="text-4xl bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                    {formData.avatar}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-800">{formData.nome || 'Seu Avatar'}</h3>
                <div className="flex justify-center space-x-2 mt-2">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                    {personalities.find(p => p.value === formData.personalidade)?.label}
                  </Badge>
                  <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                    {tones.find(t => t.value === formData.tom)?.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-800">
                <User className="h-5 w-5" />
                <span>Informações Básicas</span>
              </CardTitle>
              <CardDescription>Defina o nome e aparência do seu avatar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Avatar *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Alex, Dr. Silva, Coach Maria..."
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Aparência do Avatar</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="emoji">Emoji</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="emoji"
                        value={formData.avatarType === 'emoji' ? formData.avatar : '🤖'}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            avatar: e.target.value,
                            avatarType: 'emoji'
                          }));
                          setImageUrl('');
                        }}
                        placeholder="🤖"
                        className="w-20 text-center text-2xl"
                        maxLength={2}
                      />
                      <div className="text-xs text-slate-500 mt-2">
                        Cole um emoji aqui
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-slate-500 text-sm">ou</span>
                  </div>
                  
                  <div className="flex-1">
                    <Label htmlFor="image-upload">Upload de Imagem</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                        disabled={isLoading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isLoading ? 'Carregando...' : 'Escolher Imagem'}
                      </Button>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Máximo 5MB (JPG, PNG, GIF)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personality */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-800">
                <Palette className="h-5 w-5" />
                <span>Personalidade</span>
              </CardTitle>
              <CardDescription>Como você gostaria que seu avatar se comporte?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Tipo de Personalidade</Label>
                <Select
                  value={formData.personalidade}
                  onValueChange={(value: AvatarPersonality) => 
                    setFormData(prev => ({ ...prev, personalidade: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {personalities.map((personality) => (
                      <SelectItem key={personality.value} value={personality.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{personality.label}</span>
                          <span className="text-sm text-slate-500">{personality.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tom de Conversa</Label>
                <Select
                  value={formData.tom}
                  onValueChange={(value: AvatarTone) => 
                    setFormData(prev => ({ ...prev, tom: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{tone.label}</span>
                          <span className="text-sm text-slate-500">{tone.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Background & Interests */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-800">
                <MessageSquare className="h-5 w-5" />
                <span>Contexto e Interesses</span>
              </CardTitle>
              <CardDescription>Adicione contexto para conversas mais relevantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="background">Background/Contexto</Label>
                <Textarea
                  id="background"
                  value={formData.background}
                  onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                  placeholder="Ex: Sou estudante de medicina, trabalho em startup, tenho filhos pequenos..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interests">Interesses e Hobbies</Label>
                <Textarea
                  id="interests"
                  value={formData.interests}
                  onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                  placeholder="Ex: tecnologia, esportes, culinária, leitura, viagens..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Store Publishing */}
          {!isEditing && (
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-800">
                  <Store className="h-5 w-5" />
                  <span>Compartilhar na Loja</span>
                </CardTitle>
                <CardDescription>Permita que outros usuários usem seu avatar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="publishToStore"
                    checked={formData.publishToStore}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, publishToStore: checked as boolean }))
                    }
                  />
                  <Label htmlFor="publishToStore">
                    Publicar este avatar na Loja Comunitária
                  </Label>
                </div>

                {formData.publishToStore && (
                  <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="space-y-2">
                      <Label htmlFor="storeTitle">Título na Loja *</Label>
                      <Input
                        id="storeTitle"
                        value={formData.storeTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, storeTitle: e.target.value }))}
                        placeholder="Ex: Assistente Médico Amigável, Coach Motivacional..."
                        required={formData.publishToStore}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeDescription">Descrição (opcional)</Label>
                      <Textarea
                        id="storeDescription"
                        value={formData.storeDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, storeDescription: e.target.value }))}
                        placeholder="Descreva o que torna este avatar especial e como ele pode ajudar outros usuários..."
                        rows={3}
                      />
                    </div>

                    <div className="text-sm text-purple-700 bg-purple-100 p-3 rounded">
                      <strong>Categoria:</strong> {categories.find(c => c.value === getCategoryFromPersonality(formData.personalidade))?.label}
                      <br />
                      <span className="text-purple-600">A categoria é determinada automaticamente baseada na personalidade escolhida.</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              onClick={() => navigate('/chat')}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>{isEditing ? 'Atualizar Avatar' : 'Criar Avatar'}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Personalize;
