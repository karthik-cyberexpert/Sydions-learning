'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { FiSearch, FiUserPlus, FiClock, FiCheck } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Profile = {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
}

type FriendRequest = {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
}

export default function UsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (!user) return;
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .neq('id', user.id)
      
      if (usersError) throw usersError
      setUsers(usersData || [])

      const { data: requestsData, error: requestsError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      
      if (requestsError) throw requestsError
      setRequests(requestsData || [])

    } catch (error) {
      console.error('Error fetching users data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({ sender_id: user.id, receiver_id: receiverId })
      .select()
      .single()
    
    if (error) {
      console.error('Error sending friend request:', error)
    } else if (data) {
      setRequests(prev => [...prev, data])
    }
  }

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(u => 
      (u.username?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [users, searchTerm])

  const getFriendshipStatus = (otherUserId: string) => {
    if (!user) return 'not_friends';
    const request = requests.find(
      r => (r.sender_id === otherUserId && r.receiver_id === user.id) || 
           (r.sender_id === user.id && r.receiver_id === otherUserId)
    )
    if (!request) return 'not_friends'
    if (request.status === 'accepted') return 'friends'
    if (request.status === 'pending' && request.sender_id === user.id) return 'request_sent'
    if (request.status === 'pending' && request.receiver_id === user.id) return 'request_received'
    return 'not_friends'
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Find Users</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Search for users and send them friend requests.</p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FiSearch className="h-5 w-5 text-gray-400" /></div>
        <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="Search by username or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((u, index) => {
          const status = getFriendshipStatus(u.id)
          return (
            <motion.div key={u.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-6 flex flex-col items-center text-center">
              <Link href={`/profile/${u.id}`} className="w-full">
                <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4 mx-auto">
                  <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-300">{u.username?.charAt(0).toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{u.username}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{u.full_name}</p>
              </Link>
              <div className="mt-4">
                {status === 'not_friends' && <button onClick={() => sendFriendRequest(u.id)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"><FiUserPlus className="mr-2" /> Add Friend</button>}
                {status === 'request_sent' && <button disabled className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300"><FiClock className="mr-2" /> Request Sent</button>}
                {status === 'request_received' && <button onClick={() => router.push('/friends')} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-500 hover:bg-yellow-600">Respond to Request</button>}
                {status === 'friends' && <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-200 rounded-md"><FiCheck className="mr-2" /> Friends</div>}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}