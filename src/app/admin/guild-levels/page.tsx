'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FiPlus, FiEdit, FiTrash, FiAlertCircle, FiAward } from 'react-icons/fi'
import { motion } from 'framer-motion'

interface RewardItem {
  id: string
  item_id: string
  name: string
  item_type: string
}

interface GuildLevel {
  level: number
  xp_required: number
  rewards: RewardItem[]
}

// Corrected RawRewardData to expect shop_items as an array
interface RawRewardData {
  id: string
  item_id: string
  shop_items: {
    name: string
    item_type: string
  }[]
}

// Corrected RawLevelData to expect guild_level_rewards as an array of RawRewardData
interface RawLevelData {
  level: number
  xp_required: number
  guild_level_rewards: RawRewardData[]
}

export default function AdminGuildLevels() {
  const [levels, setLevels] = useState<GuildLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<GuildLevel | null>(null)
  
  const [formData, setFormData] = useState({
    level: 0,
    xp_required: 0,
    reward_item_id: '',
  })

  useEffect(() => {
    fetchLevels()
  }, [])

  const fetchLevels = async () => {
    setLoading(true)
    setError(null)
    try {
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

      // FIX: The type assertion is now correct due to updated interfaces
      const transformedLevels: GuildLevel[] = (levelsData as RawLevelData[] || []).map((l) => ({
        level: l.level,
        xp_required: l.xp_required,
        rewards: (l.guild_level_rewards || []).map((r) => ({
          id: r.id,
          item_id: r.item_id,
          // FIX: Safely access the first element of the shop_items array
          name: r.shop_items?.[0]?.name || 'Unknown Item',
          item_type: r.shop_items?.[0]?.item_type || 'Unknown Type',
        })),
      }))
      
      setLevels(transformedLevels)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
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
        reward_item_id: level.rewards[0]?.item_id || '', // Assuming one reward for simplicity in form
      })
    } else {
      setFormData({
        level: 0,
        xp_required: 0,
        reward_item_id: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      // 1. Upsert the Guild Level
      const levelPayload = {
        level: formData.level,
        xp_required: formData.xp_required,
      }

      const { error: levelError } = await supabase
        .from('guild_levels')
        .upsert(levelPayload, { onConflict: 'level' })
      
      if (levelError) throw levelError

      // 2. Handle Reward (Assuming one reward per level for simplicity in this admin panel)
      if (formData.reward_item_id) {
        // First, delete existing rewards for this level to simplify upsert logic
        await supabase.from('guild_level_rewards').delete().eq('level', formData.level)

        const rewardPayload = {
          level: formData.level,
          item_id: formData.reward_item_id,
        }
        const { error: rewardError } = await supabase.from('guild_level_rewards').insert(rewardPayload)
        if (rewardError) throw rewardError
      }
      
      setIsModalOpen(false)
      fetchLevels()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    }
  }

  const handleDelete = async (level: number) => {
    if (!window.confirm(`Are you sure you want to delete Guild Level ${level}? This will also delete associated rewards.`)) return
    
    try {
      // Deleting the level should cascade delete the rewards if the foreign key is set up correctly
      const { error } = await supabase.from('guild_levels').delete().eq('level', level)
      if (error) throw error
      fetchLevels()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage Guild Levels</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Define XP requirements and rewards for guild progression.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"><FiPlus className="mr-2" />New Level</button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-4"><div className="flex"><div className="flex-shrink-0"><FiAlertCircle className="h-5 w-5 text-red-400" /></div><div className="ml-3"><h3 className="text-sm font-medium text-red-800">Error: {error}</h3></div></div></div>}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {levels.length === 0 ? <li className="p-6 text-center text-gray-500 dark:text-gray-400">No guild levels defined yet.</li> : levels.map((level) => (
            <motion.li key={level.level} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center"><FiAward className="h-5 w-5 text-indigo-600" /></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Level {level.level}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{level.xp_required.toLocaleString()} XP Required</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Rewards: {level.rewards.length > 0 ? level.rewards.map(r => r.name).join(', ') : 'None'}
                </div>
                <button onClick={() => handleOpenModal(level)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><FiEdit className="h-5 w-5" /></button>
                <button onClick={() => handleDelete(level.level)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><FiTrash className="h-5 w-5" /></button>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{editingLevel ? `Edit Level ${editingLevel.level}` : 'Create New Level'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div><label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Level Number</label><input type="number" name="level" id="level" required min="1" value={formData.level} onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><label htmlFor="xp_required" className="block text-sm font-medium text-gray-700 dark:text-gray-300">XP Required</label><input type="number" name="xp_required" id="xp_required" required min="0" value={formData.xp_required} onChange={(e) => setFormData({...formData, xp_required: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div>
              <div><label htmlFor="reward_item_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reward Item ID (from shop_items)</label><input type="text" name="reward_item_id" id="reward_item_id" value={formData.reward_item_id} onChange={(e) => setFormData({...formData, reward_item_id: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000" /></div>
              <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Cancel</button><button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">{editingLevel ? 'Save Changes' : 'Create Level'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}