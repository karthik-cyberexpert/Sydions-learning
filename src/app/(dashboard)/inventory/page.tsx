'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiUser, FiAward, FiPackage, FiAlertCircle } from 'react-icons/fi'

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

interface Profile {
  id: string
  equipped_avatar_id: string | null
  equipped_banner_id: string | null
}

export default function InventoryPage() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!user) return
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, equipped_avatar_id, equipped_banner_id')
        .eq('id', user.id)
        .single()
      
      if (profileError) throw profileError
      setProfile(profileData)

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
      console.error('Error fetching inventory:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEquipItem = async (item: InventoryItem) => {
    if (!user) return
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
      setUpdating(false)
      return // Badges are automatically displayed
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
      
      if (error) throw error
      
      setProfile(prev => prev ? ({ ...prev, ...updatePayload }) : null)
      alert(successMessage) // Using alert for simplicity, replace with toast later
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>

  const avatars = inventory.filter(i => i.shop_items.item_type === 'avatar')
  const banners = inventory.filter(i => i.shop_items.item_type === 'banner')
  const badges = inventory.filter(i => i.shop_items.item_type === 'badge')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Inventory</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Equip your purchased avatars, banners, and view your badges.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex"><div className="flex-shrink-0"><FiAlertCircle className="h-5 w-5 text-red-400" /></div><div className="ml-3"><h3 className="text-sm font-medium text-red-800">Error: {error}</h3></div></div>
        </div>
      )}

      {/* Avatars */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Avatars ({avatars.length})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                disabled={updating || profile?.equipped_avatar_id === item.item_id}
                className={`mt-2 w-full text-xs py-1 rounded-md ${
                  profile?.equipped_avatar_id === item.item_id
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                }`}
              >
                {profile?.equipped_avatar_id === item.item_id ? 'Equipped' : 'Equip'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Banners */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Banners ({banners.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map(item => (
            <div key={item.id} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-grow h-16 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden" style={{ backgroundImage: `url(${item.shop_items.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {!item.shop_items.image_url && <div className="h-full flex items-center justify-center text-gray-500">Banner Preview</div>}
              </div>
              <div className="ml-4 flex-shrink-0 w-40">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.shop_items.name}</p>
                <button
                  onClick={() => handleEquipItem(item)}
                  disabled={updating || profile?.equipped_banner_id === item.item_id}
                  className={`mt-1 w-full text-xs py-1 rounded-md ${
                    profile?.equipped_banner_id === item.item_id
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                  }`}
                >
                  {profile?.equipped_banner_id === item.item_id ? 'Equipped' : 'Equip'}
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