'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import ConversationList, { Conversation } from '@/components/messages/ConversationList'
import ChatWindow from '@/components/messages/ChatWindow'

export default function MessagesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchInitialData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      // For complex queries like fetching conversations with participants and last messages,
      // it's often best to use a database function (RPC).
      // This assumes a function `get_user_conversations` exists in your Supabase SQL editor.
      const { data: convosData, error } = await supabase.rpc('get_user_conversations')

      if (error) {
        console.error('Error fetching conversations:', error)
        setConversations([])
      } else {
        const fetchedConversations = convosData as Conversation[] || [];
        setConversations(fetchedConversations)
        // Select the first conversation by default if none is selected
        if (fetchedConversations.length > 0 && !selectedConversationId) {
          setSelectedConversationId(fetchedConversations[0].id);
        }
      }
    }
    setLoading(false)
  }, [selectedConversationId]) // Dependency array is correct now

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </div>
      <div className="hidden md:flex w-2/3 flex-col">
       {selectedConversationId ? (
          <ChatWindow user={user} conversationId={selectedConversationId} />
       ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Select a conversation to start chatting.</p>
          </div>
       )}
      </div>
    </div>
  )
}