'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { FiShoppingBag, FiAward, FiAlertCircle, FiCheckCircle, FiUser, FiShield } from 'react-icons/fi'
import { motion } from 'framer-motion'

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  item_type: 'avatar' | 'banner' | 'badge'
  is_reward_only: boolean
  is_for_guild: boolean
}

interface Profile {
  id: string
  coins: number
  guild_id: string | null
}

export default function ShopPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<ShopItem[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userInventoryIds, setUserInventoryIds] = useState<Set<string>>(new Set())
  const [guildInventoryIds, setGuildInventoryIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('user')

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('id, coins, guild_id').eq('id', user.id).single()
      if (profileError) throw profileError
      setProfile(profileData)

      const { data: userInvData, error: userInvError } = await supabase.from('user_inventory').select('item_id').eq('user_id', user.id)
      if (userInvError) throw userInvError
      setUserInventoryIds(new Set((userInvData || []).map(i => i.item_id)))

      if (profileData.guild_id) {
        const { data: guildInvData, error: guildInvError } = await supabase.from('guild_inventory').select('item_id').eq('guild_id', profileData.guild_id)
        if (guildInvError) throw guildInvError
        setGuildInventoryIds(new Set((guildInvData || []).map(i => i.item_id)))
      }

      const { data: itemsData, error: itemsError } = await supabase.from('shop_items').select('*').eq('is_reward_only', false).order('price', { ascending: true })
      if (itemsError) throw itemsError
      setItems(itemsData || [])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePurchase = async (item: ShopItem) => {
    if (!profile || purchasing) return
    setPurchasing(item.id)
    setError(null)
    setSuccess(null)

    try {
      if (item.is_for_guild) {
        if (!profile.guild_id) throw new Error("You must be in a guild to purchase guild items.")
        const { error: purchaseError } = await supabase.rpc('purchase_guild_item', { p_user_id: profile.id, p_item_id: item.id, p_guild_id: profile.guild_id })
        if (purchaseError) throw purchaseError
        setGuildInventoryIds(prev => new Set(prev).add(item.id))
      } else {
        const { error: purchaseError } = await supabase.rpc('purchase_item', { p_user_id: profile.id, p_item_id: item.id })
        if (purchaseError) throw purchaseError
        setUserInventoryIds(prev => new Set(prev).add(item.id))
      }

      setSuccess(`Successfully purchased ${item.name}!`)
      setProfile(prev => prev ? { ...prev, coins: prev.coins - item.price } : null)
    } catch (err: any) {
      setError(err.message || 'Purchase failed.')
    } finally {
      setPurchasing(null)
    }
  }

  const filteredItems = items.filter(item => activeTab === 'user' ? !item.is_for_guild : item.is_for_guild)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-semibold text-gray-900 dark:text-white">The Coin Shop</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Spend your coins on cosmetic items.</p></div>
        <div className="flex items-center text-lg font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-4 py-2 rounded-lg shadow-sm"><FiAward className="mr-2 h-5 w-5" />{profile?.coins.toLocaleString() || 0} Coins</div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700"><nav className="-mb-px flex space-x-8"><button onClick={() => setActiveTab('user')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'user' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FiUser className="mr-2" />For You</button><button onClick={() => setActiveTab('guild')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'guild' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FiShield className="mr-2" />For Your Guild</button></nav></div>

      {error && <div className="rounded-md bg-red-50 p-4"><div className="flex"><div className="flex-shrink-0"><FiAlertCircle className="h-5 w-5 text-red-400" /></div><div className="ml-3"><h3 className="text-sm font-medium text-red-800">Purchase Failed: {error}</h3></div></div></div>}
      {success && <div className="rounded-md bg-green-50 p-4"><div className="flex"><div className="flex-shrink-0"><FiCheckCircle className="h-5 w-5 text-green-400" /></div><div className="ml-3"><h3 className="text-sm font-medium text-green-800">{success}</h3></div></div></div>}

      {loading ? <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div> : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, index) => {
            const isOwned = activeTab === 'user' ? userInventoryIds.has(item.id) : guildInventoryIds.has(item.id)
            const canAfford = profile && profile.coins >= item.price
            const isDisabled = isOwned || !canAfford || purchasing === item.id
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg flex flex-col">
                <div className="p-6 flex-grow">
                  <div className="flex items-center justify-between"><h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.name}</h3><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">{item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}</span></div>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                  <div className="mt-4 flex justify-center"><div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">{item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <FiShoppingBag className="h-10 w-10 text-gray-500" />}</div></div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{item.price.toLocaleString()} Coins</span>
                  <button onClick={() => handlePurchase(item)} disabled={isDisabled} className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${isOwned ? 'bg-green-500' : canAfford ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}`}>{purchasing === item.id ? 'Processing...' : isOwned ? 'Owned' : canAfford ? 'Buy Now' : 'Too Expensive'}</button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}