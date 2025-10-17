'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FiPlus, FiEdit, FiTrash, FiAlertCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Challenge {
  id: string
  title: string
  type: 'solo' | 'tag-team' | 'guild'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  status: 'Upcoming' | 'Voting' | 'Completed'
  deadline: string
}

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('id, title, type, difficulty, status, deadline')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setChallenges(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (challengeId: string) => {
    if (!window.confirm('Are you sure you want to delete this challenge? This will also delete all associated submissions and cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId)
      
      if (error) throw error
      fetchChallenges()
    } catch (err: any) {
      setError(err.message)
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Manage Challenges
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create, edit, and delete challenges for the community.
          </p>
        </div>
        <Link
          href="/challenges/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiPlus className="mr-2" />
          New Challenge
        </Link>
      </div>

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

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {challenges.length === 0 ? (
            <li className="p-6 text-center text-gray-500 dark:text-gray-400">No challenges found.</li>
          ) : (
            challenges.map((challenge) => (
              <motion.li
                key={challenge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{challenge.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {challenge.type} - {challenge.difficulty} - {challenge.status}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Link
                    href={`/admin/challenges/${challenge.id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiEdit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(challenge.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiTrash className="h-5 w-5" />
                  </button>
                </div>
              </motion.li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}