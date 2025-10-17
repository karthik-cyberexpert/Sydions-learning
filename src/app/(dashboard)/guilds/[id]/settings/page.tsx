'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { FiAlertCircle, FiSave, FiCheckCircle, FiTrash2, FiUser, FiPackage } from 'react-icons/fi'

interface Guild {
  id: string
  name: string
  description: string
  owner_id: string
  avatar_url: string | null
  banner_url: string | null
  is_public: boolean
}

interface GuildInventoryItem {
  id: string
  item_id: string
  shop_items: {
    name: string
    image_url: string | null
    item_type: 'avatar' | 'banner'
  }
}

export default function GuildSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [guild, setGuild] = useState<Guild | null>(null)
  const [inventory, setInventory] = useState<GuildInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({ description: '', is_public: true })

  const fetchData = useCallback(async () => {
    if (!id || !user) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('guilds').select('*').eq('id', id).single()
      if (error) throw error
      if (data.owner_id !== user.id) throw new Error('You do not have permission to edit this guild.')
      setGuild(data)
      setFormData({ description: data.description || '', is_public: data.is_public })

      const { data: invData, error: invError } = await supabase.from('guild_inventory').select(`id, item_id, shop_items (name, image_url, item_type)`).eq('guild_id', id)
      if (invError) throw invError
      setInventory(invData as any)

    } catch (err: any) {
      setError(err.message)
      setTimeout(() => router.push(`/guilds/${id}`), 3000)
    } finally {
      setLoading(false)
    }
  }, [id, user, router])

  useEffect(() => { fetchData() }, [fetchData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === 'checkbox'
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(null); setSuccess(null)
    try {
      const { error } = await supabase.from('guilds').update({ description: formData.description, is_public: formData.is_public }).eq('id', id)
      if (error) throw error
      setSuccess('Guild settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEquip = async (item: GuildInventoryItem) => {
    setSaving(true)
    try {
      const payload = item.shop_items.item_type === 'avatar' ? { avatar_url: item.shop_items.image_url } : { banner_url: item.shop_items.image_url }
      const { error } = await supabase.from('guilds').update(payload).eq('id', id)
      if (error) throw error
      setGuild(prev => prev ? { ...prev, ...payload } : null)
      setSuccess(`${item.shop_items.item_type} updated!`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDisband = async () => {
    if (!guild || !window.confirm(`Are you sure you want to disband ${guild.name}? This will remove all members and cannot be undone.`)) return
    setSaving(true)
    try {
      await supabase.from('profiles').update({ guild_id: null, is_guildleader: false }).eq('guild_id', guild.id)
      const { error } = await supabase.from('guilds').delete().eq('id', guild.id)
      if (error) throw error
      router.push('/guilds')
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  if (!guild) return <div className="text-center py-12"><FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Guild not found or you don't have permission.</h3></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Guild Settings for &quot;{guild.name}&quot;</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your guild's information and settings.</p></div>
      
      {error && <div className="mb-4 rounded-md bg-red-50 p-4"><div className="flex"><div className="flex-shrink-0"><FiAlertCircle className="h-5 w-5 text-red-400" /></div><div className="ml-3"><h3 className="text-sm font-medium text-red-800">{error}</h3></div></div></div>}
      {success && <div className="mb-4 rounded-md bg-green-50 p-4"><div className="flex"><div className="flex-shrink-0"><FiCheckCircle className="h-5 w-5 text-green-400" /></div><div className="ml-3"><h3 className="text-sm font-medium text-green-800">{success}</h3></div></div></div>}
      
      <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Guild Name</label><div className="mt-1"><input type="text" value={guild.name} disabled className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400" /><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Guild names cannot be changed.</p></div></div>
          <div><label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><div className="mt-1"><textarea id="description" name="description" rows={4} maxLength={500} value={formData.description} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></div></div>
          <div className="flex items-start"><div className="flex items-center h-5"><input id="is_public" name="is_public" type="checkbox" checked={formData.is_public} onChange={handleChange} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded" /></div><div className="ml-3 text-sm"><label htmlFor="is_public" className="font-medium text-gray-700 dark:text-gray-300">Public Guild</label><p className="text-gray-500 dark:text-gray-400">If unchecked, users will need to request to join.</p></div></div>
          <div className="flex justify-end space-x-3"><button type="button" onClick={() => router.push(`/guilds/${id}`)} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">Back to Guild</button><button type="submit" disabled={saving} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"><FiSave className="mr-2 h-5 w-5" />{saving ? 'Saving...' : 'Save Settings'}</button></div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Guild Inventory</h3>
        <div className="space-y-4">
          {inventory.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center"><div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mr-3">{item.shop_items.image_url ? <img src={item.shop_items.image_url} alt={item.shop_items.name} className="w-full h-full object-cover" /> : <FiPackage />}</div><div><p className="font-medium">{item.shop_items.name}</p><p className="text-xs text-gray-500">{item.shop_items.item_type}</p></div></div>
              <button onClick={() => handleEquip(item)} disabled={saving} className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">Equip</button>
            </div>
          ))}
          {inventory.length === 0 && <p className="text-center text-gray-500">Your guild has no items. Purchase some from the Guild Store!</p>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow px-4 py-5 sm:rounded-lg sm:p-6 border-t-4 border-red-500">
        <h3 className="text-lg font-medium text-red-700 dark:text-red-400">Danger Zone</h3>
        <div className="mt-4 flex items-center justify-between">
          <div><p className="font-medium">Disband Guild</p><p className="text-sm text-gray-500 dark:text-gray-400">This will permanently delete the guild and remove all members. This action cannot be undone.</p></div>
          <button onClick={handleDisband} disabled={saving} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"><FiTrash2 className="mr-2" />{saving ? 'Disbanding...' : 'Disband Guild'}</button>
        </div>
      </div>
    </div>
  )
}