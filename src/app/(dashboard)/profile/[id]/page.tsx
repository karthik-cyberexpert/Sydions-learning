'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import { FiUser, FiAward, FiTrendingUp, FiGithub, FiLinkedin, FiGlobe, FiUserPlus, FiClock, FiCheck, FiMessageSquare } from 'react-icons/fi'
import { getRankFromLevel, getRankBadge } from '@/lib/utils'
import { motion } from 'framer-motion'

type Profile = {
  id: string
  username: string
  xp: number
  coins: number
  github_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  created_at: string
  level: number
  rank: string
  banner_url: string | null
  avatar_url: string | null
}

type FriendshipStatus = 'not_friends' | 'request_sent' | 'request_received' | 'friends' | 'own_profile'

export default function PublicProfilePage() {
  const { user: currentUser } = useAuth()
  const { id } = useParams()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('not_friends')

  const fetchProfileData = useCallback(async () => {
    if (!id) return
    if (currentUser && id === currentUser.id) {
      router.push('/profile')
      return
    }

    setLoading(true)
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles_with_level')
        .select('*')
        .eq('id', id)
        .single()

      if (profileError) throw profileError
      
      const rank = getRankFromLevel(profileData.level)
      setProfile({ ...profileData, rank })

      if (currentUser) {
        const { data: requestData } = await supabase
          .from('friend_requests')
          .select('status, sender_id')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${currentUser.id})`)
          .single()

        if (requestData) {
          if (requestData.status === 'accepted') setFriendshipStatus('friends')
          else if (requestData.sender_id === currentUser.id) setFriendshipStatus('request_sent')
          else setFriendshipStatus('request_received')
        } else {
          setFriendshipStatus('not_friends')
        }
      }
    } catch (error) {
      console.error('Error fetching public profile:', error)
    } finally {
      setLoading(false)
    }
  }, [id, currentUser, router])

  useEffect(() => {
    fetchProfileData()
  }, [fetchProfileData])

  const handleFriendAction = async () => {
    if (!currentUser) return router.push('/sign-in')

    if (friendshipStatus === 'not_friends') {
      const { error } = await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: id })
      if (!error) setFriendshipStatus('request_sent')
    } else if (friendshipStatus === 'request_received') {
      router.push('/friends')
    }
  }

  const renderFriendButton = () => {
    switch (friendshipStatus) {
      case 'friends':
        return <button disabled className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-200"><FiCheck className="mr-2" /> Friends</button>
      case 'request_sent':
        return <button disabled className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300"><FiClock className="mr-2" /> Request Sent</button>
      case 'request_received':
        return <button onClick={handleFriendAction} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600">Respond to Request</button>
      default:
        return <button onClick={handleFriendAction} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"><FiUserPlus className="mr-2" /> Add Friend</button>
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  if (!profile) return <div className="text-center py-12"><FiUser className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">User not found</h3></div>

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className={`h-32 bg-gradient-to-r from-indigo-500 to-purple-500 ${profile.banner_url ? 'bg-cover bg-center' : ''}`} style={{ backgroundImage: `url(${profile.banner_url})` }}></div>
        <div className="px-4 py-5 sm:px-6 -mt-16 sm:-mt-20">
          <div className="flex items-end space-x-5">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 ring-4 ring-white dark:ring-gray-800 flex items-center justify-center">
              <span className="text-5xl font-bold text-gray-600">{profile.username?.charAt(0).toUpperCase()}</span>
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
          <div className="flex space-x-2">
            {renderFriendButton()}
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"><FiMessageSquare className="mr-2" /> Message</button>
          </div>
        </div>
      </div>

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