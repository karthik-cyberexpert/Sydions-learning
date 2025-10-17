'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiCalendar, FiClock, FiUsers, FiUser, FiShield, FiStar } from 'react-icons/fi'
import Link from 'next/link'

interface Challenge {
  id: string
  title: string
  description: string
  type: 'solo' | 'tag-team' | 'guild'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  deadline: string
  max_points: number
  max_team_size: number
  created_at: string
  status: 'Upcoming' | 'Voting' | 'Completed'
}

export default function Challenges() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('deadline')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchChallengesAndAdminStatus = async () => {
      try {
        // Check admin status
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()
          if (profileError) throw profileError
          setIsAdmin(profile?.is_admin || false)
        }

        // Fetch challenges
        let query = supabase
          .from('challenges')
          .select('*')
        
        if (filter !== 'all') {
          query = query.eq('type', filter)
        }
        
        if (sortBy === 'deadline') {
          query = query.order('deadline', { ascending: true })
        } else if (sortBy === 'created') {
          query = query.order('created_at', { ascending: false })
        }
        
        const { data, error } = await query
        
        if (error) throw error
        setChallenges(data || [])
      } catch (error) {
        console.error('Error fetching challenges:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchChallengesAndAdminStatus()
  }, [filter, sortBy, user])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'solo':
        return <FiUser className="h-4 w-4" />
      case 'tag-team':
        return <FiUsers className="h-4 w-4" />
      case 'guild':
        return <FiShield className="h-4 w-4" />
      default:
        return <FiUser className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Voting':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'Completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTimeRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const now = new Date()
    const diff = deadlineDate.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h`
    } else {
      return `${hours}h`
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Coding Challenges
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Participate in challenges to earn XP and climb the leaderboard
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link
              href="/challenges/create"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Challenge
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="solo">Solo</option>
            <option value="tag-team">Tag-Team</option>
            <option value="guild">Guild</option>
          </select>
        </div>
        <div className="relative">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="created">Sort by Created</option>
          </select>
        </div>
      </div>

      {/* Challenges Grid */}
      {challenges.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {getTypeIcon(challenge.type)}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {challenge.title}
                      </h3>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
                    {challenge.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {challenge.description.substring(0, 100)}...
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {challenge.max_points} pts
                  </span>
                  {challenge.type === 'tag-team' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      Max {challenge.max_team_size} members
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <FiCalendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span>
                      {new Date(challenge.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <FiClock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    <span>
                      {getTimeRemaining(challenge.deadline)}
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href={`/challenges/${challenge.id}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <FiStar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No challenges found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Check back later for new challenges or create your own.
          </p>
        </div>
      )}
    </div>
  )
}