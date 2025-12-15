import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for admin login first
    const adminToken = localStorage.getItem('admin-token');
    if (adminToken === 'admin-logged-in') {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'admin',
        user_metadata: { full_name: 'Admin User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User;

      setUser(mockUser);
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    // Set up auth state listener for Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAdmin(false);
        setLoading(false);
      }
    );

    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAdmin(false);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    // Allow admin/admin login for testing
    if (email === 'admin' && password === 'admin') {
      try {
        // Create a mock user for admin
        const mockUser = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'admin',
          user_metadata: { full_name: 'Admin User' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User;

        // Set admin state
        setUser(mockUser);
        setIsAdmin(true);
        setSession(null); // No Supabase session for admin

        // Store admin login in localStorage
        localStorage.setItem('admin-token', 'admin-logged-in');
        localStorage.setItem('admin-user', JSON.stringify(mockUser));

        console.log('Admin login successful');
        return { error: null };
      } catch (error) {
        console.error('Admin login error:', error);
        return { error: error as Error };
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (isAdmin) {
      // Clear admin session
      localStorage.removeItem('admin-token');
      localStorage.removeItem('admin-user');
      setUser(null);
      setIsAdmin(false);
      setSession(null);
    } else {
      // Clear Supabase session
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
