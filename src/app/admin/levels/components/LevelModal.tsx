'use client'

import { useState, useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import { Level, ShopItem, LevelFormData } from '../types'

interface LevelModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: LevelFormData, editingLevel: Level | null) => void
  editingLevel: Level | null
  shopItems: ShopItem[]
  levels: Level[]
}

export default function LevelModal({ isOpen, onClose, onSave, editingLevel, shopItems, levels }: LevelModalProps) {
  const [formData, setFormData] = useState<LevelFormData>({
    level: 0,
    xp_required: 0,
    rank_name: '',
    rewards: [],
  })

  useEffect(() => {
    if (isOpen) {
      if (editingLevel) {
        setFormData({
          level: editingLevel.level,
          xp_required: editingLevel.xp_required,
          rank_name: editingLevel.rank_name || '',
          rewards: editingLevel.rewards.map(r => ({ item_id: r.item_id, item_name: r.name })),
        })
      } else {
        setFormData({
          level: levels.length > 0 ? Math.max(...levels.map(l => l.level)) + 1 : 1,
          xp_required: levels.length > 0 ? Math.max(...levels.map(l => l.xp_required)) + 1000 : 1000,
          rank_name: '',
          rewards: [],
        })
      }
    }
  }, [isOpen, editingLevel, levels])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData, editingLevel)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {editingLevel ? `Edit Level ${editingLevel.level}` : 'Create New Level'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <div>
            <label htmlFor="rank_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rank Name</label>
            <input 
              type="text" 
              name="rank_name" 
              id="rank_name" 
              required 
              value={formData.rank_name} 
              onChange={(e) => setFormData({...formData, rank_name: e.target.value})} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder="e.g., Master Dev, Legend"
            />
          </div>

          <div>
            <label htmlFor="reward_item" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Level-Up Reward</label>
            <select 
              id="reward_item" 
              onChange={handleRewardChange} 
              value=""
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="" disabled>Select an item to reward...</option>
              {shopItems.map(item => (
                <option key={item.id} value={item.id} disabled={formData.rewards.some(r => r.item_id === item.id)}>
                  {item.name} ({item.item_type})
                </option>
              ))}
            </select>
          </div>

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
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Cancel</button>
            <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
              {editingLevel ? 'Save Changes' : 'Create Level'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}