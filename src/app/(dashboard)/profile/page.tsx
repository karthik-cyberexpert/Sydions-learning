'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiUser, FiMail, FiCalendar, FiAward, FiSettings, FiGithub, FiLinkedin, FiGlobe, FiTrendingUp } from 'react-icons/fi'
import { getRankFromLevel, getRankBadge } from '@/lib/utils'

interface Profile {
  id: string
  username: string
  email: string
  xp: number
  coins: number
  rank: string
  github_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  created_at: string
  level: number
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: ''
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('profiles_with_level')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) throw error
        
        const rank = getRankFromLevel(data.level)
        setProfile({ ...data, rank })
        setFormData({
          username: data.username || '',
          github_url: data.github_url || '',
          linkedin_url: data.linkedin_url || '',
          portfolio_url: data.portfolio_url || ''
        })
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProfile()
  }, [user])

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    if (profile) {
      setFormData({
        username: profile.username || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        portfolio_url: profile.portfolio_url || ''
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          github_url: formData.github_url || null,
          linkedin_url: formData.linkedin_url || null,
          portfolio_url: formData.portfolio_url || null
        })
        .eq('id', user?.id)
        .select()
        .single()
      
      if (error) throw error
      
      if (profile) {
        const rank = getRankFromLevel(profile.level)
        setProfile({ ...profile, ...data, rank })
      }
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <FiUser className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Profile not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          There was an error loading your profile.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Your Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your profile information and settings
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Profile Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Personal details and application settings
              </p>
            </div>
            {!editing && (
              <button
                onClick={handleEdit}
                className="mt-4 md:mt-0 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <FiSettings className="mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="username"
                      id="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      disabled
                      value={user?.email || ''}
                      className="block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="github_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    GitHub Profile
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                      <FiGithub />
                    </span>
                    <input
                      type="url"
                      name="github_url"
                      id="github_url"
                      value={formData.github_url}
                      onChange={handleChange}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    LinkedIn Profile
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                      <FiLinkedin />
                    </span>
                    <input
                      type="url"
                      name="linkedin_url"
                      id="linkedin_url"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="portfolio_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Portfolio Website
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                      <FiGlobe />
                    </span>
                    <input
                      type="url"
                      name="portfolio_url"
                      id="portfolio_url"
                      value={formData.portfolio_url}
                      onChange={handleChange}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="https://your-portfolio.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Username
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {profile.username}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email address
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <FiMail className="mr-2" />
                    {user?.email}
                  </div>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Member since
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <FiCalendar className="mr-2" />
                    {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rank
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{getRankBadge(profile.rank)}</span>
                    {profile.rank}
                  </div>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Experience Points
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <FiAward className="mr-2" />
                    {profile.xp} XP
                  </div>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Coins
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {profile.coins} coins
                </dd>
              </div>
              {(profile.github_url || profile.linkedin_url || profile.portfolio_url) && (
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Social Profiles
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                    <ul className="space-y-2">
                      {profile.github_url && (
                        <li>
                          <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                            <FiGithub className="mr-2" />
                            GitHub Profile
                          </a>
                        </li>
                      )}
                      {profile.linkedin_url && (
                        <li>
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                            <FiLinkedin className="mr-2" />
                            LinkedIn Profile
                          </a>
                        </li>
                      )}
                      {profile.portfolio_url && (
                        <li>
                          <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                            <FiGlobe className="mr-2" />
                            Portfolio Website
                          </a>
                        </li>
                      )}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
        >
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900 rounded-md p-3">
                <FiAward className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Current Rank
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {profile.rank}
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
                <FiTrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total XP
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {profile.xp}
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
                    Coins
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {profile.coins}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}