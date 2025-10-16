'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { FiUserCheck, FiUserX, FiXCircle } from 'react-icons/fi'
import { motion } from 'framer-motion'
import Link from 'next/link'

type Profile = {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
}

type FriendRequestWithProfiles = {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  sender: Profile
  receiver: Profile
}

export default function FriendsPage() {
  const { user } = useAuth()
  const [incoming, setIncoming] = useState<FriendRequestWithProfiles[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [sent, setSent] = useState<FriendRequestWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('friends')

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*, sender:sender_id(id, username, full_name, avatar_url), receiver:receiver_id(id, username, full_name, avatar_url)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      if (error) throw error

      const incomingReqs = data.filter(r => r.receiver_id === user.id && r.status === 'pending')
      const sentReqs = data.filter(r => r.sender_id === user.id && r.status === 'pending')
      const acceptedReqs = data.filter(r => r.status === 'accepted')

      setIncoming(incomingReqs as any)
      setSent(sentReqs as any)
      
      const friendProfiles = acceptedReqs.map(r => r.sender_id === user.id ? r.receiver : r.sender)
      setFriends(friendProfiles as any)

    } catch (err) {
      console.error("Error fetching friends data:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRequest = async (requestId: string, newStatus: 'accepted' | 'declined') => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId)
    
    if (error) console.error(`Error handling request:`, error)
    else fetchData()
  }

  const cancelRequest = async (requestId: string) => {
    const { error } = await supabase.from('friend_requests').delete().eq('id', requestId)
    if (error) console.error('Error cancelling request:', error)
    else fetchData()
  }

  const removeFriend = async (friendId: string) => {
    if (!user) return
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('status', 'accepted')
      .or(`(sender_id.eq.${user.id},receiver_id.eq.${friendId}),(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
    
    if (error) console.error('Error removing friend:', error)
    else fetchData()
  }

  const renderTabs = () => (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button onClick={() => setActiveTab('friends')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'friends' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Friends ({friends.length})</button>
        <button onClick={() => setActiveTab('incoming')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'incoming' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Incoming ({incoming.length})</button>
        <button onClick={() => setActiveTab('sent')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'sent' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Sent ({sent.length})</button>
      </nav>
    </div>
  )

  const renderContent = () => {
    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>

    switch (activeTab) {
      case 'friends':
        return friends.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map(friend => (
              <motion.div key={friend.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 flex flex-col items-center text-center">
                <Link href={`/profile/${friend.id}`} className="w-full">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white hover:underline">{friend.username}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{friend.full_name}</p>
                </Link>
                <button onClick={() => removeFriend(friend.id)} className="mt-4 inline-flex items-center px-3 py-1 border border-red-500 text-sm font-medium rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><FiUserX className="mr-2" /> Remove</button>
              </motion.div>
            ))}
          </div>
        ) : <p className="text-center text-gray-500 py-8">You have no friends yet. Go to the Users page to find some!</p>

      case 'incoming':
        return incoming.length > 0 ? (
          <ul className="space-y-4">
            {incoming.map(req => (
              <li key={req.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex items-center justify-between">
                <Link href={`/profile/${req.sender.id}`}><p className="font-medium text-gray-900 dark:text-white hover:underline">{req.sender.username}</p></Link>
                <div className="flex space-x-2">
                  <button onClick={() => handleRequest(req.id, 'accepted')} className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300"><FiUserCheck /></button>
                  <button onClick={() => handleRequest(req.id, 'declined')} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300"><FiUserX /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-center text-gray-500 py-8">No incoming friend requests.</p>

      case 'sent':
        return sent.length > 0 ? (
          <ul className="space-y-4">
            {sent.map(req => (
              <li key={req.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 flex items-center justify-between">
                <Link href={`/profile/${req.receiver.id}`}><p className="font-medium text-gray-900 dark:text-white hover:underline">{req.receiver.username}</p></Link>
                <button onClick={() => cancelRequest(req.id)} className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600"><FiXCircle className="mr-2" /> Cancel</button>
              </li>
            ))}
          </ul>
        ) : <p className="text-center text-gray-500 py-8">You have no pending sent requests.</p>
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Friends</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your friends and friend requests.</p>
      </div>
      {renderTabs()}
      <div className="mt-6">{renderContent()}</div>
    </div>
  )
}