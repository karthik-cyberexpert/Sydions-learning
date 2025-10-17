'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import ConversationList from '@/components/messages/ConversationList'
import ChatWindow from '@/components/messages/ChatWindow'

// A basic type for a conversation
interface Conversation {
  id: string;
  // other properties can be added here, e.g., participant names
}

export default function MessagesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // This is a placeholder for fetching user-specific conversations.
        // The actual query will depend on the database schema.
        const { data: convosData, error } = await supabase
          .from('conversations')
          .select('id')
        
        if (error) {
          console.error('Error fetching conversations:', error)
        } else {
          setConversations(convosData as Conversation[] || [])
          // Optionally, select the first conversation by default
          if (convosData && convosData.length > 0 && !selectedConversationId) {
            setSelectedConversationId(convosData[0].id);
          }
        }
      }
      setLoading(false)
    }

    fetchInitialData()
  }, [])

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