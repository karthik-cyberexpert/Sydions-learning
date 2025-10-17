'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { FiUser, FiAward, FiPackage, FiAlertCircle, FiShield } from 'react-icons/fi'

interface ShopItemDetails {
  name: string
  description: string
  image_url: string | null
  item_type: 'avatar' | 'banner' | 'badge'
}

interface InventoryItem {
  id: string
  item_id: string
  purchased_at: string
  shop_items: ShopItemDetails
}

interface GuildInventoryItem {
  id: string
  item_id: string
  purchased_at: string
  shop_items: ShopItemDetails
}

interface Profile {
  id: string
  equipped_avatar_id: string | null
  equipped_banner_id: string | null
  guild_id: string | null
}

export default function InventoryPage() {
  const { user } = useAuth()
  const [personalInventory, setPersonalInventory] = useState<InventoryItem[]>([])
  const [guildInventory, setGuildInventory] = useState<GuildInventoryItem[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('user')

  const fetchData = useCallback(async () => {
    if (!user) return
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, equipped_avatar_id, equipped_banner_id, guild_id')
        .eq('id', user.id)
        .single()
      
      if (profileError) throw profileError
      setProfile(profileData as Profile)

      // 1. Fetch Personal Inventory
      const { data: userInvData, error: userInvError } = await supabase
        .from('user_inventory')
        .select(`
          id,
          item_id,
          purchased_at,
          shop_items ( name, description, image_url, item_type )
        `)
        .eq('user_id', user.id)
      
      if (userInvError) throw userInvError
      setPersonalInventory(userInvData as InventoryItem[])

      // 2. Fetch Guild Inventory (if member of a guild)
      if (profileData.guild_id) {
        const { data: guildInvData, error: guildInvError } = await supabase
          .from('guild_inventory')
          .select(`
            id,
            item_id,
            purchased_at,
            shop_items ( name, description, image_url, item_type )
          `)
          .eq('guild_id', profileData.guild_id)
        
        if (guildInvError) throw guildInvError
        setGuildInventory(guildInvData as GuildInventoryItem[])
      } else {
        setGuildInventory([])
      }

    } catch (err: unknown) {
      console.error('Error fetching inventory:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEquipItem = async (item: InventoryItem | GuildInventoryItem, isGuildItem: boolean) => {
    if (!user) return
    setUpdating(true)
    setError(null)
    
    const idToUpdate = isGuildItem ? profile?.guild_id : user.id

    if (!idToUpdate) {
      setUpdating(false)
      setError('Cannot equip item: Missing ID.')
      return
    }

    let updatePayload: { [key: string]: string | null } = {}
    let successMessage = ''
    const table = isGuildItem ? 'guilds' : 'profiles'

    if (item.shop_items.item_type === 'avatar') {
      updatePayload.equipped_avatar_id = item.item_id
      updatePayload.avatar_url = item.shop_items.image_url
      successMessage = `${isGuildItem ? 'Guild Avatar' : 'Avatar'} '${item.shop_items.name}' equipped!`
    } else if (item.shop_items.item_type === 'banner') {
      updatePayload.equipped_banner_id = item.item_id
      updatePayload.banner_url = item.shop_items.image_url
      successMessage = `${isGuildItem ? 'Guild Banner' : 'Banner'} '${item.shop_items.name}' equipped!`
    } else {
      setUpdating(false)
      return // Badges are automatically displayed
    }

    try {
      const { error } = await supabase
        .from(table)
        .update(updatePayload)
        .eq('id', idToUpdate)
      
      if (error) throw error
      
      if (!isGuildItem) {
        setProfile(prev => prev ? ({ ...prev, ...updatePayload }) : null)
      }
      alert(successMessage) // Using alert for simplicity, replace with toast later
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>

  const currentInventory = activeTab === 'user' ? personalInventory : guildInventory
  const avatars = currentInventory.filter(i => i.shop_items.item_type === 'avatar')
  const banners = currentInventory.filter(i => i.shop_items.item_type === 'banner')
  const badges = currentInventory.filter(i => i.shop_items.item_type === 'badge')
  const isGuildTab = activeTab === 'guild'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Inventory</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your personal and guild cosmetic items.</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button onClick={() => setActiveTab('user')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'user' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FiUser className="mr-2" />For You</button>
          {profile?.guild_id && (
            <button onClick={() => setActiveTab('guild')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'guild' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FiShield className="mr-2" />For Your Guild</button>
          )}
        </nav>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex"><div className="flex-shrink-0"><FiAlertCircle className="h-5 w-5 text-red-400" /></div><div className="ml-3"><h3 className="text-sm font-medium text-red-800">Error: {error}</h3></div></div>
        </div>
      )}

      {/* Avatars */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{isGuildTab ? 'Guild Avatars' : 'Avatars'} ({avatars.length})</h3>
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
                onClick={() => handleEquipItem(item, isGuildTab)}
                disabled={updating || (isGuildTab ? false : profile?.equipped_avatar_id === item.item_id)}
                className={`mt-2 w-full text-xs py-1 rounded-md ${
                  (isGuildTab ? false : profile?.equipped_avatar_id === item.item_id)
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                }`}
              >
                {(isGuildTab ? false : profile?.equipped_avatar_id === item.item_id) ? 'Equipped' : 'Equip'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Banners */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{isGuildTab ? 'Guild Banners' : 'Banners'} ({banners.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map(item => (
            <div key={item.id} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-grow h-16 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden" style={{ backgroundImage: `url(${item.shop_items.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                {!item.shop_items.image_url && <div className="h-full flex items-center justify-center text-gray-500">Banner Preview</div>}
              </div>
              <div className="ml-4 flex-shrink-0 w-40">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.shop_items.name}</p>
                <button
                  onClick={() => handleEquipItem(item, isGuildTab)}
                  disabled={updating || (isGuildTab ? false : profile?.equipped_banner_id === item.item_id)}
                  className={`mt-1 w-full text-xs py-1 rounded-md ${
                    (isGuildTab ? false : profile?.equipped_banner_id === item.item_id)
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                  }`}
                >
                  {(isGuildTab ? false : profile?.equipped_banner_id === item.item_id) ? 'Equipped' : 'Equip'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges (Only visible in personal inventory) */}
      {!isGuildTab && (
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
      )}
    </div>
  )
}