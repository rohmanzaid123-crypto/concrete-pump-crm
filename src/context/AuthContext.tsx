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

const STORAGE_ACTIVE_USER = 'cpms_active_session_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session
  useEffect(() => {
    async function initSession() {
      setIsLoading(true);
      const client = getSupabaseClient();

      if (client) {
        try {
          const { data: { session } } = await client.auth.getSession();
          if (session?.user) {
            // Fetch profile from supabase
            const { data: profileData } = await client
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileData) {
              setUser(profileData as Profile);
              setIsLoading(false);
              return;
            } else {
              // Construct profile from user metadata
              const role = (session.user.user_metadata?.role as UserRole) || 'admin';
              const newProfile: Profile = {
                id: session.user.id,
                email: session.user.email || 'user@cpms.id',
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User CPMS',
                role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              setUser(newProfile);
              setIsLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase auth session check failed, using stored local session:', err);
        }
      }

      // Check localStorage for persisted demo/local user session
      const stored = localStorage.getItem(STORAGE_ACTIVE_USER);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Profile;
          setUser(parsed);
        } catch {
          localStorage.removeItem(STORAGE_ACTIVE_USER);
        }
      } else {
        // Default seed: Log in as Owner initially so user lands immediately in functional app
        const defaultOwner: Profile = {
          id: 'cpms-owner-root',
          email: 'owner@cpms.id',
          full_name: 'Ir. H. Sudirman (Owner)',
          role: 'owner',
          phone_number: '+62 811-2345-6789',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        };
        setUser(defaultOwner);
        localStorage.setItem(STORAGE_ACTIVE_USER, JSON.stringify(defaultOwner));
      }

      setIsLoading(false);
    }

    initSession();

    // Listen to Supabase auth changes if client is available
    const client = getSupabaseClient();
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data } = await client.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          if (data) {
            setUser(data as Profile);
            localStorage.setItem(STORAGE_ACTIVE_USER, JSON.stringify(data));
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(STORAGE_ACTIVE_USER);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const client = getSupabaseClient();

    // Attempt Supabase Auth first if configured
    if (client && password) {
      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.warn('Supabase auth signIn error:', error.message);
          // If real supabase fails, but user wants to login with demo credentials, fallback smoothly
          if (!email.includes('@cpms.id')) {
            setIsLoading(false);
            return { success: false, error: error.message };
          }
        } else if (data.user) {
          const { data: profile } = await client.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
          const targetRole = profile?.role || (data.user.user_metadata?.role as UserRole) || 'admin';
          const finalProfile: Profile = profile || {
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: targetRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          setUser(finalProfile);
          localStorage.setItem(STORAGE_ACTIVE_USER, JSON.stringify(finalProfile));

          await recordAuditLog({
            user_id: finalProfile.id,
            user_email: finalProfile.email,
            user_role: finalProfile.role,
            action: 'AUTH_LOGIN',
            entity_type: 'auth',
            details: { method: 'supabase_auth' },
          });

          setIsLoading(false);
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase auth error:', err);
      }
    }

    // Standard business accounts login (Owner / Admin)
    const normalizedEmail = email.trim().toLowerCase();
    const isOwner = normalizedEmail.includes('owner') || normalizedEmail === 'owner@cpms.id';
    const role: UserRole = isOwner ? 'owner' : 'admin';
    const fullName = isOwner ? 'Ir. H. Sudirman (Owner)' : 'Budi Santoso (Admin Operasional)';

    const profile: Profile = {
      id: isOwner ? 'cpms-owner-root' : 'cpms-admin-op',
      email: normalizedEmail,
      full_name: fullName,
      role,
      phone_number: isOwner ? '+62 811-2345-6789' : '+62 812-9876-5432',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUser(profile);
    localStorage.setItem(STORAGE_ACTIVE_USER, JSON.stringify(profile));

    await recordAuditLog({
      user_id: profile.id,
      user_email: profile.email,
      user_role: profile.role,
      action: 'AUTH_LOGIN',
      entity_type: 'auth',
      details: { role: profile.role, method: 'direct_access' },
    });

    setIsLoading(false);
    return { success: true };
  };

  const logout = async (): Promise<void> => {
    if (user) {
      await recordAuditLog({
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        action: 'AUTH_LOGOUT',
        entity_type: 'auth',
      });
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }

    setUser(null);
    localStorage.removeItem(STORAGE_ACTIVE_USER);
  };

  const switchRole = async (newRole: UserRole): Promise<void> => {
    if (!user) return;
    const updatedUser: Profile = {
      ...user,
      role: newRole,
      full_name: newRole === 'owner' ? 'Ir. H. Sudirman (Owner)' : 'Budi Santoso (Admin Operasional)',
      updated_at: new Date().toISOString(),
    };

    setUser(updatedUser);
    localStorage.setItem(STORAGE_ACTIVE_USER, JSON.stringify(updatedUser));

    await recordAuditLog({
      user_id: updatedUser.id,
      user_email: updatedUser.email,
      user_role: newRole,
      action: 'SWITCH_ROLE',
      entity_type: 'profiles',
      details: { previous_role: user.role, new_role: newRole },
    });
  };

  const updateUserProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user) return;
    const updatedUser: Profile = {
      ...user,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('profiles').update(updates).eq('id', user.id);
      } catch (err) {
        console.warn('Supabase update profile error:', err);
      }
    }

    setUser(updatedUser);
    localStorage.setItem(STORAGE_ACTIVE_USER, JSON.stringify(updatedUser));

    await recordAuditLog({
      user_id: updatedUser.id,
      user_email: updatedUser.email,
      user_role: updatedUser.role,
      action: 'UPDATE_PROFILE',
      entity_type: 'profiles',
      details: { fields: Object.keys(updates) },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'admin',
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
