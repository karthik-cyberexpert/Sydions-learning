'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { FiAlertCircle, FiSave, FiCheckCircle } from 'react-icons/fi'

interface Guild {
  id: string
  name: string
  description: string
  owner_id: string
  avatar_url: string | null
  is_public: boolean
}

export default function GuildSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [guild, setGuild] = useState<Guild | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    description: '',
    avatar_url: '',
    is_public: true,
  })

  const fetchGuildData = useCallback(async () => {
    if (!id || !user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('guilds')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data.owner_id !== user.id) {
        throw new Error('You do not have permission to edit this guild.')
      }

      setGuild(data)
      setFormData({
        description: data.description || '',
        avatar_url: data.avatar_url || '',
        is_public: data.is_public,
      })
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => router.push(`/guilds/${id}`), 3000)
    } finally {
      setLoading(false)
    }
  }, [id, user, router])

  useEffect(() => {
    fetchGuildData()
  }, [fetchGuildData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { error } = await supabase
        .from('guilds')
        .update({
          description: formData.description,
          avatar_url: formData.avatar_url || null,
          is_public: formData.is_public,
        })
        .eq('id', id)
      
      if (error) throw error
      
      setSuccess('Guild settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  }

  if (!guild) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Guild not found or you don't have permission.</h3>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Guild Settings for &quot;{guild.name}&quot;
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your guild's information and settings.
        </p>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex"><div className="flex-shrink-0"><FiAlertCircle className="h-5 w-5 text-red-400" /></div><div className="ml-3"><h3 className="text-sm font-medium text-red-800">{error}</h3></div></div>
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="flex"><div className="flex-shrink-0"><FiCheckCircle className="h-5 w-5 text-green-400" /></div><div className="ml-3"><h3 className="text-sm font-medium text-green-800">{success}</h3></div></div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Guild Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                value={guild.name}
                disabled
                className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Guild names cannot be changed.
              </p>
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
                maxLength={500}
                value={formData.description}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Avatar URL
            </label>
            <div className="mt-1">
              <input
                type="url"
                name="avatar_url"
                id="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="https://example.com/guild_avatar.png"
              />
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="is_public"
                name="is_public"
                type="checkbox"
                checked={formData.is_public}
                onChange={handleChange}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="is_public" className="font-medium text-gray-700 dark:text-gray-300">Public Guild</label>
              <p className="text-gray-500 dark:text-gray-400">If unchecked, users will need to request to join (Protected - feature coming soon).</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push(`/guilds/${id}`)}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
            >
              Back to Guild
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              <FiSave className="mr-2 h-5 w-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}