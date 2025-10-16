'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'

interface Conversation {
  conversation_id: string
  last_message_at: string
  last_message_content: string | null
  other_user_id: string
  other_user_username: string
  other_user_avatar_url: string | null
}

interface ConversationListProps {
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
}

export default function ConversationList({ selectedConversationId, onSelectConversation }: ConversationListProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return
      setLoading(true)
      const { data, error } = await supabase.rpc('get_user_conversations')
      
      if (error) {
        console.error('Error fetching conversations:', error)
      } else {
        setConversations(data || [])
      }
      setLoading(false)
    }

    fetchConversations()
  }, [user])

  useEffect(() => {
    const channel = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        supabase.rpc('get_user_conversations').then(({ data }) => {
          if (data) setConversations(data)
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading conversations...</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
      </div>
      <div className="flex-grow overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="p-4 text-gray-500 dark:text-gray-400">No conversations yet.</p>
        ) : (
          <ul>
            {conversations.map((convo) => (
              <li key={convo.conversation_id}>
                <button
                  onClick={() => onSelectConversation(convo.conversation_id)}
                  className={`w-full text-left p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedConversationId === convo.conversation_id ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-gray-600">{convo.other_user_username?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <p className="font-semibold text-gray-900 dark:text-white">{convo.other_user_username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{convo.last_message_content || '...'}</p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(convo.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}