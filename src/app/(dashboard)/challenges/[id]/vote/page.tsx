'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useParams, useRouter } from 'next/navigation'
import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiThumbsUp } from 'react-icons/fi'
import Link from 'next/link'

interface Challenge {
  id: string
  title: string
  status: 'Upcoming' | 'Voting' | 'Completed'
}

interface Submission {
  id: string
  live_url: string
  description: string
  user: {
    username: string
  } | null
}

export default function VotePage() {
  const { user } = useAuth()
  const { id: challengeId } = useParams()
  const router = useRouter()

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [userVote, setUserVote] = useState<string | null>(null) // Stores submission_id voted for
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!challengeId || !user) return
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch Challenge Info
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('id, title, status')
        .eq('id', challengeId)
        .single()
      
      if (challengeError) throw new Error('Challenge not found.')
      if (challengeData.status !== 'Voting') throw new Error('This challenge is not in the voting phase.')
      setChallenge(challengeData)

      // 2. Fetch Submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select(`id, live_url, description, user:user_id ( username )`)
        .eq('challenge_id', challengeId)
      
      if (submissionsError) throw submissionsError
      setSubmissions(submissionsData as any)

      // 3. Check for existing vote
      const { data: voteData, error: voteError } = await supabase
        .from('votes')
        .select('submission_id')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .single()
      
      if (voteError && voteError.code !== 'PGRST116') throw voteError // Ignore 'no rows found' error
      if (voteData) {
        setUserVote(voteData.submission_id)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [challengeId, user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleVote = async (submissionId: string) => {
    if (!user || !challengeId || userVote) return
    setIsSubmitting(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          challenge_id: challengeId as string,
          submission_id: submissionId
        })
      
      if (error) throw error
      setUserVote(submissionId) // Update state to reflect the new vote
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">An Error Occurred</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <div className="mt-6">
          <Link href={`/challenges/${challengeId}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Back to Challenge
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Vote for &quot;{challenge?.title}&quot;</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review the submissions and cast your vote for your favorite project. You can only vote once.
        </p>
      </div>

      {userVote && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiCheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Thank you for voting!</h3>
              <p className="text-sm text-green-700">Your vote has been recorded.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {submissions.map(submission => {
          const hasVotedForThis = userVote === submission.id
          return (
            <div key={submission.id} className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg flex flex-col border-2 ${hasVotedForThis ? 'border-indigo-500' : 'border-transparent'}`}>
              <div className="p-6 flex-grow">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Project by {submission.user?.username || 'Anonymous'}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 h-20 overflow-y-auto">{submission.description}</p>
                <a href={submission.live_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                  View Project <FiExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={() => handleVote(submission.id)}
                  disabled={!!userVote || isSubmitting}
                  className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white disabled:opacity-50 ${
                    hasVotedForThis ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  <FiThumbsUp className="mr-2 h-5 w-5" />
                  {isSubmitting ? 'Voting...' : hasVotedForThis ? 'Your Vote' : 'Vote for this Project'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}