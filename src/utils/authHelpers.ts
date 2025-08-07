
import { supabase } from "@/integrations/supabase/client";

export const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const handleAuthError = (error: any): string => {
  if (error?.message?.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos';
  }
  if (error?.message?.includes('email_address_invalid')) {
    return 'E-mail inválido';
  }
  if (error?.message?.includes('password_too_short')) {
    return 'A senha deve ter pelo menos 6 caracteres';
  }
  if (error?.message?.includes('signup_disabled')) {
    return 'Cadastro temporariamente desabilitado';
  }
  if (error?.message?.includes('email_address_not_authorized')) {
    return 'Este e-mail não está autorizado';
  }
  
  return error?.message || 'Erro desconhecido';
};
