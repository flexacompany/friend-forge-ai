import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { User as SupabaseUser } from '@supabase/supabase-js';

const UserSettings = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setNewEmail(user.email || '');
      } else {
        navigate('/auth');
      }
    };
    
    // Verificar se há parâmetros de confirmação de e-mail na URL
    const checkEmailConfirmation = async () => {
      const token = searchParams.get('token');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const email = searchParams.get('email'); // Novo e-mail
      

      
      if ((token || tokenHash) && type === 'email_change') {
        try {
          let verifyResult;
          
          if (tokenHash) {
            // Usar token_hash para confirmação via link
            verifyResult = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'email_change'
            });
          } else if (token && email) {
            // Usar token (OTP) com e-mail para confirmação via código
            verifyResult = await supabase.auth.verifyOtp({
              token: token,
              type: 'email_change',
              email: email
            });
          } else {
            throw new Error('Parâmetros de confirmação inválidos');
          }
          
          const { data, error } = verifyResult;
          
          if (error) {
            throw error;
          }
          
          // Recarregar dados do usuário
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUser(user);
            setNewEmail(user.email || '');
          }
          
          toast.success('E-mail alterado com sucesso!');
          
          // Limpar parâmetros da URL
          window.history.replaceState({}, document.title, '/settings');
        } catch (error) {
          console.error('Erro ao confirmar alteração de e-mail:', error);
          toast.error(`Erro ao confirmar alteração de e-mail: ${error.message || 'Erro desconhecido'}`);
        }
      }
    };
    
    getUser();
    checkEmailConfirmation();

    // Listener para eventos de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          // Recarregar dados do usuário
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUser(user);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || newEmail === user?.email) {
      toast.error('Digite um novo e-mail válido');
      return;
    }

    setIsLoadingEmail(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      }, {
        emailRedirectTo: `${window.location.origin}/settings`
      });

      if (error) {
        throw error;
      }

      toast.success('E-mail de confirmação enviado! Verifique sua nova caixa de entrada para confirmar a alteração.');
    } catch (error: unknown) {
      console.error('Erro ao alterar e-mail:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao alterar e-mail';
      toast.error(errorMessage);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error('Digite sua senha atual');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoadingPassword(true);

    try {
      // Primeiro, verificar a senha atual fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Senha atual incorreta');
      }

      // Se o login foi bem-sucedido, atualizar a senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      console.error('Erro ao alterar senha:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao alterar senha';
      toast.error(errorMessage);
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Logout realizado com sucesso!');
      navigate('/auth');
    } catch (error: unknown) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <User className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/95 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/chat')}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-200 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-3 rounded-xl shadow-lg">
                <User className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">Configurações da Conta</h1>
                <p className="text-sm text-slate-400">Gerencie suas informações pessoais</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="space-y-6">
          {/* Informações da Conta */}
          <Card className="bg-slate-800/50 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <User className="h-5 w-5 text-emerald-400" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-slate-300">
                  E-mail atual
                </Label>
                <p className="text-slate-100 font-medium">{user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-300">
                  Conta criada em
                </Label>
                <p className="text-slate-400">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alterar E-mail */}
          <Card className="bg-slate-800/50 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Mail className="h-5 w-5 text-emerald-400" />
                Alterar E-mail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div>
                  <Label htmlFor="newEmail" className="text-sm font-semibold text-slate-300">
                    Novo E-mail
                  </Label>
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="Digite seu novo e-mail"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="mt-2 h-12 text-base bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                  />
                </div>
                <div className="text-sm text-slate-300 bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                  <p className="font-medium mb-1 text-amber-400">⚠️ Como funciona a alteração de e-mail:</p>
                  <p className="mb-2">Você receberá dois e-mails de confirmação:</p>
                  <ul className="list-disc list-inside space-y-1 mb-2">
                    <li><strong>E-mail antigo:</strong> Clique no link para confirmar a alteração</li>
                    <li><strong>E-mail novo:</strong> Apenas para informação</li>
                  </ul>
                  <p className="font-medium text-amber-300">⚠️ A troca só será efetivada após clicar no link do e-mail antigo.</p>
                </div>
                <Button
                  type="submit"
                  disabled={isLoadingEmail}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl transition-all duration-200"
                >
                  {isLoadingEmail ? 'Enviando...' : 'Alterar E-mail'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Alterar Senha */}
          <Card className="bg-slate-800/50 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Lock className="h-5 w-5 text-emerald-400" />
                Alterar Senha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-sm font-semibold text-slate-300">
                    Senha Atual
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Digite sua senha atual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="h-12 text-base bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-sm font-semibold text-slate-300">
                    Nova Senha
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Digite sua nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 text-base bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-300">
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 text-base bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoadingPassword}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 rounded-xl transition-all duration-200"
                >
                  {isLoadingPassword ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Ações da Conta */}
          <Card className="bg-slate-800/50 border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-100">Ações da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4 bg-slate-700" />
              <Button
                onClick={handleSignOut}
                className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl transition-all duration-200"
              >
                Sair da Conta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;