'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'

interface CreateGroupModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onCreate: (groupName: string, memberIds: string[]) => void
}

interface Friend {
  id: string
  username: string
}

// This type now correctly reflects that Supabase returns joined tables as arrays.
interface FriendRequestResponse {
  sender_id: string
  receiver_id: string
  sender: Friend[]
  receiver: Friend[]
}

export default function CreateGroupModal({ user, isOpen, onClose, onCreate }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])

  const fetchFriends = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          sender_id,
          receiver_id,
          sender:sender_id ( id, username ),
          receiver:receiver_id ( id, username )
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      if (error) throw error

      if (data) {
        // The logic is updated to access the first element of the sender/receiver array.
        const friendProfiles = (data as FriendRequestResponse[]).map(r =>
          (r.sender_id === user.id ? r.receiver[0] : r.sender[0])
        )
        setFriends(friendProfiles)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }, [user])

  useEffect(() => {
    if (isOpen) {
      fetchFriends()
    }
  }, [isOpen, fetchFriends])

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleSubmit = () => {
    if (groupName.trim() && selectedFriends.length > 0 && user) {
      onCreate(groupName, [...selectedFriends, user.id])
      // Reset state
      setGroupName('')
      setSelectedFriends([])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Group Chat</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          />
          <div>
            <h3 className="font-semibold mb-2">Select Members</h3>
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 dark:border-gray-600">
              {friends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <span>{friend.username}</span>
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => handleToggleFriend(friend.id)}
                    className="form-checkbox h-5 w-5 text-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" disabled={!groupName.trim() || selectedFriends.length === 0}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}