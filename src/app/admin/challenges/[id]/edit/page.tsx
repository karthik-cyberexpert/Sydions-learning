'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { FiAlertCircle } from 'react-icons/fi'

interface Guild {
  id: string
  name: string
}

interface ChallengeFormData {
  title: string
  description: string
  type: string
  difficulty: string
  deadline: string
  max_points: number
  max_team_size: number
  status: string
  guild_id: string | null
}

export default function EditChallenge() {
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [guilds, setGuilds] = useState<Guild[]>([])
  
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    type: 'solo',
    difficulty: 'beginner',
    deadline: '',
    max_points: 100,
    max_team_size: 3,
    status: 'Upcoming',
    guild_id: null,
  })

  useEffect(() => {
    const fetchChallengeAndGuilds = async () => {
      if (!id) return
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user?.id)
          .single()
        
        if (profileError || !profile?.is_admin) {
          throw new Error('You do not have permission to edit challenges.')
        }

        const { data, error: challengeError } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', id)
          .single()
        
        if (challengeError) throw challengeError

        const { data: guildsData, error: guildsError } = await supabase
          .from('guilds')
          .select('id, name')
          .order('name')

        if (guildsError) throw guildsError
        setGuilds(guildsData as Guild[] || [])

        setFormData({
          title: data.title,
          description: data.description,
          type: data.type,
          difficulty: data.difficulty,
          deadline: new Date(data.deadline).toISOString().slice(0, 16),
          max_points: data.max_points,
          max_team_size: data.max_team_size || 3,
          status: data.status,
          guild_id: data.guild_id,
        })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.')
        setTimeout(() => router.push('/admin/challenges'), 3000)
      } finally {
        setLoading(false)
      }
    }
    if (user) {
      fetchChallengeAndGuilds()
    }
  }, [id, user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_points' || name === 'max_team_size' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          difficulty: formData.difficulty,
          deadline: formData.deadline,
          max_points: formData.max_points,
          max_team_size: formData.type === 'tag-team' ? formData.max_team_size : null,
          status: formData.status,
          guild_id: formData.guild_id || null,
        })
        .eq('id', id)
      
      if (error) throw error
      
      router.push('/admin/challenges')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Edit Challenge
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update the details for &quot;{formData.title}&quot;
        </p>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Challenge Title
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <div className="mt-1">
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Challenge Type
              </label>
              <div className="mt-1">
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="solo">Solo</option>
                  <option value="tag-team">Tag-Team</option>
                  <option value="guild">Guild</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Difficulty
              </label>
              <div className="mt-1">
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deadline
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  name="deadline"
                  id="deadline"
                  required
                  value={formData.deadline}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="max_points" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Points
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="max_points"
                  id="max_points"
                  min="10"
                  max="1000"
                  required
                  value={formData.max_points}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {formData.type === 'tag-team' && (
              <div className="sm:col-span-3">
                <label htmlFor="max_team_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Team Size
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="max_team_size"
                    id="max_team_size"
                    min="2"
                    max="10"
                    required
                    value={formData.max_team_size}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="sm:col-span-3">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Voting">Voting</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="guild_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assign to Guild (Optional)
              </label>
              <div className="mt-1">
                <select
                  id="guild_id"
                  name="guild_id"
                  value={formData.guild_id || ''}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">None (Global Challenge)</option>
                  {guilds.map(guild => (
                    <option key={guild.id} value={guild.id}>{guild.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}