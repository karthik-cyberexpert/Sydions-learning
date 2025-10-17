'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
  profileLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
      
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session)
          setUser(session?.user || null)
          setLoading(false)
        }
      )
      
      return () => {
        subscription.unsubscribe()
      }
    }
    
    getSession()
  }, [])
  
  // Check onboarding status and redirect
  useEffect(() => {
    const checkOnboarding = async () => {
      if (loading) return;
      
      if (user) {
        setProfileLoading(true);
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', user.id)
            .single();
            
          if (error && error.code !== 'PGRST116') throw error; // Ignore 'no rows found' error if profile creation is async
          
          if (!profile || !profile.onboarding_complete) {
            // Redirect to onboarding if profile is missing or onboarding is incomplete
            if (window.location.pathname !== '/onboarding') {
              router.push('/onboarding');
            }
          } else if (window.location.pathname === '/onboarding') {
            // Redirect away from onboarding if complete
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
      }
    };
    
    checkOnboarding();
  }, [user, loading, router]);


  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    setSession(data.session)
    setUser(data.user)
  }

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })
    
    if (error) throw error
    if (data.session) {
      setSession(data.session)
      setUser(data.user)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const value = {
    user,
    session,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    loading,
    profileLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {(!loading && !profileLoading) ? children : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}