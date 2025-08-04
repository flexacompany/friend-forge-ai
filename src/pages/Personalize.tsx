
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus, Settings, LogOut, MessageCircle, Upload, Image } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AvatarData {
  id?: string;
  nome: string;
  personalidade: 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist' | 'romantic' | 'father' | 'mother' | 'sibling' | 'neighbor' | 'grandparent' | 'bestfriend' | 'collegestudent' | 'schoolmate';
  tom: 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise';
  avatar: string;
  avatarType?: 'emoji' | 'image';
  background: string;
  interests: string;
}

interface SystemAvatarData {
  id: string;
  nome: string;
  categoria: 'musica' | 'entretenimento' | 'esportes' | 'profissional' | 'tecnologia' | 'arte' | 'outros';
  profissao: string;
  personalidade: 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist' | 'romantic' | 'father' | 'mother' | 'sibling' | 'neighbor' | 'grandparent' | 'bestfriend' | 'collegestudent' | 'schoolmate';
  tom: 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise';
  avatar: string;
  avatarType?: 'emoji' | 'image';
  background: string;
  interests: string;
  caracteristicas: string;
  inspiracao: string;
}

const PERSONALITY_TYPES = [
  { value: 'friend', label: 'Amigo', description: 'Casual e acolhedor, sempre pronto para uma conversa amigável.' },
  { value: 'consultant', label: 'Consultor', description: 'Profissional e estratégico, oferece insights práticos e soluções eficazes.' },
  { value: 'colleague', label: 'Colega de Trabalho', description: 'Colaborativo e motivador, ideal para discussões de projetos e trabalho em equipe.' },
  { value: 'mentor', label: 'Mentor', description: 'Sábio e orientador, focado no desenvolvimento pessoal e profissional.' },
  { value: 'coach', label: 'Coach', description: 'Motivacional focado em resultados, ajuda a alcançar objetivos e superar desafios.' },
  { value: 'therapist', label: 'Terapeuta', description: 'Compreensivo e empático, oferece suporte emocional e ajuda na reflexão.' },
  { value: 'romantic', label: 'Companheiro(a)', description: 'Carinhoso e atencioso, demonstra afeto e interesse romântico respeitoso.' },
  { value: 'father', label: 'Figura Paterna', description: 'Protetor e orientador, oferece conselhos sábios com amor paternal.' },
  { value: 'mother', label: 'Figura Materna', description: 'Acolhedora e cuidadosa, proporciona conforto e apoio maternal.' },
  { value: 'sibling', label: 'Irmão/Irmã', description: 'Companheiro leal e divertido, compartilha experiências com cumplicidade fraternal.' },
  { value: 'neighbor', label: 'Vizinho Amigável', description: 'Cordial e prestativo, sempre disponível para uma conversa casual.' },
  { value: 'grandparent', label: 'Avô/Avó', description: 'Sábio e carinhoso, compartilha experiências de vida com ternura.' },
  { value: 'bestfriend', label: 'Melhor Amigo', description: 'Leal e confiável, oferece apoio incondicional e momentos divertidos.' },
  { value: 'collegestudent', label: 'Colega de Faculdade', description: 'Intelectual e colaborativo, compartilha conhecimentos acadêmicos e experiências universitárias.' },
  { value: 'schoolmate', label: 'Colega de Escola', description: 'Jovial e energético, traz nostalgia escolar e conversas descontraídas.' }
];

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Amigável', description: 'Caloroso e próximo, usando uma linguagem acessível e acolhedora.' },
  { value: 'formal', label: 'Formal', description: 'Profissional e respeitoso, mantendo um padrão formal mas não distante.' },
  { value: 'playful', label: 'Divertido', description: 'Descontraído e alegre, com um toque de humor apropriado.' },
  { value: 'empathetic', label: 'Empático', description: 'Compreensivo e acolhedor, demonstrando empatia e sensibilidade.' },
  { value: 'witty', label: 'Espirituoso', description: 'Inteligente com humor sutil, usando referências inteligentes quando apropriado.' },
  { value: 'wise', label: 'Sábio', description: 'Reflexivo e profundo, oferecendo perspectivas thoughtful e consideradas.' }
];

const AVATAR_OPTIONS = ['😀', '😎', '🤓', '🧐', '🤖', '👻', '👽', '😻', '🐶', '🦊', '🐻', '🐼', '🦁', '🐯', '🐴', '🦄', '🦋', '🐞', '🐢', '🌱', '🍄', '🌟', '🌈', '🍕', '🍔', '🍦', '⚽', '🏀', '🎮', '🎨', '📚', '🎵', '📸', '🚀', '💡', '🔑', '🎁', '🎈', '🎉'];

const SYSTEM_AVATARS: SystemAvatarData[] = [
  // Música
  {
    id: 'luna-kpop',
    nome: 'Luna Park',
    categoria: 'musica',
    profissao: 'Cantora K-Pop',
    personalidade: 'friend',
    tom: 'playful',
    avatar: '👩',
    background: 'Estrela do K-Pop com milhões de fãs ao redor do mundo',
    interests: 'dança, moda, cultura coreana, interação com fãs',
    caracteristicas: 'Energética, carismática, dedicada aos fãs, perfeccionista nos ensaios',
    inspiracao: 'Inspirada em ídolos K-Pop como IU e Taeyeon'
  },
  {
    id: 'alex-rapper',
    nome: 'Alex Flow',
    categoria: 'musica',
    profissao: 'Rapper',
    personalidade: 'bestfriend',
    tom: 'witty',
    avatar: '🧑',
    background: 'Rapper underground que conquistou o mainstream com letras inteligentes',
    interests: 'hip-hop, poesia, justiça social, produção musical',
    caracteristicas: 'Inteligente, autêntico, socialmente consciente, criativo',
    inspiracao: 'Inspirado em rappers como Kendrick Lamar e Emicida'
  },
  {
    id: 'carlos-sertanejo',
    nome: 'Carlos Viola',
    categoria: 'musica',
    profissao: 'Cantor Sertanejo',
    personalidade: 'neighbor',
    tom: 'friendly',
    avatar: '👨',
    background: 'Cantor sertanejo raiz que valoriza as tradições do interior',
    interests: 'vida no campo, família, tradições, cavalgadas',
    caracteristicas: 'Simples, autêntico, família acima de tudo, contador de histórias',
    inspiracao: 'Inspirado em duplas como Chitãozinho & Xororó'
  },
  {
    id: 'maya-rock',
    nome: 'Maya Storm',
    categoria: 'musica',
    profissao: 'Rockeira',
    personalidade: 'sibling',
    tom: 'witty',
    avatar: '🎸',
    background: 'Guitarrista e vocalista de uma banda de rock alternativo',
    interests: 'guitarra, composição, shows ao vivo, liberdade artística',
    caracteristicas: 'Rebelde, apaixonada pela música, independente, autêntica',
    inspiracao: 'Inspirada em artistas como Joan Jett e Alanis Morissette'
  },
  // Entretenimento
  {
    id: 'sofia-atriz',
    nome: 'Sofia Estrela',
    categoria: 'entretenimento',
    profissao: 'Atriz',
    personalidade: 'romantic',
    tom: 'empathetic',
    avatar: '👩‍🎭',
    background: 'Atriz premiada conhecida por papéis dramáticos marcantes',
    interests: 'teatro, cinema, literatura, causas humanitárias',
    caracteristicas: 'Emotiva, empática, dedicada à arte, socialmente engajada',
    inspiracao: 'Inspirada em atrizes como Meryl Streep e Fernanda Montenegro'
  },
  {
    id: 'ricardo-ator',
    nome: 'Ricardo Cena',
    categoria: 'entretenimento',
    profissao: 'Ator',
    personalidade: 'mentor',
    tom: 'wise',
    avatar: '👨‍🎭',
    background: 'Ator veterano com décadas de experiência em cinema e TV',
    interests: 'atuação, direção, ensino, preservação cultural',
    caracteristicas: 'Sábio, experiente, mentor de jovens atores, respeitado',
    inspiracao: 'Inspirado em atores como Anthony Hopkins e Lima Duarte'
  },
  // Esportes
  {
    id: 'diego-futebol',
    nome: 'Diego Gol',
    categoria: 'esportes',
    profissao: 'Jogador de Futebol',
    personalidade: 'coach',
    tom: 'friendly',
    avatar: '👦',
    background: 'Atacante habilidoso conhecido por gols decisivos',
    interests: 'futebol, treinos, família, projetos sociais',
    caracteristicas: 'Determinado, líder em campo, humilde, dedicado',
    inspiracao: 'Inspirado em jogadores como Pelé e Ronaldinho'
  },
  {
    id: 'ana-basquete',
    nome: 'Ana Slam',
    categoria: 'esportes',
    profissao: 'Jogadora de Basquete',
    personalidade: 'bestfriend',
    tom: 'playful',
    avatar: '👧',
    background: 'Armadora talentosa com visão de jogo excepcional',
    interests: 'basquete, estratégia, empoderamento feminino, juventude',
    caracteristicas: 'Competitiva, estratégica, inspiradora, trabalho em equipe',
    inspiracao: 'Inspirada em jogadoras como Sue Bird e Hortência'
  },
  {
    id: 'max-f1',
    nome: 'Max Velocidade',
    categoria: 'esportes',
    profissao: 'Piloto de Fórmula 1',
    personalidade: 'colleague',
    tom: 'formal',
    avatar: '🧔',
    background: 'Piloto de F1 conhecido pela precisão e velocidade',
    interests: 'automobilismo, tecnologia, precisão, adrenalina',
    caracteristicas: 'Focado, preciso, corajoso, tecnicamente excelente',
    inspiracao: 'Inspirado em pilotos como Ayrton Senna e Lewis Hamilton'
  },
  // Profissionais
  {
    id: 'helena-politica',
    nome: 'Helena Justiça',
    categoria: 'profissional',
    profissao: 'Política',
    personalidade: 'consultant',
    tom: 'formal',
    avatar: '⚖️',
    background: 'Política experiente focada em políticas públicas sociais',
    interests: 'política, justiça social, educação, saúde pública',
    caracteristicas: 'Íntegra, determinada, focada no bem comum, articulada',
    inspiracao: 'Inspirada em políticas como Angela Merkel e Dilma Rousseff'
  },
  {
    id: 'pedro-advogado',
    nome: 'Pedro Direito',
    categoria: 'profissional',
    profissao: 'Advogado',
    personalidade: 'consultant',
    tom: 'formal',
    avatar: '🤵',
    background: 'Advogado criminalista conhecido por defender causas justas',
    interests: 'direito, justiça, leitura, casos complexos',
    caracteristicas: 'Analítico, ético, persuasivo, defensor da justiça',
    inspiracao: 'Inspirado em advogados como Rui Barbosa'
  },
  {
    id: 'carla-contadora',
    nome: 'Carla Números',
    categoria: 'profissional',
    profissao: 'Contadora',
    personalidade: 'colleague',
    tom: 'formal',
    avatar: '📊',
    background: 'Contadora especializada em consultoria empresarial',
    interests: 'finanças, planejamento, organização, eficiência',
    caracteristicas: 'Organizada, detalhista, confiável, estratégica',
    inspiracao: 'Profissional dedicada às ciências contábeis'
  },
  {
    id: 'bruno-personal',
    nome: 'Bruno Força',
    categoria: 'profissional',
    profissao: 'Personal Trainer',
    personalidade: 'coach',
    tom: 'friendly',
    avatar: '💪',
    background: 'Personal trainer especializado em transformações corporais',
    interests: 'fitness, nutrição, motivação, saúde',
    caracteristicas: 'Motivador, disciplinado, conhecedor, encorajador',
    inspiracao: 'Profissional dedicado ao fitness e bem-estar'
  },
  // Tecnologia
  {
    id: 'lucas-dev',
    nome: 'Lucas Code',
    categoria: 'tecnologia',
    profissao: 'Desenvolvedor',
    personalidade: 'colleague',
    tom: 'friendly',
    avatar: '👨‍💻',
    background: 'Desenvolvedor full-stack apaixonado por tecnologias inovadoras',
    interests: 'programação, IA, open source, inovação',
    caracteristicas: 'Criativo, lógico, colaborativo, sempre aprendendo',
    inspiracao: 'Desenvolvedor moderno focado em soluções tecnológicas'
  },
  {
    id: 'gabi-gamer',
    nome: 'Gabi Player',
    categoria: 'tecnologia',
    profissao: 'Gamer Profissional',
    personalidade: 'bestfriend',
    tom: 'playful',
    avatar: '👾',
    background: 'Gamer profissional especializada em e-sports',
    interests: 'games, estratégia, competições, streaming',
    caracteristicas: 'Competitiva, estratégica, divertida, dedicada',
    inspiracao: 'Gamer profissional do cenário de e-sports'
  },
  {
    id: 'nina-streamer',
    nome: 'Nina Live',
    categoria: 'tecnologia',
    profissao: 'Streamer',
    personalidade: 'friend',
    tom: 'playful',
    avatar: '📹',
    background: 'Streamer popular conhecida por conteúdo divertido e interativo',
    interests: 'streaming, jogos, interação com chat, entretenimento',
    caracteristicas: 'Carismática, divertida, interativa, criativa',
    inspiracao: 'Streamer moderna focada em entretenimento'
  },
  {
    id: 'rafael-influencer',
    nome: 'Rafael Viral',
    categoria: 'tecnologia',
    profissao: 'Influenciador Digital',
    personalidade: 'friend',
    tom: 'friendly',
    avatar: '📲',
    background: 'Influenciador digital focado em lifestyle e motivação',
    interests: 'redes sociais, tendências, motivação, lifestyle',
    caracteristicas: 'Carismático, motivador, conectado, inspirador',
    inspiracao: 'Influenciador moderno das redes sociais'
  },
  // Arte
  {
    id: 'marina-pintora',
    nome: 'Marina Cores',
    categoria: 'arte',
    profissao: 'Pintora',
    personalidade: 'mentor',
    tom: 'wise',
    avatar: '🎨',
    background: 'Pintora renomada conhecida por obras expressivas e coloridas',
    interests: 'pintura, arte contemporânea, ensino, exposições',
    caracteristicas: 'Criativa, sensível, inspiradora, técnica apurada',
    inspiracao: 'Artista dedicada às artes visuais'
  },
  // Outros
  {
    id: 'joao-estudante',
    nome: 'João Saber',
    categoria: 'outros',
    profissao: 'Estudante Universitário',
    personalidade: 'collegestudent',
    tom: 'friendly',
    avatar: '🎓',
    background: 'Estudante de medicina dedicado aos estudos e pesquisa',
    interests: 'medicina, pesquisa, estudos, vida acadêmica',
    caracteristicas: 'Estudioso, curioso, dedicado, colaborativo',
    inspiracao: 'Estudante universitário típico'
  },
  {
    id: 'roberto-meia-idade',
    nome: 'Roberto Experiência',
    categoria: 'outros',
    profissao: 'Profissional Experiente',
    personalidade: 'father',
    tom: 'wise',
    avatar: '👔',
    background: 'Profissional de meia-idade com vasta experiência de vida',
    interests: 'família, trabalho, hobbies, conselhos de vida',
    caracteristicas: 'Experiente, sábio, paternal, equilibrado',
    inspiracao: 'Profissional maduro e experiente'
  },
  {
    id: 'mike-lutador',
    nome: 'Mike Punho',
    categoria: 'esportes',
    profissao: 'Lutador de MMA',
    personalidade: 'coach',
    tom: 'empathetic',
    avatar: '🥊',
    background: 'Lutador de MMA conhecido pela disciplina e respeito',
    interests: 'artes marciais, disciplina, treino, filosofia de luta',
    caracteristicas: 'Disciplinado, respeitoso, forte mentalmente, humilde',
    inspiracao: 'Lutador profissional de MMA'
  }
];

const Personalize = () => {
  const navigate = useNavigate();
  const [avatares, setAvatares] = useState<AvatarData[]>([]);
  const [systemAvatars, setSystemAvatars] = useState<SystemAvatarData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'create' | 'system' | 'my-avatars'>('create');
  const [formData, setFormData] = useState<AvatarData>({
    nome: '',
    personalidade: 'friend',
    tom: 'friendly',
    avatar: '😀',
    avatarType: 'emoji',
    background: '',
    interests: ''
  });
  const [editingAvatar, setEditingAvatar] = useState<AvatarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarType, setAvatarType] = useState<'emoji' | 'image'>('emoji');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  }, [navigate]);

  const loadAvatares = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('avatares')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedData: AvatarData[] = data.map(avatar => ({
        id: avatar.id,
        nome: avatar.nome,
        personalidade: avatar.personalidade,
        tom: avatar.tom,
        avatar: avatar.avatar,
        avatarType: avatar.avatar_type || 'emoji',
        background: avatar.background || '',
        interests: avatar.interests || ''
      }));
      
      setAvatares(mappedData);
    } catch (error) {
      console.error('Erro ao carregar avatares:', error);
      toast.error('Erro ao carregar avatares.');
    }
  }, []);

  const loadSystemAvatars = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_avatars')
        .select('*')
        .order('categoria', { ascending: true });

      if (error) throw error;
      setSystemAvatars(data || []);
    } catch (error) {
      console.error('Erro ao carregar avatares do sistema:', error);
      // Se não conseguir carregar do banco, usa os avatares locais
      setSystemAvatars(SYSTEM_AVATARS);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    loadAvatares();
    loadSystemAvatars();
  }, [checkAuth, loadAvatares, loadSystemAvatars]);

  const addSystemAvatar = async (systemAvatar: SystemAvatarData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado.');
        return;
      }

      setIsLoading(true);

      const avatarData = {
        user_id: user.id,
        nome: systemAvatar.nome,
        personalidade: systemAvatar.personalidade,
        tom: systemAvatar.tom,
        avatar: systemAvatar.avatar,
        avatar_type: 'emoji',
        background: systemAvatar.background,
        interests: systemAvatar.interests
      };

      const { error } = await supabase
        .from('avatares')
        .insert([avatarData]);

      if (error) throw error;

      toast.success(`Avatar ${systemAvatar.nome} adicionado com sucesso!`);
      loadAvatares();
    } catch (error) {
      console.error('Erro ao adicionar avatar do sistema:', error);
      toast.error('Erro ao adicionar avatar. Tente novamente.');
    } finally {
      setIsLoading(false);
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

      // Preparar dados do avatar com o tipo e imagem corretos
      const { avatarType: _, ...formDataWithoutAvatarType } = formData;
      const avatarData = {
        ...formDataWithoutAvatarType,
        avatar_type: avatarType,
        avatar: avatarType === 'image' && uploadedImage ? uploadedImage : formData.avatar
      };

      if (editingAvatar) {
        // Atualizar avatar existente
        const { error } = await supabase
          .from('avatares')
          .update(avatarData)
          .eq('id', editingAvatar.id);

        if (error) throw error;
        toast.success('Avatar atualizado com sucesso!');
      } else {
        // Criar novo avatar - adicionar user_id do usuário logado
        const avatarToInsert = {
          ...avatarData,
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
    
    // Determinar o tipo de avatar e configurar estados
    if (avatar.avatarType === 'image' || (!AVATAR_OPTIONS.includes(avatar.avatar) && avatar.avatar.startsWith('data:'))) {
      setAvatarType('image');
      setUploadedImage(avatar.avatar);
    } else {
      setAvatarType('emoji');
      setUploadedImage(null);
    }
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
      avatarType: 'emoji',
      background: '',
      interests: ''
    });
    setEditingAvatar(null);
    setAvatarType('emoji');
    setUploadedImage(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/95 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-3 rounded-xl shadow-lg">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  IAmigo - Avatares
                </h1>
                <p className="text-slate-300 text-sm mt-1">Crie e gerencie seus assistentes virtuais</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/chat')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 font-semibold"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                <span>Chat</span>
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-600 hover:border-slate-500 rounded-xl transition-all duration-300 px-6 py-3 font-medium shadow-sm hover:shadow-md"
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Sistema de Abas */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 shadow-lg backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 min-h-[3.5rem] text-sm sm:text-base ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Criar Avatar</span>
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 min-h-[3.5rem] text-sm sm:text-base ${
                activeTab === 'system'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Avatares do Sistema</span>
            </button>
            <button
              onClick={() => setActiveTab('my-avatars')}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 min-h-[3.5rem] text-sm sm:text-base ${
                activeTab === 'my-avatars'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <MessageCircle className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Meus Avatares ({avatares.length})</span>
            </button>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'create' && (
          <Card className="shadow-2xl border-0 bg-slate-800/95 backdrop-blur-sm rounded-2xl overflow-hidden max-w-4xl mx-auto">
            <CardHeader className="bg-gradient-to-br from-slate-700/50 via-slate-800 to-emerald-900/30 border-b border-slate-700 p-8">
              <CardTitle className="flex items-center space-x-4 text-slate-100">
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-3 rounded-xl shadow-lg">
                  {editingAvatar ? <Edit2 className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
                </div>
                <div>
                  <span className="text-2xl font-bold">{editingAvatar ? 'Editar Avatar' : 'Criar Novo Avatar'}</span>
                  <p className="text-slate-300 text-sm mt-1 font-normal">
                    {editingAvatar ? 'Atualize as informações do seu avatar' : 'Configure seu novo assistente virtual'}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label htmlFor="nome" className="text-slate-200 font-semibold text-base">Nome do Avatar</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Ana, Carlos, Sofia..."
                  className="mt-2 border-2 border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl bg-slate-700 text-slate-100 placeholder:text-slate-400 h-12 px-4 text-base transition-all duration-200 shadow-sm hover:shadow-md"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-slate-200 font-semibold text-base">Avatar Visual</Label>
                
                {/* Seletor de tipo de avatar */}
                <div className="flex space-x-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarType('emoji');
                      setUploadedImage(null);
                      if (!AVATAR_OPTIONS.includes(formData.avatar)) {
                        setFormData(prev => ({ ...prev, avatar: '😀', avatarType: 'emoji' }));
                      }
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                      avatarType === 'emoji'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-lg">😀</span>
                    <span>Emoji</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarType('image')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                      avatarType === 'image'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <Image className="h-4 w-4" />
                    <span>Imagem</span>
                  </button>
                </div>

                {/* Grid de emojis */}
                {avatarType === 'emoji' && (
                  <div className="grid grid-cols-6 gap-3 mt-3 p-6 border-2 border-slate-600 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-inner">
                    {AVATAR_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, avatar: option, avatarType: 'emoji' }))}
                        className={`p-3 text-3xl rounded-xl border-2 transition-all duration-300 hover:scale-110 transform shadow-sm ${
                          formData.avatar === option && avatarType === 'emoji'
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl ring-4 ring-emerald-300/50 scale-105' 
                            : 'border-slate-500 hover:border-emerald-400 bg-slate-600 hover:bg-gradient-to-br hover:from-emerald-600/20 hover:to-teal-600/20 hover:shadow-lg'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {/* Upload de imagem */}
                {avatarType === 'image' && (
                  <div className="mt-3 p-6 border-2 border-slate-600 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-inner">
                    <div className="flex flex-col items-center space-y-4">
                      {uploadedImage ? (
                        <div className="relative">
                          <img
                            src={uploadedImage}
                            alt="Avatar personalizado"
                            className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedImage(null);
                              setFormData(prev => ({ ...prev, avatar: '' }));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-slate-500 rounded-full flex items-center justify-center">
                          <Upload className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              setUploadedImage(result);
                              setFormData(prev => ({ ...prev, avatar: result, avatarType: 'image' }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="avatar-upload"
                      />
                      
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{uploadedImage ? 'Trocar Imagem' : 'Carregar Imagem'}</span>
                      </label>
                      
                      <p className="text-xs text-slate-400 text-center">
                        Formatos aceitos: JPG, PNG, GIF<br />
                        Tamanho máximo: 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-slate-200 font-semibold text-base">Personalidade</Label>
                <Select 
                  value={formData.personalidade} 
                  onValueChange={(value: 'friend' | 'consultant' | 'colleague' | 'mentor' | 'coach' | 'therapist') => 
                    setFormData(prev => ({ ...prev, personalidade: value }))
                  }
                >
                  <SelectTrigger className="mt-2 border-2 border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl bg-slate-700 text-slate-100 h-14 px-4 text-base transition-all duration-200 shadow-sm hover:shadow-md">
                    <SelectValue placeholder="Escolha a personalidade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-slate-600 shadow-xl bg-slate-700 max-w-md">
                    {PERSONALITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="p-3 hover:bg-emerald-600/20 focus:bg-emerald-600/20 cursor-pointer text-slate-100 overflow-hidden">
                        <div className="flex flex-col space-y-1 w-full overflow-hidden">
                          <span className="font-semibold text-slate-100 text-sm truncate">{type.label}</span>
                          <span className="text-xs text-slate-300 leading-tight line-clamp-2">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-200 font-semibold text-base">Tom de Voz</Label>
                <Select 
                  value={formData.tom} 
                  onValueChange={(value: 'friendly' | 'formal' | 'playful' | 'empathetic' | 'witty' | 'wise') => 
                    setFormData(prev => ({ ...prev, tom: value }))
                  }
                >
                  <SelectTrigger className="mt-2 border-2 border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl bg-slate-700 text-slate-100 h-14 px-4 text-base transition-all duration-200 shadow-sm hover:shadow-md">
                    <SelectValue placeholder="Escolha o tom de voz" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-slate-600 shadow-xl bg-slate-700 max-w-md">
                    {TONE_OPTIONS.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value} className="p-3 hover:bg-emerald-600/20 focus:bg-emerald-600/20 cursor-pointer text-slate-100 overflow-hidden">
                        <div className="flex flex-col space-y-1 w-full overflow-hidden">
                          <span className="font-semibold text-slate-100 text-sm truncate">{tone.label}</span>
                          <span className="text-xs text-slate-300 leading-tight line-clamp-2">{tone.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="background" className="text-slate-200 font-semibold text-base">História/Background</Label>
                <Textarea
                  id="background"
                  value={formData.background}
                  onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                  placeholder="Conte a história do seu avatar, sua formação, experiências..."
                  className="mt-2 min-h-[120px] border-2 border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl bg-slate-700 text-slate-100 placeholder:text-slate-400 p-4 text-base transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="interests" className="text-slate-200 font-semibold text-base">Interesses e Especialidades</Label>
                <Textarea
                  id="interests"
                  value={formData.interests}
                  onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                  placeholder="Quais são os interesses, hobbies ou especialidades do avatar?"
                  className="mt-2 min-h-[120px] border-2 border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl bg-slate-700 text-slate-100 placeholder:text-slate-400 p-4 text-base transition-all duration-200 shadow-sm hover:shadow-md resize-none"
                />
              </div>

              <div className="flex space-x-4 pt-8">
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading || !formData.nome.trim()}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] h-14 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    editingAvatar ? 'Atualizar Avatar' : 'Criar Avatar'
                  )}
                </Button>
                {editingAvatar && (
                  <Button
                    onClick={cancelEdit}
                    className="px-8 bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-600 hover:border-slate-500 rounded-xl transition-all duration-300 h-14 font-medium shadow-sm hover:shadow-md"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Avatares do Sistema */}
        {activeTab === 'system' && (
          <Card className="shadow-2xl border-0 bg-slate-800/95 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-slate-700/50 via-slate-800 to-emerald-900/30 border-b border-slate-700 p-8">
              <CardTitle className="text-slate-100 flex items-center space-x-4">
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-3 rounded-xl shadow-lg">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold">Avatares do Sistema</span>
                  <p className="text-slate-300 text-sm mt-1 font-normal">Escolha entre nossos avatares pré-criados</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {/* Filtro por Categoria */}
              <div className="mb-6">
                <Label className="text-slate-200 font-semibold text-base mb-3 block">Filtrar por Categoria:</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-auto border-2 border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl bg-slate-700 text-slate-100 h-12 px-4 text-base transition-all duration-200 shadow-sm hover:shadow-md">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 border-slate-600 shadow-xl bg-slate-700">
                    <SelectItem key="all" value="all" className="text-slate-100 hover:bg-emerald-600/20 focus:bg-emerald-600/20">Todas as Categorias</SelectItem>
                    <SelectItem key="musica" value="musica" className="text-slate-100 hover:bg-emerald-600/20 focus:bg-emerald-600/20">Música</SelectItem>
                    <SelectItem key="entretenimento" value="entretenimento" className="text-slate-100 hover:bg-emerald-600/20 focus:bg-emerald-600/20">Entretenimento</SelectItem>
                    <SelectItem key="esportes" value="esportes" className="text-slate-100 hover:bg-emerald-600/20 focus:bg-emerald-600/20">Esportes</SelectItem>
                    <SelectItem key="profissional" value="profissional" className="text-slate-100 hover:bg-emerald-600/20 focus:bg-emerald-600/20">Profissional</SelectItem>
                    <SelectItem key="tecnologia" value="tecnologia" className="text-slate-100 hover:bg-emerald-600/20 focus:bg-emerald-600/20">Tecnologia</SelectItem>
                    <SelectItem key="arte" value="arte" className="text-slate-100 hover:bg-emerald-600/20 focus:bg-emerald-600/20">Arte</SelectItem>
                    <SelectItem key="outros" value="outros" className="text-slate-100 hover:bg-emerald-600/20 focus:bg-emerald-600/20">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grid de Avatares do Sistema */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2">
                {systemAvatars
                  .filter(avatar => selectedCategory === 'all' || avatar.categoria === selectedCategory)
                  .map((avatar) => (
                    <div key={avatar.id} className="p-6 border-2 border-slate-600 rounded-2xl hover:shadow-xl transition-all duration-300 bg-slate-700/50 hover:border-emerald-400 transform hover:scale-[1.02]">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 mx-auto mb-3">
                          {avatar.avatarType === 'image' ? (
                            <img 
                              src={avatar.avatar} 
                              alt={avatar.nome}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-full h-full rounded-full flex items-center justify-center text-4xl ${
                              avatar.avatarType === 'image' ? 'hidden' : 'flex'
                            }`}
                          >
                            {avatar.avatarType === 'image' ? '🎨' : avatar.avatar}
                          </div>
                        </div>
                        <h3 className="font-bold text-xl text-slate-100 mb-2">{avatar.nome}</h3>
                        <p className="text-sm text-emerald-400 font-medium mb-2">{avatar.profissao}</p>
                        <Badge className="text-xs bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300 px-2 py-1 rounded-lg font-medium">
                          {avatar.categoria}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-xs text-slate-300 mb-4">
                        <p><span className="font-semibold text-slate-200">Personalidade:</span> {PERSONALITY_TYPES.find(p => p.value === avatar.personalidade)?.label}</p>
                         <p><span className="font-semibold text-slate-200">Tom:</span> {TONE_OPTIONS.find(t => t.value === avatar.tom)?.label}</p>
                        <p><span className="font-semibold text-slate-200">Características:</span> {avatar.caracteristicas}</p>
                        {avatar.inspiracao && (
                          <p><span className="font-semibold text-slate-200">Inspiração:</span> {avatar.inspiracao}</p>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => addSystemAvatar(avatar)}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] h-12 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isLoading ? 'Adicionando...' : 'Adicionar Avatar'}
                      </Button>
                    </div>
                  ))
                }
              </div>
              
              {systemAvatars.filter(avatar => selectedCategory === 'all' || avatar.categoria === selectedCategory).length === 0 && (
                <p className="text-slate-400 text-center py-8">Nenhum avatar encontrado para esta categoria.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lista de Avatares do Usuário */}
        {activeTab === 'my-avatars' && (
          <Card className="shadow-2xl border-0 bg-slate-800/95 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-slate-700/50 via-slate-800 to-emerald-900/30 border-b border-slate-700 p-8">
              <CardTitle className="text-slate-100 flex items-center space-x-4">
                <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-3 rounded-xl shadow-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold">Meus Avatares ({avatares.length})</span>
                  <p className="text-slate-300 text-sm mt-1 font-normal">Gerencie seus assistentes virtuais</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {avatares.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-6 rounded-2xl w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-xl">
                    <Plus className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-100 mb-4">Nenhum avatar criado</h3>
                  <p className="text-slate-300 text-lg leading-relaxed max-w-md mx-auto">
                    Crie seu primeiro avatar para começar a conversar!
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2">
                  {avatares.map((avatar) => (
                    <div
                      key={avatar.id}
                      className="p-6 border-2 border-slate-600 rounded-2xl hover:shadow-xl transition-all duration-300 bg-slate-700/50 hover:border-emerald-400 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="bg-gradient-to-br from-slate-600 to-slate-700 p-3 rounded-xl shadow-sm w-16 h-16 flex items-center justify-center">
                            {avatar.avatarType === 'image' || (!AVATAR_OPTIONS.includes(avatar.avatar) && avatar.avatar.startsWith('data:')) ? (
                              <img 
                                src={avatar.avatar} 
                                alt={avatar.nome}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <span className="text-4xl">{avatar.avatar}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-slate-100 mb-3">{avatar.nome}</h3>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <Badge className="text-sm bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 border-emerald-300 px-3 py-1 rounded-lg font-medium">
                                {PERSONALITY_TYPES.find(p => p.value === avatar.personalidade)?.label}
                              </Badge>
                              <Badge className="text-sm bg-gradient-to-r from-teal-100 to-teal-200 text-teal-700 border-teal-300 px-3 py-1 rounded-lg font-medium">
                                {TONE_OPTIONS.find(t => t.value === avatar.tom)?.label}
                              </Badge>
                            </div>
                            {avatar.background && (
                              <p className="text-sm text-slate-300 mt-3 line-clamp-2 leading-relaxed">{avatar.background}</p>
                            )}
                            {avatar.interests && (
                              <p className="text-sm text-emerald-400 mt-3 leading-relaxed">
                                <span className="font-semibold">Interesses:</span> {avatar.interests}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-3 ml-4">
                          <Button
                            onClick={() => editAvatar(avatar)}
                            className="p-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-2 border-emerald-300 hover:border-emerald-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <Edit2 className="h-5 w-5" />
                          </Button>
                          <Button
                            onClick={() => deleteAvatar(avatar.id!)}
                            className="p-3 bg-red-100 hover:bg-red-200 text-red-700 border-2 border-red-300 hover:border-red-400 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Personalize;
