'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { FiX, FiUsers } from 'react-icons/fi'

interface Friend {
  id: string
  username: string
}

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onGroupCreated: (conversationId: string) => void
}

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
  const { user } = useAuth()
  const [groupName, setGroupName] = useState('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !user) return

    const fetchFriends = async () => {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('sender:sender_id(id, username), receiver:receiver_id(id, username)')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      if (error) {
        console.error('Error fetching friends:', error)
        return
      }

      const friendProfiles = data.map(r => (r.sender.id === user.id ? r.receiver : r.sender))
      setFriends(friendProfiles)
    }

    fetchFriends()
  }, [isOpen, user])

  const handleSelectFriend = (friendId: string) => {
    setSelectedFriends(prev => {
      const newSet = new Set(prev)
      if (newSet.has(friendId)) {
        newSet.delete(friendId)
      } else {
        newSet.add(friendId)
      }
      return newSet
    })
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriends.size === 0) {
      setError('Please provide a group name and select at least one friend.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const { data: conversationId, error: rpcError } = await supabase.rpc('create_group_conversation', {
        p_group_name: groupName,
        p_member_ids: Array.from(selectedFriends),
      })

      if (rpcError) throw rpcError

      onGroupCreated(conversationId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Group</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <FiX className="h-6 w-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Group Name</label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Friends</p>
            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 space-y-2">
              {friends.length > 0 ? (
                friends.map(friend => (
                  <label key={friend.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedFriends.has(friend.id)}
                      onChange={() => handleSelectFriend(friend.id)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{friend.username}</span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center">No friends found.</p>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end">
            <button
              onClick={handleCreateGroup}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              <FiUsers className="mr-2" />
              {loading ? 'Creating...' : `Create Group (${selectedFriends.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}