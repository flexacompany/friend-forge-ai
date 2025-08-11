import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Store, 
  Star, 
  Download, 
  Search, 
  Filter, 
  ArrowLeft,
  MessageCircle,
  User,
  Crown,
  Verified,
  Plus
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StoreAvatar {
  id: string;
  avatar_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  downloads_count: number;
  average_rating: number;
  rating_count: number;
  is_featured: boolean;
  is_verified: boolean;
  created_at: string;
  avatar: {
    nome: string;
    avatar: string;
    avatar_type: string;
    personalidade: string;
    tom: string;
    categoria: string;
  };
  creator: {
    username: string;
  };
}

interface Rating {
  id: string;
  user_id: string;
  overall_rating: number;
  comment: string | null;
  created_at: string;
  user: {
    username: string;
  };
}

const AvatarStore = () => {
  const [storeAvatars, setStoreAvatars] = useState<StoreAvatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<StoreAvatar | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadStoreAvatars();
  }, [sortBy, selectedCategory]);

  const loadStoreAvatars = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('avatar_store')
        .select(`
          *,
          avatar:avatares(nome, avatar, avatar_type, personalidade, tom, categoria)
        `);

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('downloads_count', { ascending: false });
          break;
        case 'rating':
          query = query.order('average_rating', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data: storeData, error } = await query;

      if (error) throw error;

      // Get creator usernames separately
      const creatorIds = storeData?.map(item => item.creator_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', creatorIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
      }

      // Merge data
      const enrichedData = storeData?.map(item => ({
        ...item,
        creator: {
          username: profiles?.find(p => p.id === item.creator_id)?.username || 'Usuário Anônimo'
        }
      })) || [];
      
      // Filter by category and search term
      let filteredData = enrichedData;
      
      if (selectedCategory !== 'all') {
        filteredData = filteredData.filter(item => 
          item.avatar?.categoria === selectedCategory
        );
      }
      
      if (searchTerm) {
        filteredData = filteredData.filter(item => 
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.avatar?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setStoreAvatars(filteredData);
    } catch (error) {
      console.error('Erro ao carregar loja de avatares:', error);
      toast.error('Erro ao carregar avatares da loja');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvatarRatings = async (avatarStoreId: string) => {
    try {
      const { data: ratingsData, error } = await supabase
        .from('avatar_ratings')
        .select('*')
        .eq('avatar_store_id', avatarStoreId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user data separately
      const userIds = ratingsData?.map(rating => rating.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading user profiles:', profilesError);
      }

      // Merge rating data with user info
      const enrichedRatings = ratingsData?.map(rating => ({
        ...rating,
        user: {
          username: profiles?.find(p => p.id === rating.user_id)?.username || 'Usuário Anônimo'
        }
      })) || [];

      setRatings(enrichedRatings);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  const handleAvatarClick = (avatar: StoreAvatar) => {
    setSelectedAvatar(avatar);
    loadAvatarRatings(avatar.id);
  };

  const handleDownloadAvatar = async (storeAvatar: StoreAvatar) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para baixar avatares');
        return;
      }

      // Check if user already has this avatar
      const { data: existingAvatar } = await supabase
        .from('avatares')
        .select('id')
        .eq('user_id', user.id)
        .eq('nome', storeAvatar.avatar.nome)
        .single();

      if (existingAvatar) {
        toast.error('Você já possui um avatar com este nome');
        return;
      }

      // Add avatar to user's collection
      const { error: insertError } = await supabase
        .from('avatares')
        .insert({
          nome: `${storeAvatar.avatar.nome} (da Loja)`,
          personalidade: storeAvatar.avatar.personalidade,
          tom: storeAvatar.avatar.tom,
          categoria: storeAvatar.avatar.categoria,
          avatar: storeAvatar.avatar.avatar,
          avatar_type: storeAvatar.avatar.avatar_type
        });

      if (insertError) throw insertError;

      // Record download
      const { error: downloadError } = await supabase
        .from('avatar_downloads')
        .insert({
          avatar_store_id: storeAvatar.id,
          user_id: user.id
        });

      if (downloadError) throw downloadError;

      toast.success('Avatar adicionado à sua coleção!');
      loadStoreAvatars(); // Refresh to update download count
    } catch (error) {
      console.error('Erro ao baixar avatar:', error);
      toast.error('Erro ao baixar avatar');
    }
  };

  const handleRatingSubmit = async () => {
    if (!selectedAvatar || !userRating) return;

    try {
      setIsSubmittingRating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para avaliar');
        return;
      }

      const { error } = await supabase
        .from('avatar_ratings')
        .upsert({
          avatar_store_id: selectedAvatar.id,
          user_id: user.id,
          overall_rating: userRating,
          comment: userComment || null
        });

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso!');
      setUserRating(0);
      setUserComment('');
      loadAvatarRatings(selectedAvatar.id);
      loadStoreAvatars(); // Refresh to update ratings
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (star: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onStarClick?.(star)}
          />
        ))}
      </div>
    );
  };

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'personal', name: 'Pessoal' },
    { id: 'professional', name: 'Profissional' },
    { id: 'educational', name: 'Educacional' },
    { id: 'entertainment', name: 'Entretenimento' }
  ];

  if (selectedAvatar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 container-safe">
        {/* Header */}
        <header className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setSelectedAvatar(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2 px-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl shadow-lg">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {selectedAvatar.title}
                  </h1>
                  <p className="text-sm text-slate-300">por {selectedAvatar.creator.username}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Avatar Details */}
            <div className="lg:col-span-2">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl mb-8">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24 shadow-lg">
                      {selectedAvatar.avatar.avatar_type === 'image' ? (
                        <AvatarImage src={selectedAvatar.avatar.avatar} alt={selectedAvatar.avatar.nome} className="object-cover" />
                      ) : (
                        <AvatarFallback className="text-4xl bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                          {selectedAvatar.avatar.avatar}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <CardTitle className="text-3xl font-bold text-slate-800">
                      {selectedAvatar.avatar.nome}
                    </CardTitle>
                    {selectedAvatar.is_verified && (
                      <Verified className="h-6 w-6 text-blue-500" />
                    )}
                    {selectedAvatar.is_featured && (
                      <Crown className="h-6 w-6 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    {renderStars(selectedAvatar.average_rating)}
                    <span className="text-sm text-slate-600">
                      {selectedAvatar.average_rating.toFixed(1)} ({selectedAvatar.rating_count} avaliações)
                    </span>
                  </div>
                  <div className="flex justify-center space-x-2 mb-4">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      {selectedAvatar.avatar.personalidade}
                    </Badge>
                    <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                      {selectedAvatar.avatar.tom}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      {selectedAvatar.avatar.categoria}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Download className="h-4 w-4" />
                      <span>{selectedAvatar.downloads_count} downloads</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>por {selectedAvatar.creator.username}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedAvatar.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Descrição</h3>
                      <p className="text-slate-600">{selectedAvatar.description}</p>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => handleDownloadAvatar(selectedAvatar)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] h-12 text-lg font-semibold"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Adicionar aos Meus Avatares
                  </Button>
                </CardContent>
              </Card>

              {/* Ratings */}
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Avaliações ({ratings.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ratings.map((rating) => (
                      <div key={rating.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-slate-800">{rating.user.username}</span>
                            {renderStars(rating.overall_rating)}
                          </div>
                          <span className="text-xs text-slate-500">
                            {new Date(rating.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-slate-600 text-sm">{rating.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rating Form */}
            <div>
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Avaliar Avatar</CardTitle>
                  <CardDescription>Compartilhe sua opinião sobre este avatar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sua avaliação
                    </label>
                    {renderStars(userRating, true, setUserRating)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Comentário (opcional)
                    </label>
                    <Textarea
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Compartilhe sua experiência com este avatar..."
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <Button
                    onClick={handleRatingSubmit}
                    disabled={!userRating || isSubmittingRating}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  >
                    {isSubmittingRating ? 'Enviando...' : 'Enviar Avaliação'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
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
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl shadow-lg">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Loja de Avatares
                </h1>
                <p className="text-sm text-slate-300">Descubra e baixe avatares criados pela comunidade</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/chat')}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500 rounded-lg transition-all duration-200 flex items-center space-x-2 px-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Chat</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar avatares..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'rating')}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="newest">Mais Novos</option>
                <option value="popular">Mais Populares</option>
                <option value="rating">Melhor Avaliados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Featured Avatars */}
        {storeAvatars.filter(avatar => avatar.is_featured).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <span>Avatares em Destaque</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storeAvatars
                .filter(avatar => avatar.is_featured)
                .slice(0, 3)
                .map((avatar) => (
                <Card 
                  key={avatar.id} 
                  className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleAvatarClick(avatar)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          {avatar.avatar.avatar_type === 'image' ? (
                            <AvatarImage src={avatar.avatar.avatar} alt={avatar.avatar.nome} className="object-cover" />
                          ) : (
                            <AvatarFallback className="text-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                              {avatar.avatar.avatar}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg text-slate-800 flex items-center space-x-2">
                            <span>{avatar.title}</span>
                            {avatar.is_verified && <Verified className="h-4 w-4 text-blue-500" />}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            por {avatar.creator.username}
                          </CardDescription>
                        </div>
                      </div>
                      <Crown className="h-5 w-5 text-yellow-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        {renderStars(avatar.average_rating)}
                        <span className="text-sm text-slate-600">
                          {avatar.average_rating.toFixed(1)} ({avatar.rating_count})
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          {avatar.avatar.personalidade}
                        </Badge>
                        <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                          {avatar.avatar.tom}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4" />
                          <span>{avatar.downloads_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{avatar.rating_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Avatars */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Todos os Avatares</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-white">Carregando avatares...</div>
            </div>
          ) : storeAvatars.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white mb-4">Nenhum avatar encontrado</div>
              <p className="text-slate-300">Tente ajustar os filtros ou buscar por outros termos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {storeAvatars.map((avatar) => (
                <Card 
                  key={avatar.id} 
                  className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleAvatarClick(avatar)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        {avatar.avatar.avatar_type === 'image' ? (
                          <AvatarImage src={avatar.avatar.avatar} alt={avatar.avatar.nome} className="object-cover" />
                        ) : (
                          <AvatarFallback className="text-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                            {avatar.avatar.avatar}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-base text-slate-800 flex items-center space-x-1">
                          <span className="truncate">{avatar.title}</span>
                          {avatar.is_verified && <Verified className="h-3 w-3 text-blue-500 flex-shrink-0" />}
                          {avatar.is_featured && <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          por {avatar.creator.username}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        {renderStars(avatar.average_rating)}
                        <span className="text-xs text-slate-600">
                          {avatar.average_rating.toFixed(1)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                          {avatar.avatar.personalidade}
                        </Badge>
                        <Badge className="text-xs bg-pink-100 text-pink-700 border-pink-200">
                          {avatar.avatar.tom}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center space-x-1">
                          <Download className="h-3 w-3" />
                          <span>{avatar.downloads_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{avatar.rating_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvatarStore;
