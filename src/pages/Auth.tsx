import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Brain, Users, Zap, Shield, Heart, Sparkles } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { cleanupAuthState, handleAuthError } from "@/utils/authHelpers";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário já está autenticado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/chat');
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Limpar estado anterior antes de fazer nova autenticação
      cleanupAuthState();
      
      // Tentar fazer logout global primeiro para limpar qualquer sessão anterior
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continuar mesmo se falhar
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          throw error;
        }

        if (data.user) {
          toast.success('Login realizado com sucesso!');
          // Usar window.location para forçar refresh completo
          window.location.href = '/chat';
        }
      } else {
        if (password !== confirmPassword) {
          toast.error('As senhas não coincidem');
          return;
        }

        if (password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/chat`
          }
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          if (data.user.email_confirmed_at) {
            toast.success('Conta criada com sucesso!');
            window.location.href = '/chat';
          } else {
            toast.success('Conta criada com sucesso! Verifique seu e-mail para ativar a conta.');
          }
        }
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      const errorMessage = handleAuthError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex mobile-safe-area container-safe">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-xl">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Bem-vindo
            </h1>
            <p className="text-slate-300 text-base">
              {isLogin ? 'Acesse sua conta e continue sua jornada conosco' : 'Crie sua conta e comece sua jornada'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Endereço de E-mail
              </label>
              <Input
                type="email"
                placeholder="Digite seu endereço de e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 text-sm border border-slate-600 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg bg-slate-700 text-white placeholder:text-slate-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 text-sm border border-slate-600 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg bg-slate-700 text-white placeholder:text-slate-400"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirmar Senha
                </label>
                <Input
                  type="password"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 text-sm border border-slate-600 focus:border-emerald-500 focus:ring-emerald-500 rounded-lg bg-slate-700 text-white placeholder:text-slate-400"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500 bg-slate-700" />
                <span className="ml-2 text-sm text-slate-300">Manter-me conectado</span>
              </label>
              {isLogin && (
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Esqueci a senha
                </Link>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              {isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar conta')}
            </Button>
          </form>

          <div className="text-center mt-6">
            <span className="text-sm text-slate-300">
              {isLogin ? 'Novo em nossa plataforma?' : 'Já tem uma conta?'}
            </span>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {isLogin ? 'Criar Conta' : 'Fazer Login'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Interactive Showcase */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-800 via-slate-700 to-emerald-900 relative overflow-hidden">
        {/* Subtle Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 bg-teal-400/15 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-emerald-300/10 rounded-full blur-lg"></div>
        </div>
        
        {/* Floating Emojis Animation */}
        <div className="emoji-animation-container lg:absolute lg:right-8 lg:top-0 lg:bottom-0 lg:w-16 lg:overflow-hidden">
          <div className="animate-scroll-up flex flex-col space-y-8 text-4xl">
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🎵</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🎬</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">⚽</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">💼</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">💻</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🎨</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">📚</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🍳</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🌟</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🚀</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🎭</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🏆</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🎵</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🎬</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">⚽</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">💼</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">💻</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🎨</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">📚</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🍳</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🌟</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🚀</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🎭</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity duration-300">🏆</div>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="bg-emerald-500/20 p-5 rounded-2xl mb-6 backdrop-blur-sm hover:bg-emerald-500/30 transition-all duration-500 group">
              <MessageCircle className="h-14 w-14 text-emerald-300 mx-auto group-hover:text-white transition-colors duration-300" />
            </div>
            <h2 className="text-4xl font-bold mb-3 text-white">
              IAmigo
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Seu companheiro inteligente que se adapta às suas necessidades
            </p>
          </div>
          
          {/* Interactive Features Grid */}
          <div className="space-y-4">
            <div className="group bg-slate-800/50 p-5 rounded-xl backdrop-blur-sm hover:bg-emerald-800/30 transition-all duration-300 border border-slate-600/30 hover:border-emerald-500/50">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-500/20 p-3 rounded-lg group-hover:bg-emerald-500/30 transition-all duration-300">
                  <Brain className="h-6 w-6 text-emerald-300 group-hover:text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1 text-white">Inteligência Adaptativa</h3>
                  <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Aprende com você e evolui constantemente</p>
                </div>
              </div>
            </div>
            
            <div className="group bg-slate-800/50 p-5 rounded-xl backdrop-blur-sm hover:bg-emerald-800/30 transition-all duration-300 border border-slate-600/30 hover:border-emerald-500/50">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-500/20 p-3 rounded-lg group-hover:bg-emerald-500/30 transition-all duration-300">
                  <Users className="h-6 w-6 text-emerald-300 group-hover:text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1 text-white">Múltiplas Personalidades</h3>
                  <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Amigo, mentor, consultor... você escolhe!</p>
                </div>
              </div>
            </div>
            
            <div className="group bg-slate-800/50 p-5 rounded-xl backdrop-blur-sm hover:bg-emerald-800/30 transition-all duration-300 border border-slate-600/30 hover:border-emerald-500/50">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-500/20 p-3 rounded-lg group-hover:bg-emerald-500/30 transition-all duration-300">
                  <Zap className="h-6 w-6 text-emerald-300 group-hover:text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1 text-white">Respostas Instantâneas</h3>
                  <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Conversas fluidas e naturais em tempo real</p>
                </div>
              </div>
            </div>
            
            <div className="group bg-slate-800/50 p-5 rounded-xl backdrop-blur-sm hover:bg-emerald-800/30 transition-all duration-300 border border-slate-600/30 hover:border-emerald-500/50">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-500/20 p-3 rounded-lg group-hover:bg-emerald-500/30 transition-all duration-300">
                  <Shield className="h-6 w-6 text-emerald-300 group-hover:text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-1 text-white">Privacidade Total</h3>
                  <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">Suas conversas são 100% seguras e privadas</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Elegant Call-to-Action */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 p-4 rounded-xl backdrop-blur-sm border border-emerald-500/30">
              <p className="text-emerald-200 text-base font-medium">
                Pronto para começar?
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Faça login e descubra o futuro das conversas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
