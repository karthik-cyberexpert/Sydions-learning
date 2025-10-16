'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { FiCalendar, FiClock, FiUsers, FiUser, FiShield, FiStar, FiAlertCircle } from 'react-icons/fi'
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

interface Submission {
  id: string
  project_url: string
  description: string
  user: {
    username: string
  }
  team: {
    name: string
  } | null
  guild: {
    name: string
  } | null
  votes_count: number
}

export default function ChallengeDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userSubmission, setUserSubmission] = useState<any>(null)

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!id) return
      
      try {
        // Fetch challenge details
        const { data: challengeData, error: challengeError } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', id)
          .single()
        
        if (challengeError) throw challengeError
        setChallenge(challengeData)
        
        // Fetch submissions for this challenge
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select(`
            id,
            project_url,
            description,
            user:profiles!user_id(username),
            team:tag_teams(name),
            guild:guilds(name),
            votes_count
          `)
          .eq('challenge_id', id)
        
        if (submissionsError) throw submissionsError
        
        // Transform the data to match our Submission interface
        const transformedData = (submissionsData || []).map((submission: any) => ({
          ...submission,
          user: submission.user || { username: 'Unknown' },
          team: submission.team?.[0] || null,
          guild: submission.guild?.[0] || null
        }))
        
        setSubmissions(transformedData)
        
        // Check if user has submitted
        if (user) {
          const { data: userSubmissionData, error: userSubmissionError } = await supabase
            .from('submissions')
            .select('*')
            .eq('challenge_id', id)
            .eq('user_id', user.id)
            .single()
          
          if (!userSubmissionError && userSubmissionData) {
            setUserSubmission(userSubmissionData)
          }
        }
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchChallenge()
  }, [id, user])

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

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading challenge</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Challenge not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The challenge you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <Link
            href="/challenges"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Challenges
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {challenge.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Participate in this challenge to earn XP and climb the leaderboard
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Challenge Details
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Information about this challenge
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
                {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Description
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {challenge.description}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Type
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  {challenge.type === 'solo' && <FiUser className="mr-2" />}
                  {challenge.type === 'tag-team' && <FiUsers className="mr-2" />}
                  {challenge.type === 'guild' && <FiShield className="mr-2" />}
                  {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)}
                </div>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Difficulty
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                </span>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Deadline
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  <FiCalendar className="mr-2" />
                  {new Date(challenge.deadline).toLocaleString()}
                </div>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Time Remaining
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  <FiClock className="mr-2" />
                  {getTimeRemaining(challenge.deadline)}
                </div>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Max Points
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {challenge.max_points} points
              </dd>
            </div>
            {challenge.type === 'tag-team' && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Max Team Size
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {challenge.max_team_size} members
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!userSubmission ? (
          <Link
            href={`/challenges/${challenge.id}/submit`}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit Project
          </Link>
        ) : (
          <div className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Project Submitted
          </div>
        )}
        {challenge.status === 'Voting' && (
          <Link
            href={`/challenges/${challenge.id}/vote`}
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Vote on Projects
          </Link>
        )}
      </div>

      {/* Submissions */}
      {submissions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Submissions ({submissions.length})
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Projects submitted for this challenge
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {submissions.map((submission) => (
                <li key={submission.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                        {submission.team?.name || submission.guild?.name || submission.user?.username}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <FiStar className="mr-1" />
                        <span>{submission.votes_count}</span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {submission.description.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                        <a
                          href={submission.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          View Project
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}