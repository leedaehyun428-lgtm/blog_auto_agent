import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

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

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin },
    });
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
