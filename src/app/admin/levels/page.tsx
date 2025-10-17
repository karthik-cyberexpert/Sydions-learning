'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FiPlus, FiAlertCircle } from 'react-icons/fi'
import { Level, ShopItem, RawLevelData, LevelFormData } from './types'
import LevelListItem from './components/LevelListItem'
import LevelModal from './components/LevelModal'

export default function AdminLevels() {
  const [levels, setLevels] = useState<Level[]>([])
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<Level | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: levelsData, error: levelsError } = await supabase
        .from('levels')
        .select(`
          level,
          xp_required,
          rank_name,
          level_rewards (
            id,
            item_id,
            shop_items ( name, item_type )
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
          name: r.shop_items?.[0]?.name || 'Unknown Item',
          item_type: r.shop_items?.[0]?.item_type || 'Unknown Type',
        })),
      }))
      setLevels(transformedLevels)

      const { data: itemsData, error: itemsError } = await supabase
        .from('shop_items')
        .select('id, name, item_type')
        .order('name', { ascending: true })
      
      if (itemsError) throw itemsError
      setShopItems(itemsData as ShopItem[] || [])

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenModal = (level: Level | null = null) => {
    setEditingLevel(level)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingLevel(null)
  }

  const handleSave = async (formData: LevelFormData, currentEditingLevel: Level | null) => {
    setError(null)
    
    try {
      const levelPayload = {
        level: formData.level,
        xp_required: formData.xp_required,
        rank_name: formData.rank_name,
      }

      if (currentEditingLevel) {
        const { error: updateError } = await supabase.from('levels').update(levelPayload).eq('level', currentEditingLevel.level)
        if (updateError) throw updateError
        const { error: deleteError } = await supabase.from('level_rewards').delete().eq('level', currentEditingLevel.level)
        if (deleteError) throw deleteError
      } else {
        const { error: insertError } = await supabase.from('levels').insert(levelPayload)
        if (insertError) throw insertError
      }

      if (formData.rewards.length > 0) {
        const rewardPayload = formData.rewards.map(r => ({
          level: formData.level,
          item_id: r.item_id,
        }))
        const { error: rewardInsertError } = await supabase.from('level_rewards').insert(rewardPayload)
        if (rewardInsertError) throw rewardInsertError
      }
      
      handleCloseModal()
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.')
    }
  }

  const handleDelete = async (level: number) => {
    if (!window.confirm(`Are you sure you want to delete Level ${level} and all associated rewards? This action cannot be undone.`)) return
    
    try {
      const { error } = await supabase.from('levels').delete().eq('level', level)
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage Levels & Rewards</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Define XP thresholds and assign exclusive rewards for each level.</p>
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
            <div className="flex-shrink-0"><FiAlertCircle className="h-5 w-5 text-red-400" /></div>
            <div className="ml-3"><h3 className="text-sm font-medium text-red-800">Error: {error}</h3></div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {levels.length === 0 ? (
            <li className="p-6 text-center text-gray-500 dark:text-gray-400">No levels defined yet.</li>
          ) : (
            levels.map((level) => (
              <LevelListItem
                key={level.level}
                level={level}
                onEdit={handleOpenModal}
                onDelete={handleDelete}
              />
            ))
          )}
        </ul>
      </div>

      <LevelModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingLevel={editingLevel}
        shopItems={shopItems}
        levels={levels}
      />
    </div>
  )
}