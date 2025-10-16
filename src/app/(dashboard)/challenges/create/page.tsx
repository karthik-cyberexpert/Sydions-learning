'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { FiAlertCircle } from 'react-icons/fi'

export default function CreateChallenge() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'solo',
    difficulty: 'beginner',
    deadline: '',
    max_points: 100,
    max_team_size: 3
  })

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
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single()
      
      if (profileError) throw profileError
      
      if (!profile?.is_admin) {
        throw new Error('Only admins can create challenges')
      }
      
      // Insert the new challenge
      const { data, error } = await supabase
        .from('challenges')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            difficulty: formData.difficulty,
            deadline: formData.deadline,
            max_points: formData.max_points,
            max_team_size: formData.type === 'tag-team' ? formData.max_team_size : null,
            status: 'Upcoming'
          }
        ])
        .select()
      
      if (error) throw error
      
      // Redirect to challenges page
      router.push('/challenges')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Create New Challenge
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a new coding challenge for the community
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
              {loading ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}