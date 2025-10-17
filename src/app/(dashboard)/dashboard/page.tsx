'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiCalendar, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi'
import { getRankFromLevel } from '@/lib/utils'

interface Challenge {
  id: string
  title: string
  description: string
  type: 'solo' | 'tag-team' | 'guild'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  deadline: string
  max_points: number
  created_at: string
  status: 'Upcoming' | 'Voting' | 'Completed'
}

interface Stats {
  active_challenges: number
  total_submissions: number
  rank: string
  xp: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        // Fetch active challenges
        const { data: challengesData, error: challengesError } = await supabase
          .from('challenges')
          .select('*')
          .eq('status', 'Upcoming')
          .order('deadline', { ascending: true })
          .limit(5)
        
        if (challengesError) throw challengesError
        
        // Fetch user stats
        const { data: profileData, error: profileError } = await supabase
          .from('profiles_with_level')
          .select('xp, level')
          .eq('id', user.id)
          .single()
        
        if (profileError) throw profileError
        
        // Fetch submission count
        const { count: submissionsCount, error: submissionsError } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        if (submissionsError) throw submissionsError
        
        const rank = getRankFromLevel(profileData?.level)
        
        setChallenges(challengesData || [])
        setStats({
          active_challenges: challengesData?.length || 0,
          total_submissions: submissionsCount || 0,
          rank: rank,
          xp: profileData?.xp || 0
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user])

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
          Welcome back, {user?.email?.split('@')[0] || 'Developer'}!
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here&apos;s what&apos;s happening with your challenges today.
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 rounded-md p-3">
                  <FiCalendar className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Active Challenges
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats.active_challenges}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-md p-3">
                  <FiUsers className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Submissions
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats.total_submissions}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900 rounded-md p-3">
                  <FiAward className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Your Rank
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats.rank}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-md p-3">
                  <FiTrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total XP
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats.xp}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Active Challenges */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Active Challenges
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upcoming deadlines for challenges you can participate in
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {challenges.length > 0 ? (
              challenges.map((challenge) => (
                <li key={challenge.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                        {challenge.title}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {challenge.type}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {challenge.description.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                        <FiCalendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        <p>
                          Deadline: {new Date(challenge.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No active challenges at the moment. Check back later!
                </p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}