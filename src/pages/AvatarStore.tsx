
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, 
  Search, 
  Star, 
  Download, 
  TrendingUp, 
  Award,
  Filter,
  Plus,
  MessageCircle,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";

type AvatarPersonality = Database["public"]["Enums"]["avatar_personality"];
type AvatarTone = Database["public"]["Enums"]["avatar_tone"];
type AvatarCategory = Database["public"]["Enums"]["avatar_category"];

interface StoreAvatar {
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
  creator_username: string;
  download_count: number;
  rating_count: number;
  average_rating: number;
}

const CATEGORY_LABELS = {
  personal: 'Pessoal',
  business: 'Negócios',
  education: 'Educação',
  health: 'Saúde',
  creative: 'Criativo',
  technical: 'Técnico'
} as const;

const PERSONALITY_LABELS = {
  friend: 'Amigo',
  consultant: 'Consultor',
  colleague: 'Colega',
  mentor: 'Mentor',
  coach: 'Coach',
  therapist: 'Terapeuta'
} as const;

const TONE_LABELS = {
  friendly: 'Amigável',
  formal: 'Formal',
  playful: 'Divertido',
  empathetic: 'Empático',
  witty: 'Espirituoso',
  wise: 'Sábio'
} as const;

const AvatarStore = () => {
  const [avatars, setAvatars] = useState<StoreAvatar[]>([]);
  const [filteredAvatars, setFilteredAvatars] = useState<StoreAvatar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AvatarCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState('recent');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadStoreAvatars();
  }, [activeTab, selectedCategory]);

  useEffect(() => {
    filterAvatars();
  }, [avatars, searchTerm]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const loadStoreAvatars = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_store_avatars', {
        category_filter: selectedCategory === 'all' ? null : selectedCategory,
        sort_by: activeTab,
        limit_count: 24
      });

      if (error) throw error;
      setAvatars(data || []);
    } catch (error) {
      console.error('Erro ao carregar avatares da loja:', error);
      toast.error('Erro ao carregar avatares da loja');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAvatars = () => {
    if (!searchTerm) {
      setFilteredAvatars(avatars);
      return;
    }

    const filtered = avatars.filter(avatar =>
      avatar.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avatar.background?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avatar.interests?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAvatars(filtered);
  };

  const handleDownloadAvatar = async (storeAvatar: StoreAvatar) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Adicionar avatar aos avatares do usuário
      const { error: insertError } = await supabase
        .from('avatares')
        .insert({
          user_id: user.id,
          nome: storeAvatar.nome,
          personalidade: storeAvatar.personalidade,
          tom: storeAvatar.tom,
          categoria: storeAvatar.categoria,
          avatar: storeAvatar.avatar,
          avatar_type: storeAvatar.avatar_type,
          background: storeAvatar.background,
          interests: storeAvatar.interests
        });

      if (insertError) throw insertError;

      // Registrar download
      const { error: downloadError } = await supabase
        .from('avatar_downloads')
        .insert({
          avatar_id: storeAvatar.id,
          user_id: user.id
        });

      if (downloadError) throw downloadError;

      toast.success(`Avatar "${storeAvatar.nome}" adicionado aos seus avatares!`);
      loadStoreAvatars(); // Recarregar para atualizar contadores
    } catch (error) {
      console.error('Erro ao baixar avatar:', error);
      toast.error('Erro ao adicionar avatar');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderAvatar = (avatar: StoreAvatar) => (
    <Avatar className="h-12 w-12 flex-shrink-0">
      {avatar.avatar_type === 'image' ? (
        <AvatarImage src={avatar.avatar} alt={avatar.nome} className="object-cover" />
      ) : (
        <AvatarFallback className="text-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          {avatar.avatar}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 container-safe">
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate('/personalize')}
                className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2 px-4"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Loja de Avatares
                </h1>
                <p className="text-sm text-slate-300">Descubra avatares incríveis criados pela comunidade</p>
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
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar avatares..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/95 backdrop-blur-sm border-slate-200 focus:border-emerald-500 rounded-xl"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-300" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as AvatarCategory | 'all')}
                className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">Todas as Categorias</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-white/95 backdrop-blur-sm">
            <TabsTrigger value="recent" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Recentes</span>
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Populares</span>
            </TabsTrigger>
            <TabsTrigger value="rating" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Mais Avaliados</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
          </div>
        )}

        {/* Avatars Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAvatars.map((avatar) => (
              <Card key={avatar.id} className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    {renderAvatar(avatar)}
                    <div className="flex-1">
                      <CardTitle className="text-lg text-slate-800">{avatar.nome}</CardTitle>
                      <CardDescription className="text-sm text-slate-600">
                        por {avatar.creator_username}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        {CATEGORY_LABELS[avatar.categoria]}
                      </Badge>
                      <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                        {PERSONALITY_LABELS[avatar.personalidade]}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        {TONE_LABELS[avatar.tom]}
                      </Badge>
                    </div>

                    {/* Description */}
                    {avatar.background && (
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {avatar.background}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Download className="h-4 w-4" />
                        <span>{avatar.download_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center">
                          {renderStars(avatar.average_rating)}
                        </div>
                        <span>({avatar.rating_count})</span>
                      </div>
                    </div>

                    {/* Download Button */}
                    <Button
                      onClick={() => handleDownloadAvatar(avatar)}
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
        )}

        {/* Empty State */}
        {!isLoading && filteredAvatars.length === 0 && (
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-full mb-6">
                <Store className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">Nenhum avatar encontrado</h3>
              <p className="text-slate-600 text-center mb-8 max-w-md">
                {searchTerm
                  ? `Não encontramos avatares com "${searchTerm}". Tente outros termos de busca.`
                  : 'Não há avatares disponíveis nesta categoria no momento.'
                }
              </p>
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm('')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] px-8 py-3"
                >
                  Limpar Busca
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AvatarStore;
