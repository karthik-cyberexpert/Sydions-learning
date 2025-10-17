'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import ConversationList, { Conversation } from '@/components/messages/ConversationList'
import ChatWindow from '@/components/messages/ChatWindow'

// Define the raw type returned by the RPC
interface RawConversationData {
  conversation_id: string;
  last_message_at: string | null;
  last_message_content: string | null;
  other_user_id: string | null;
  other_user_username: string | null;
  other_user_avatar_url: string | null;
}

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
      const { data: convosData, error } = await supabase.rpc('get_user_conversations')

      if (error) {
        console.error('Error fetching conversations:', error)
        setConversations([])
      } else {
        const fetchedConversations = (convosData as RawConversationData[] || []).map(rawConvo => ({
          id: rawConvo.conversation_id,
          last_message_content: rawConvo.last_message_content,
          last_message_time: rawConvo.last_message_at,
          participant: {
            username: rawConvo.other_user_username || 'Group Chat', // Use 'Group Chat' or similar fallback
            avatar_url: rawConvo.other_user_avatar_url || '', // Use empty string fallback
          },
        }));
        
        setConversations(fetchedConversations)
        
        // Select the first conversation by default if none is selected
        if (fetchedConversations.length > 0 && !selectedConversationId) {
          setSelectedConversationId(fetchedConversations[0].id);
        }
      }
    }
    setLoading(false)
  }, [selectedConversationId])

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