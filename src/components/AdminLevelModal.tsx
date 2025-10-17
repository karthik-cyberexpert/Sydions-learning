import React from 'react'
import { FiX, FiAlertCircle } from 'react-icons/fi'

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

interface FormData {
  level: number
  xp_required: number
  rank_name: string
  rewards: { item_id: string, item_name: string }[]
}

interface AdminLevelModalProps {
  isOpen: boolean
  onClose: () => void
  editingLevel: Level | null
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  shopItems: ShopItem[]
  onSave: (e: React.FormEvent) => void
  error: string | null
}

export default function AdminLevelModal({
  isOpen,
  onClose,
  editingLevel,
  formData,
  setFormData,
  shopItems,
  onSave,
  error,
}: AdminLevelModalProps) {

  if (!isOpen) return null

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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {editingLevel ? `Edit Level ${editingLevel.level}` : 'Create New Level'}
        </h3>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
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

        <form onSubmit={onSave} className="space-y-4">
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
                onChange={(e) => setFormData(prev => ({...prev, level: parseInt(e.target.value)}))} 
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
                onChange={(e) => setFormData(prev => ({...prev, xp_required: parseInt(e.target.value)}))} 
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
              onChange={(e) => setFormData(prev => ({...prev, rank_name: e.target.value}))} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              placeholder="e.g., Master Dev, Legend"
            />
          </div>

          {/* Reward Assignment */}
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