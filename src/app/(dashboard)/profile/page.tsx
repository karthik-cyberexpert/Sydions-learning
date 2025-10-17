'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiUser, FiAward, FiSettings, FiGithub, FiLinkedin, FiGlobe, FiTrendingUp, FiAlertCircle } from 'react-icons/fi'
import { getRankFromLevel, getRankBadge } from '@/lib/utils'
import Link from 'next/link'

interface Profile {
  id: string
  username: string
  email: string
  xp: number
  coins: number
  rank: string
  github_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  created_at: string
  level: number
  banner_url: string | null
  avatar_url: string | null
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles_with_level')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) throw profileError
      
      const rank = getRankFromLevel(profileData.level)
      setProfile({ ...profileData, rank })

    } catch (err: any) {
      console.error('Error fetching profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  if (!profile) return <div className="text-center py-12"><FiUser className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Profile not found</h3></div>

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error: {error}</h3>
            </div>
          </div>
        </div>
      )}
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className={`h-32 bg-gradient-to-r from-indigo-500 to-purple-500 ${profile.banner_url ? 'bg-cover bg-center' : ''}`} style={{ backgroundImage: `url(${profile.banner_url})` }}></div>
        <div className="px-4 py-5 sm:px-6 -mt-16 sm:-mt-20">
          <div className="flex items-end space-x-5">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 ring-4 ring-white dark:ring-gray-800 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-gray-600">{profile.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="pb-4 sm:pb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{profile.rank} {getRankBadge(profile.rank)}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 flex justify-between items-center">
          <div className="flex space-x-4">
            {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500"><FiGithub className="h-6 w-6" /></a>}
            {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500"><FiLinkedin className="h-6 w-6" /></a>}
            {profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500"><FiGlobe className="h-6 w-6" /></a>}
          </div>
          <Link href="/settings" className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
            <FiSettings className="mr-2" /> Go to Settings
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center"><FiAward className="h-6 w-6 text-indigo-500 mr-3" /><dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Rank</dt></div>
          <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{profile.rank}</dd>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center"><FiTrendingUp className="h-6 w-6 text-green-500 mr-3" /><dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total XP</dt></div>
          <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{profile.xp}</dd>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center"><FiAward className="h-6 w-6 text-yellow-500 mr-3" /><dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Coins</dt></div>
          <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{profile.coins}</dd>
        </motion.div>
      </div>
    </div>
  )
}