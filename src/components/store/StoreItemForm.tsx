'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

interface StoreItemFormProps {
  onSuccess: () => void
  onError: (message: string) => void
}

export default function StoreItemForm({ onSuccess, onError }: StoreItemFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [type, setType] = useState('avatar') // 'avatar' or 'banner'
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0])
    } else {
      setImageFile(null)
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `store_items/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('store-assets') // Assuming a bucket named 'store-assets'
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`)
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('store-assets')
      .getPublicUrl(filePath)

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Could not retrieve public URL after upload.')
    }

    return publicUrlData.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !description || price <= 0 || !imageFile) {
      onError('Please fill in all fields and upload an image.')
      return
    }

    setLoading(true)
    let imageUrl = ''

    try {
      // 1. Upload the file
      imageUrl = await uploadFile(imageFile)

      // 2. Insert the item data with the new URL
      const { error: insertError } = await supabase
        .from('store_items')
        .insert([
          {
            name,
            description,
            price,
            type,
            image_url: imageUrl, // Using the uploaded URL
          },
        ])

      if (insertError) throw insertError

      // 3. Success
      onSuccess()
      setName('')
      setDescription('')
      setPrice(0)
      setType('avatar')
      setImageFile(null)

    } catch (error) {
      console.error('Error creating store item:', error)
      onError(error instanceof Error ? error.message : 'An unknown error occurred during item creation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Store Item</h2>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Item Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Price (Coins)
          </label>
          <input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            required
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Item Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
          >
            <option value="avatar">Avatar</option>
            <option value="banner">Banner</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {type === 'avatar' ? 'Avatar Image (Upload)' : 'Banner Image (Upload)'}
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          required
          className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100
          "
        />
        {imageFile && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Selected file: {imageFile.name}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Uploading & Creating...' : 'Create Item'}
      </button>
    </form>
  )
}