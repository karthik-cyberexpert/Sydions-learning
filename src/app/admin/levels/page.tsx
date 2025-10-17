'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FiPlus, FiAlertCircle } from 'react-icons/fi'
import AdminLevelListItem from '@/components/AdminLevelListItem'
import AdminLevelModal from '@/components/AdminLevelModal'

// --- Interfaces ---

interface RewardItem {
  id: string
  item_id: string
  name: string
  item_type: string
}

interface Level {
  level: number
  xp_required: number
  rank_name: string
  rewards: RewardItem[]
}

interface ShopItem {
  id: string
  name: string
  item_type: string
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

// Corrected RawLevelData to expect level_rewards as an array of RawRewardData
interface RawLevelData {
  level: number
  xp_required: number
  rank_name: string
  level_rewards: RawRewardData[]
}

interface FormData {
  level: number
  xp_required: number
  rank_name: string
  rewards: { item_id: string, item_name: string }[]
}

// --- Component ---

export default function AdminLevels() {
  const [levels, setLevels] = useState<Level[]>([])
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    level: 0,
    xp_required: 0,
    rank_name: '',
    rewards: [],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch Levels and Rewards
      const { data: levelsData, error: levelsError } = await supabase
        .from('levels')
        .select(`
          level,
          xp_required,
          rank_name,
          level_rewards (
            id,
            item_id,
            shop_items ( id, name, item_type )
          )
        `)
        .order('level', { ascending: true })
      
      if (levelsError) throw levelsError

      const transformedLevels: Level[] = (levelsData as RawLevelData[] || []).map((l) => ({
        level: l.level,
        xp_required: l.xp_required,
        rank_name: l.rank_name,
        rewards: (l.level_rewards || []).map((r) => ({
          id: r.id,
          item_id: r.item_id,
          // Safely access the first element of the shop_items array
          name: r.shop_items?.[0]?.name || 'Unknown Item',
          item_type: r.shop_items?.[0]?.item_type || 'Unknown Type',
        })),
      }))
      setLevels(transformedLevels)

      // 2. Fetch all Shop Items for reward selection
      const { data: itemsData, error: itemsError } = await supabase
        .from('shop_items')
        .select('id, name, item_type')
        .order('name', { ascending: true })
      
      if (itemsError) throw itemsError
      setShopItems(itemsData as ShopItem[] || [])

    } catch (err: unknown) {
      // FIX: Correctly closing the catch block
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (level: Level | null = null) => {
    setEditingLevel(level)
    if (level) {
      setFormData({
        level: level.level,
        xp_required: level.xp_required,
        rank_name: level.rank_name || '',
        rewards: level.rewards.map(r => ({ item_id: r.item_id, item_name: r.name })),
      })
    } else {
      setFormData({
        level: levels.length > 0 ? Math.max(...levels.map(l => l.level)) + 1 : 1,
        xp_required: levels.length > 0 ? Math.max(...levels.map(l => l.xp_required)) + 1000 : 1000,
        rank_name: '',
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
        rank_name: formData.rank_name,
      }

      if (editingLevel) {
        // Update existing level
        const { error: updateError } = await supabase
          .from('levels')
          .update(levelPayload)
          .eq('level', editingLevel.level)
        
        if (updateError) throw updateError

        // 2. Manage Rewards: Delete existing rewards for this level first
        const { error: deleteError } = await supabase
          .from('level_rewards')
          .delete()
          .eq('level', editingLevel.level)
        
        if (deleteError) throw deleteError

      } else {
        // Create new level
        const { error: insertError } = await supabase
          .from('levels')
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
          .from('level_rewards')
          .insert(rewardPayload)
        
        if (rewardInsertError) throw rewardInsertError
      }
      
      setIsModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    }
  }

  const handleDelete = async (level: number) => {
    if (!window.confirm(`Are you sure you want to delete Level ${level} and all associated rewards? This action cannot be undone.`)) return
    
    try {
      const { error } = await supabase
        .from('levels')
        .delete()
        .eq('level', level)
      
      if (error) throw error
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
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
            Manage Levels & Rewards
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define XP thresholds and assign exclusive rewards for each level.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiPlus className="mr-2" />
          New Level
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
            <li className="p-6 text-center text-gray-500 dark:text-gray-400">No levels defined yet.</li>
          ) : (
            levels.map((level) => (
              <AdminLevelListItem 
                key={level.level} 
                levelData={level} 
                onEdit={handleOpenModal} 
                onDelete={handleDelete} 
              />
            ))
          )}
        </ul>
      </div>

      <AdminLevelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingLevel={editingLevel}
        formData={formData}
        setFormData={setFormData}
        shopItems={shopItems}
        onSave={handleSave}
        error={error}
      />
    </div>
  )
}