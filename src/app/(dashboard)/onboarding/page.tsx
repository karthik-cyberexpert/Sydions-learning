'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'

export default function OnboardingPage() {
  const { user, loading, profileLoading } = useAuth()
  const router = useRouter()
  
  const [username, setUsername] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced check for username availability
  const checkAvailability = useCallback(async (name: string) => {
    if (name.length < 3) {
      setIsAvailable(null)
      return
    }
    
    setCheckLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.rpc('check_username_availability', {
        p_username: name,
        p_user_id: user?.id || '00000000-0000-0000-0000-000000000000'
      })
      
      if (error) throw error
      
      setIsAvailable(data)
    } catch (err: unknown) {
      console.error('Error checking username:', err)
      setError('Failed to check username availability.')
      setIsAvailable(false)
    } finally {
      setCheckLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (username) {
        checkAvailability(username)
      } else {
        setIsAvailable(null)
      }
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [username, checkAvailability])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim().toLowerCase();
    setUsername(value);
    setIsAvailable(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !username || !isAvailable) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      if (username.length < 3) throw new Error('Username must be at least 3 characters.')
      if (!isAvailable) throw new Error('Username is already taken or invalid.')

      const { error } = await supabase
        .from('profiles')
        .update({
          username: username,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      
      if (error) throw error
      
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }
  
  // If user is already onboarded, AuthContext should redirect them, but we handle the edge case here too.
  if (user && !profileLoading && window.location.pathname !== '/onboarding') {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 shadow-xl rounded-lg"
      >
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome to Sydions!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Let's set up your unique username to get started.
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0"><FiAlertCircle className="h-5 w-5 text-red-400" /></div>
              <div className="ml-3"><h3 className="text-sm font-medium text-red-800">{error}</h3></div>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Choose a Username
            </label>
            <div className="mt-1 relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                value={username}
                onChange={handleUsernameChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
                placeholder="e.g. code_master_99"
                disabled={isSaving}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {checkLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                ) : isAvailable === true ? (
                  <FiCheckCircle className="h-5 w-5 text-green-500" />
                ) : isAvailable === false ? (
                  <FiXCircle className="h-5 w-5 text-red-500" />
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Your username must be unique and at least 3 characters long.
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSaving || !isAvailable || username.length < 3}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}