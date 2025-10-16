'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiAward, FiUsers, FiUser, FiTrendingUp } from 'react-icons/fi'

interface LeaderboardUser {
  id: string
  username: string
  xp: number
  rank: string
  submissions_count: number
}

interface Guild {
  id: string
  name: string
  points: number
  members_count: number
}

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('individual')

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // Fetch top users by XP
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, xp, rank')
          .order('xp', { ascending: false })
          .limit(50)
        
        if (usersError) throw usersError
        
        // Add submission counts to users
        const usersWithSubmissions = await Promise.all(
          (usersData || []).map(async (user) => {
            const { count, error } = await supabase
              .from('submissions')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
            
            return {
              ...user,
              submissions_count: count || 0
            }
          })
        )
        
        setUsers(usersWithSubmissions)
        
        // Fetch top guilds by points
        const { data: guildsData, error: guildsError } = await supabase
          .from('guilds')
          .select('id, name, points')
          .order('points', { ascending: false })
          .limit(20)
        
        if (guildsError) throw guildsError
        
        // Add member counts to guilds
        const guildsWithMembers = await Promise.all(
          (guildsData || []).map(async (guild) => {
            const { count, error } = await supabase
              .from('guild_members')
              .select('*', { count: 'exact', head: true })
              .eq('guild_id', guild.id)
            
            return {
              ...guild,
              members_count: count || 0
            }
          })
        )
        
        setGuilds(guildsWithMembers)
      } catch (error) {
        console.error('Error fetching leaderboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchLeaderboardData()
  }, [])

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case 'Rookie':
        return '🥉'
      case 'Apprentice':
        return '🥈'
      case 'Developer':
        return '🥇'
      case 'Master Dev':
        return '🧠'
      case 'Legend':
        return '👑'
      default:
        return '👤'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          See how you rank against other developers in the community
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('individual')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'individual'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FiUser className="mr-2" />
              Individual
            </div>
          </button>
          <button
            onClick={() => setActiveTab('guilds')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'guilds'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FiUsers className="mr-2" />
              Guilds
            </div>
          </button>
        </nav>
      </div>

      {/* Individual Leaderboard */}
      {activeTab === 'individual' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md"
        >
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user, index) => (
              <li key={user.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="text-xl">{getRankBadge(user.rank)}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.rank}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.xp} XP
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.submissions_count} submissions
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <FiTrendingUp className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Guilds Leaderboard */}
      {activeTab === 'guilds' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md"
        >
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {guilds.map((guild, index) => (
              <li key={guild.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {guild.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {guild.members_count} members
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {guild.points} points
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <FiAward className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}