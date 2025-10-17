'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FiPlus, FiEdit, FiTrash, FiAlertCircle, FiAward, FiX, FiShield } from 'react-icons/fi'
import { motion } from 'framer-motion'

interface GuildLevel {
  level: number
  xp_required: number
  rewards: Reward[]
}

interface Reward {
  id: string
  item_id: string
  item_name: string
  item_type: string
}

interface ShopItem {
  id: string
  name: string
  item_type: string
}

export default function AdminGuildLevels() {
  const [levels, setLevels] = useState<GuildLevel[]>([])
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<GuildLevel | null>(null)
  
  const [formData, setFormData] = useState({
    level: 0,
    xp_required: 0,
    rewards: [] as { item_id: string, item_name: string }[],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch Guild Levels and Rewards
      const { data: levelsData, error: levelsError } = await supabase
        .from('guild_levels')
        .select(`
          level,
          xp_required,
          guild_level_rewards (
            id,
            item_id,
            shop_items ( name, item_type )
          )
        `)
        .order('level', { ascending: true })
      
      if (levelsError) throw levelsError

      const transformedLevels: GuildLevel[] = (levelsData || []).map((l: any) => ({
        level: l.level,
        xp_required: l.xp_required,
        rewards: (l.guild_level_rewards || []).map((r: any) => ({
          id: r.id,
          item_id: r.item_id,
          item_name: r.shop_items.name,
          item_type: r.shop_items.item_type,
        })),
      }))
      setLevels(transformedLevels)

      // 2. Fetch all Guild Shop Items for reward selection
      const { data: itemsData, error: itemsError } = await supabase
        .from('shop_items')
        .select('id, name, item_type')
        .eq('is_for_guild', true) // Only show guild items
        .order('name', { ascending: true })
      
      if (itemsError) throw itemsError
      setShopItems(itemsData || [])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (level: GuildLevel | null = null) => {
    setEditingLevel(level)
    if (level) {
      setFormData({
        level: level.level,
        xp_required: level.xp_required,
        rewards: level.rewards.map(r => ({ item_id: r.item_id, item_name: r.item_name })),
      })
    } else {
      setFormData({
        level: levels.length > 0 ? Math.max(...levels.map(l => l.level)) + 1 : 1,
        xp_required: levels.length > 0 ? Math.max(...levels.map(l => l.xp_required)) + 5000 : 5000,
        rewards: [],
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      // 1. Insert/Update Level
      const levelPayload = {
        level: formData.level,
        xp_required: formData.xp_required,
      }

      if (editingLevel) {
        // Update existing level
        const { error: updateError } = await supabase
          .from('guild_levels')
          .update(levelPayload)
          .eq('level', editingLevel.level)
        
        if (updateError) throw updateError

        // 2. Manage Rewards: Delete existing rewards for this level first
        const { error: deleteError } = await supabase
          .from('guild_level_rewards')
          .delete()
          .eq('level', editingLevel.level)
        
        if (deleteError) throw deleteError

      } else {
        // Create new level
        const { error: insertError } = await supabase
          .from('guild_levels')
          .insert(levelPayload)
        
        if (insertError) throw insertError
      }

      // 3. Insert new rewards
      if (formData.rewards.length > 0) {
        const rewardPayload = formData.rewards.map(r => ({
          level: formData.level,
          item_id: r.item_id,
        }))
        
        const { error: rewardInsertError } = await supabase
          .from('guild_level_rewards')
          .insert(rewardPayload)
        
        if (rewardInsertError) throw rewardInsertError
      }
      
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (level: number) => {
    if (!window.confirm(`Are you sure you want to delete Guild Level ${level} and all associated rewards? This action cannot be undone.`)) return
    
    try {
      // Deleting the level automatically cascades to guild_level_rewards due to foreign key constraints
      const { error } = await supabase
        .from('guild_levels')
        .delete()
        .eq('level', level)
      
      if (error) throw error
      fetchData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRewardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedItemId = e.target.value
    if (!selectedItemId) return

    const selectedItem = shopItems.find(item => item.id === selectedItemId)
    if (!selectedItem) return

    const isAlreadyAdded = formData.rewards.some(r => r.item_id === selectedItemId)
    
    if (!isAlreadyAdded) {
      setFormData(prev => ({
        ...prev,
        rewards: [...prev.rewards, { item_id: selectedItemId, item_name: selectedItem.name }]
      }))
    }
  }

  const handleRemoveReward = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter(r => r.item_id !== itemId)
    }))
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
            Manage Guild Levels & Rewards
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define XP thresholds and assign exclusive rewards for guild progression.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiPlus className="mr-2" />
          New Guild Level
        </button>
      </div>

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

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {levels.length === 0 ? (
            <li className="p-6 text-center text-gray-500 dark:text-gray-400">No guild levels defined yet.</li>
          ) : (
            levels.map((level) => (
              <motion.li
                key={level.level}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300">{level.level}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Guild Level {level.level}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Requires {level.xp_required.toLocaleString()} XP</p>
                  </div>
                </div>
                <div className="mt-3 md:mt-0 flex flex-wrap items-center space-x-4">
                  <div className="flex flex-wrap gap-2">
                    {level.rewards.length > 0 ? (
                      level.rewards.map(reward => (
                        <span key={reward.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {reward.item_name} ({reward.item_type})
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No rewards assigned</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenModal(level)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(level.level)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiTrash className="h-5 w-5" />
                  </button>
                </div>
              </motion.li>
            ))
          )}
        </ul>
      </div>

      {/* Modal for Create/Edit Level */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingLevel ? `Edit Guild Level ${editingLevel.level}` : 'Create New Guild Level'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Level Number</label>
                  <input 
                    type="number" 
                    name="level" 
                    id="level" 
                    required 
                    min="1" 
                    value={formData.level} 
                    onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    disabled={!!editingLevel}
                  />
                </div>
                <div>
                  <label htmlFor="xp_required" className="block text-sm font-medium text-gray-700 dark:text-gray-300">XP Required</label>
                  <input 
                    type="number" 
                    name="xp_required" 
                    id="xp_required" 
                    required 
                    min="1" 
                    value={formData.xp_required} 
                    onChange={(e) => setFormData({...formData, xp_required: parseInt(e.target.value)})} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                  />
                </div>
              </div>

              {/* Reward Assignment */}
              <div>
                <label htmlFor="reward_item" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Level-Up Reward (Guild Item Only)</label>
                <select 
                  id="reward_item" 
                  onChange={handleRewardChange} 
                  value=""
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="" disabled>Select a guild item to reward...</option>
                  {shopItems.map(item => (
                    <option key={item.id} value={item.id} disabled={formData.rewards.some(r => r.item_id === item.id)}>
                      {item.name} ({item.item_type})
                    </option>
                  ))}
                </select>
                {shopItems.length === 0 && (
                    <p className="mt-2 text-sm text-red-500">No Guild Items found in the shop. Create some first!</p>
                )}
              </div>

              {/* Current Rewards List */}
              {formData.rewards.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Rewards:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.rewards.map(reward => (
                      <span key={reward.item_id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {reward.item_name}
                        <button type="button" onClick={() => handleRemoveReward(reward.item_id)} className="ml-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-100">
                          <FiX className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Cancel</button>
                <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                  {editingLevel ? 'Save Changes' : 'Create Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}