import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, UserRole } from '../types/database';
import { getSupabaseClient, recordAuditLog } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async (userId: string): Promise<Profile> => {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase belum dikonfigurasi.');
    const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw new Error('Gagal memuat profil akun dari database.');
    if (!data || (data.role !== 'owner' && data.role !== 'admin')) {
      throw new Error('Akun belum memiliki profil CPMS atau peran yang sah. Hubungi owner.');
    }
    return data as Profile;
  };

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    let mounted = true;
    const initialize = async () => {
      try {
        const { data: { session }, error } = await client.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          const profile = await loadProfile(session.user.id);
          if (mounted) setUser(profile);
        } else if (mounted) setUser(null);
      } catch (error) {
        console.error('CPMS session initialization failed:', error);
        await client.auth.signOut();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void initialize();
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        void loadProfile(session.user.id).then(profile => {
          if (mounted) setUser(profile);
        }).catch(error => {
          console.error('CPMS profile validation failed:', error);
          void client.auth.signOut();
          if (mounted) setUser(null);
        }).finally(() => {
          if (mounted) setIsLoading(false);
        });
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const client = getSupabaseClient();
    if (!client) {
      setIsLoading(false);
      return { success: false, error: 'Supabase belum dikonfigurasi. Login demo/lokal dinonaktifkan demi keamanan.' };
    }
    if (!email.trim() || !password) {
      setIsLoading(false);
      return { success: false, error: 'Email dan password wajib diisi.' };
    }
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password,
      });
      if (error || !data.user) throw new Error('Email atau password salah.');
      const profile = await loadProfile(data.user.id);
      setUser(profile);
      await recordAuditLog({
        user_id: profile.id, user_email: profile.email, user_role: profile.role,
        action: 'AUTH_LOGIN', entity_type: 'auth', details: { method: 'supabase_auth' },
      });
      return { success: true };
    } catch (error) {
      await client.auth.signOut();
      setUser(null);
      return { success: false, error: error instanceof Error ? error.message : 'Login gagal.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const client = getSupabaseClient();
    if (user) {
      await recordAuditLog({
        user_id: user.id, user_email: user.email, user_role: user.role,
        action: 'AUTH_LOGOUT', entity_type: 'auth',
      });
    }
    if (client) await client.auth.signOut();
    setUser(null);
  };

  const switchRole = async (_newRole: UserRole): Promise<void> => {
    console.warn('Perubahan peran hanya dapat dilakukan oleh owner melalui pengaturan akun.');
  };

  const updateUserProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user) throw new Error('Sesi login tidak ditemukan.');
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase belum terhubung.');
    const safeUpdates: Partial<Profile> = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.email;
    delete safeUpdates.role;
    delete safeUpdates.created_at;
    const { data, error } = await client.from('profiles')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', user.id).select('*').single();
    if (error || !data) throw new Error('Profil gagal disimpan ke database.');
    setUser(data as Profile);
  };

  return (
    <AuthContext.Provider value={{
      user, role: user?.role || 'admin', isAuthenticated: !!user, isLoading,
      login, logout, switchRole, updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
