'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FiPlus, FiEdit, FiTrash, FiAlertCircle, FiShoppingBag } from 'react-icons/fi'
import { motion } from 'framer-motion'

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  item_type: 'avatar' | 'banner' | 'badge'
  is_reward_only: boolean
}

const ITEM_TYPES = ['avatar', 'banner', 'badge']

export default function AdminShop() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    item_type: 'avatar',
    is_reward_only: false,
  })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setItems(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (item: ShopItem | null = null) => {
    setEditingItem(item)
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image_url || '',
        item_type: item.item_type,
        is_reward_only: item.is_reward_only,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        image_url: '',
        item_type: 'avatar',
        is_reward_only: false,
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        image_url: formData.image_url || null,
        item_type: formData.item_type,
        is_reward_only: formData.is_reward_only,
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('shop_items')
          .update(payload)
          .eq('id', editingItem.id)
        
        if (error) throw error
      } else {
        // Create new item
        const { error } = await supabase
          .from('shop_items')
          .insert(payload)
        
        if (error) throw error
      }
      
      setIsModalOpen(false)
      fetchItems()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('shop_items')
        .delete()
        .eq('id', itemId)
      
      if (error) throw error
      fetchItems()
    } catch (err: any) {
      setError(err.message)
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
            Manage Shop Items
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage cosmetic items available in the user shop.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiPlus className="mr-2" />
          New Item
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
          {items.length === 0 ? (
            <li className="p-6 text-center text-gray-500 dark:text-gray-400">No shop items created yet.</li>
          ) : (
            items.map((item) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <FiShoppingBag className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description.substring(0, 50)}...</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.is_reward_only ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                    {item.is_reward_only ? 'Reward Only' : `${item.price} Coins`}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
                  </span>
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FiEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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

      {/* Modal for Create/Edit Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingItem ? 'Edit Shop Item' : 'Create New Shop Item'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" name="name" id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea name="description" id="description" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="item_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <select name="item_type" id="item_type" required value={formData.item_type} onChange={(e) => setFormData({...formData, item_type: e.target.value as 'avatar' | 'banner' | 'badge'})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {ITEM_TYPES.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (Coins)</label>
                  <input type="number" name="price" id="price" required min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL (for Avatar/Banner/Badge icon)</label>
                <input type="url" name="image_url" id="image_url" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="https://example.com/image.png" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="is_reward_only" id="is_reward_only" checked={formData.is_reward_only} onChange={(e) => setFormData({...formData, is_reward_only: e.target.checked})} className="h-4 w-4 text-indigo-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600" />
                <label htmlFor="is_reward_only" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Reward Only (Do not show in public shop)</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Cancel</button>
                <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}