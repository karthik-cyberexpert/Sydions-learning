'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FiUsers, FiAward } from 'react-icons/fi'

interface RecentUser {
  id: string
  username: string
  created_at: string
}

interface ChallengeEngagement {
  id: string
  title: string
  submissions_count: number
}

// Define raw data structure for challenge engagement
interface RawChallengeData {
  id: string
  title: string
  submissions: [{ count: number }] | null
}

export default function AdminReports() {
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [challengeEngagement, setChallengeEngagement] = useState<ChallengeEngagement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Fetch recent users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, username, created_at')
          .order('created_at', { ascending: false })
          .limit(10)
        if (usersError) throw usersError
        setRecentUsers(usersData as RecentUser[] || [])

        // Fetch challenge engagement
        const { data: challengesData, error: challengesError } = await supabase
          .from('challenges')
          .select('id, title, submissions(count)')
        if (challengesError) throw challengesError
        
        const engagementData: ChallengeEngagement[] = (challengesData as RawChallengeData[] || []).map((c) => ({
          id: c.id,
          title: c.title,
          submissions_count: c.submissions?.[0]?.count || 0,
        })).sort((a, b) => b.submissions_count - a.submissions_count)
        
        setChallengeEngagement(engagementData)

      } catch (error) {
        console.error('Error fetching reports:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Reports
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Key metrics and activity on the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Signups */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <FiUsers className="mr-3" /> Recent Signups
          </h3>
          <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
            {recentUsers.map(user => (
              <li key={user.id} className="py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.username}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(user.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Challenge Engagement */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <FiAward className="mr-3" /> Challenge Engagement
          </h3>
          <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
            {challengeEngagement.slice(0, 10).map(challenge => (
              <li key={challenge.id} className="py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-4">{challenge.title}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{challenge.submissions_count} submissions</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}