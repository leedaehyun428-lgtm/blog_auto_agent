import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export const LOGIN_SUCCESS_TOAST_PENDING_KEY = 'briter_login_success_toast_pending';

export function useAuth(onAfterLogout?: () => void) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        setIsAuthLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithProvider = async (provider: 'google' | 'kakao') => {
    sessionStorage.setItem(LOGIN_SUCCESS_TOAST_PENDING_KEY, '1');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      sessionStorage.removeItem(LOGIN_SUCCESS_TOAST_PENDING_KEY);
      throw error;
    }
  };

  const handleLogin = async () => {
    await signInWithProvider('google');
  };

  const handleKakaoLogin = async () => {
    await signInWithProvider('kakao');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    onAfterLogout?.();
  };

  return {
    user,
    isAuthLoading,
    handleLogin,
    handleKakaoLogin,
    handleLogout,
  };
}
