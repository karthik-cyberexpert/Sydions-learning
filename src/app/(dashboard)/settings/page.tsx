'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { FiUser, FiLock, FiSun, FiMoon } from 'react-icons/fi'
import { useTheme } from 'next-themes'

type ProfileData = {
  username: string | null
  full_name: string | null
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  
  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [profileForm, setProfileForm] = useState({ username: '', full_name: '' })
  const [profileStatus, setProfileStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isProfileSaving, setIsProfileSaving] = useState(false)

  // Password state
  const [passwordForm, setPasswordForm] = useState({ new_password: '', confirm_password: '' })
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)

  useEffect(() => setMounted(true), [])

  const fetchProfile = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      
      setProfile(data)
      setProfileForm({
        username: data.username || '',
        full_name: data.full_name || '',
      })
    } catch (err: any) {
      setProfileStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setIsProfileSaving(true)
    setProfileStatus(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileForm.username,
          full_name: profileForm.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      
      if (error) throw error
      setProfileStatus({ type: 'success', message: 'Profile updated successfully!' })
    } catch (err: any) {
      setProfileStatus({ type: 'error', message: err.message })
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' })
      return
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters long.' })
      return
    }

    setIsPasswordSaving(true)
    setPasswordStatus(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password,
      })
      if (error) throw error
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' })
      setPasswordForm({ new_password: '', confirm_password: '' })
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message })
    } finally {
      setIsPasswordSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Public Profile', icon: FiUser },
    { id: 'account', name: 'Account', icon: FiLock },
    { id: 'appearance', name: 'Appearance', icon: theme === 'dark' ? FiMoon : FiSun },
  ]

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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account and profile settings.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-1/4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <form onSubmit={handleProfileUpdate}>
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Public Profile</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This information will be displayed publicly.</p>
                  
                  <div className="mt-6 space-y-6">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                      <input type="text" name="username" id="username" required value={profileForm.username} onChange={(e) => setProfileForm({...profileForm, username: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                      <input type="text" name="full_name" id="full_name" value={profileForm.full_name} onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-right sm:px-6 rounded-b-lg">
                  {profileStatus && (
                    <div className={`text-sm text-left mb-2 ${profileStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {profileStatus.message}
                    </div>
                  )}
                  <button type="submit" disabled={isProfileSaving} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
                    {isProfileSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <form onSubmit={handlePasswordUpdate}>
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Account</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your password.</p>
                  
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-200">{user?.email}</p>
                    </div>
                    <div>
                      <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                      <input type="password" name="new_password" id="new_password" required value={passwordForm.new_password} onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                      <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                      <input type="password" name="confirm_password" id="confirm_password" required value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-right sm:px-6 rounded-b-lg">
                  {passwordStatus && (
                    <div className={`text-sm text-left mb-2 ${passwordStatus.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordStatus.message}
                    </div>
                  )}
                  <button type="submit" disabled={isPasswordSaving} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">
                    {isPasswordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Appearance</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Customize the look and feel of the application.</p>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                  <div className="mt-2 flex items-center space-x-4">
                    <button onClick={() => setTheme('light')} className={`px-4 py-2 rounded-md text-sm font-medium ${theme === 'light' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Light</button>
                    <button onClick={() => setTheme('dark')} className={`px-4 py-2 rounded-md text-sm font-medium ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Dark</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}