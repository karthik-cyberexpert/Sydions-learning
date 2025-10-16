'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { FiShoppingBag, FiAward, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  item_type: 'avatar' | 'banner' | 'badge'
  is_reward_only: boolean
}

interface Profile {
  coins: number
  id: string
}

export default function ShopPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<ShopItem[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inventoryIds, setInventoryIds] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    if (!user) return

    try {
      // 1. Fetch Shop Items (only non-reward items)
      const { data: itemsData, error: itemsError } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_reward_only', false)
        .order('price', { ascending: true })
      
      if (itemsError) throw itemsError
      setItems(itemsData || [])

      // 2. Fetch User Profile (for coins)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, coins')
        .eq('id', user.id)
        .single()
      
      if (profileError) throw profileError
      setProfile(profileData)

      // 3. Fetch User Inventory (to check ownership)
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('user_inventory')
        .select('item_id')
        .eq('user_id', user.id)
      
      if (inventoryError) throw inventoryError
      setInventoryIds(new Set((inventoryData || []).map(i => i.item_id)))

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
      // Call the stored procedure to handle the transaction
      const { error: purchaseError } = await supabase.rpc('purchase_item', {
        p_user_id: profile.id,
        p_item_id: item.id,
      })

      if (purchaseError) throw purchaseError

      setSuccess(`Successfully purchased ${item.name}! Check your Inventory.`)
      
      // Update local state immediately
      setProfile(prev => prev ? { ...prev, coins: prev.coins - item.price } : null)
      setInventoryIds(prev => new Set(prev).add(item.id))

    } catch (err: any) {
      // Supabase RPC errors often contain the message in the error object
      setError(err.message || 'Purchase failed due to an unknown error.')
    } finally {
      setPurchasing(null)
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
            The Coin Shop
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Spend your hard-earned coins on cosmetic items for your profile.
          </p>
        </div>
        <div className="flex items-center text-lg font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-4 py-2 rounded-lg shadow-sm">
          <FiAward className="mr-2 h-5 w-5" />
          {profile?.coins.toLocaleString() || 0} Coins
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Purchase Failed: {error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiCheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item, index) => {
          const isOwned = inventoryIds.has(item.id)
          const canAfford = profile && profile.coins >= item.price
          const isDisabled = isOwned || !canAfford || purchasing === item.id

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg flex flex-col"
            >
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{item.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                
                <div className="mt-4 flex justify-center">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiShoppingBag className="h-10 w-10 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {item.price.toLocaleString()} Coins
                </span>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={isDisabled}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    isOwned
                      ? 'bg-green-500 focus:ring-green-500'
                      : canAfford
                      ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {purchasing === item.id ? 'Processing...' : isOwned ? 'Owned' : canAfford ? 'Buy Now' : 'Too Expensive'}
                </button>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}