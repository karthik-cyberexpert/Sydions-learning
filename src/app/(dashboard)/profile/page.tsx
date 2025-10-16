'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiUser, FiAward, FiSettings, FiGithub, FiLinkedin, FiGlobe, FiTrendingUp, FiPackage, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
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
  banner_url: string | null
  avatar_url: string | null
  equipped_avatar_id: string | null
  equipped_banner_id: string | null
}

interface InventoryItem {
  id: string
  item_id: string
  purchased_at: string
  shop_items: {
    name: string
    description: string
    image_url: string | null
    item_type: 'avatar' | 'banner' | 'badge'
  }
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    username: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: ''
  })

  const fetchData = useCallback(async () => {
    if (!user) return
    
    try {
      // 1. Fetch Profile Data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles_with_level')
        .select('*, equipped_avatar_id, equipped_banner_id') // Assuming these columns exist on profiles_with_level view/table
        .eq('id', user.id)
        .single()
      
      if (profileError) throw profileError
      
      const rank = getRankFromLevel(profileData.level)
      setProfile({ ...profileData, rank })
      setFormData({
        username: profileData.username || '',
        github_url: profileData.github_url || '',
        linkedin_url: profileData.linkedin_url || '',
        portfolio_url: profileData.portfolio_url || ''
      })

      // 2. Fetch Inventory
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('user_inventory')
        .select(`
          id,
          item_id,
          purchased_at,
          shop_items ( name, description, image_url, item_type )
        `)
        .eq('user_id', user.id)
      
      if (inventoryError) throw inventoryError
      setInventory(inventoryData as any)

    } catch (err: any) {
      console.error('Error fetching profile/inventory:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEdit = () => {
    setActiveTab('details')
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
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          github_url: formData.github_url || null,
          linkedin_url: formData.linkedin_url || null,
          portfolio_url: formData.portfolio_url || null,
          updated_at: new Date().toISOString()
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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleEquipItem = async (item: InventoryItem) => {
    setUpdating(true)
    setError(null)
    
    let updatePayload: any = {}
    let successMessage = ''

    if (item.shop_items.item_type === 'avatar') {
      updatePayload.equipped_avatar_id = item.item_id
      updatePayload.avatar_url = item.shop_items.image_url
      successMessage = `Avatar '${item.shop_items.name}' equipped!`
    } else if (item.shop_items.item_type === 'banner') {
      updatePayload.equipped_banner_id = item.item_id
      updatePayload.banner_url = item.shop_items.image_url
      successMessage = `Banner '${item.shop_items.name}' equipped!`
    } else {
      return // Badges are automatically displayed
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user?.id)
      
      if (error) throw error
      
      // Update local state
      setProfile(prev => prev ? ({ ...prev, ...updatePayload }) : null)
      alert(successMessage) // Using alert for simplicity, replace with toast later
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const renderProfileContent = () => {
    if (!profile) return null

    if (editing) {
      return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Edit Profile</h3>
            <div className="sm:col-span-3">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <input type="text" name="username" id="username" required value={formData.username} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label htmlFor="github_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">GitHub Profile</label>
              <input type="url" name="github_url" id="github_url" value={formData.github_url} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="https://github.com/username" />
            </div>
            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn Profile</label>
              <input type="url" name="linkedin_url" id="linkedin_url" value={formData.linkedin_url} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="https://linkedin.com/in/username" />
            </div>
            <div>
              <label htmlFor="portfolio_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Portfolio Website</label>
              <input type="url" name="portfolio_url" id="portfolio_url" value={formData.portfolio_url} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="https://your-portfolio.com" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={handleCancel} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Cancel</button>
              <button type="submit" disabled={updating} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">{updating ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      )
    }

    if (activeTab === 'inventory') {
      const avatars = inventory.filter(i => i.shop_items.item_type === 'avatar')
      const banners = inventory.filter(i => i.shop_items.item_type === 'banner')
      const badges = inventory.filter(i => i.shop_items.item_type === 'badge')

      return (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Inventory</h2>
          
          {/* Avatars */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Avatars ({avatars.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {avatars.map(item => (
                <div key={item.id} className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {item.shop_items.image_url ? (
                      <img src={item.shop_items.image_url} alt={item.shop_items.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiUser className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-center text-gray-900 dark:text-white">{item.shop_items.name}</p>
                  <button
                    onClick={() => handleEquipItem(item)}
                    disabled={updating || profile.equipped_avatar_id === item.item_id}
                    className={`mt-2 w-full text-xs py-1 rounded-md ${
                      profile.equipped_avatar_id === item.item_id
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                    }`}
                  >
                    {profile.equipped_avatar_id === item.item_id ? 'Equipped' : 'Equip'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Banners */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Banners ({banners.length})</h3>
            <div className="grid grid-cols-1 gap-4">
              {banners.map(item => (
                <div key={item.id} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex-grow h-16 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden" style={{ backgroundImage: `url(${item.shop_items.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    {!item.shop_items.image_url && <div className="h-full flex items-center justify-center text-gray-500">Banner Preview</div>}
                  </div>
                  <div className="ml-4 flex-shrink-0 w-40">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.shop_items.name}</p>
                    <button
                      onClick={() => handleEquipItem(item)}
                      disabled={updating || profile.equipped_banner_id === item.item_id}
                      className={`mt-1 w-full text-xs py-1 rounded-md ${
                        profile.equipped_banner_id === item.item_id
                          ? 'bg-green-500 text-white cursor-default'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                      }`}
                    >
                      {profile.equipped_banner_id === item.item_id ? 'Equipped' : 'Equip'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Badges ({badges.length})</h3>
            <div className="flex flex-wrap gap-4">
              {badges.map(item => (
                <div key={item.id} className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg w-24">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center overflow-hidden">
                    {item.shop_items.image_url ? (
                      <img src={item.shop_items.image_url} alt={item.shop_items.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiAward className="h-6 w-6 text-yellow-600" />
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium text-center text-gray-900 dark:text-white">{item.shop_items.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // Default view (Details)
    return (
      <>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center"><FiAward className="h-6 w-6 text-indigo-500 mr-3" /><dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Rank</dt></div>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{profile.rank}</dd>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center"><FiTrendingUp className="h-6 w-6 text-green-500 mr-3" /><dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total XP</dt></div>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{profile.xp}</dd>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center"><FiAward className="h-6 w-6 text-yellow-500 mr-3" /><dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Coins</dt></div>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{profile.coins}</dd>
          </motion.div>
        </div>
      </>
    )
  }

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  if (!profile) return <div className="text-center py-12"><FiUser className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Profile not found</h3></div>

  return (
    <div className="space-y-6">
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
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className={`h-32 bg-gradient-to-r from-indigo-500 to-purple-500 ${profile.banner_url ? 'bg-cover bg-center' : ''}`} style={{ backgroundImage: `url(${profile.banner_url})` }}></div>
        <div className="px-4 py-5 sm:px-6 -mt-16 sm:-mt-20">
          <div className="flex items-end space-x-5">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-200 ring-4 ring-white dark:ring-gray-800 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-gray-600">{profile.username?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="pb-4 sm:pb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.username}</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{profile.rank} {getRankBadge(profile.rank)}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 flex justify-between items-center">
          <div className="flex space-x-4">
            {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500"><FiGithub className="h-6 w-6" /></a>}
            {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500"><FiLinkedin className="h-6 w-6" /></a>}
            {profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500"><FiGlobe className="h-6 w-6" /></a>}
          </div>
          <button onClick={handleEdit} className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"><FiSettings className="mr-2" /> Edit Profile</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => { setActiveTab('details'); setEditing(false) }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details' && !editing
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FiUser className="mr-2" />
              Details
            </div>
          </button>
          <button
            onClick={() => { setActiveTab('inventory'); setEditing(false) }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FiPackage className="mr-2" />
              Inventory ({inventory.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Content Area */}
      {renderProfileContent()}
    </div>
  )
}