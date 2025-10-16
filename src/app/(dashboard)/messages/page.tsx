'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ConversationList from '@/components/messages/ConversationList'
import ChatWindow from '@/components/messages/ChatWindow'

function MessagesContent() {
  const searchParams = useSearchParams()
  const initialConversationId = searchParams.get('conversationId')
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId)

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700">
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
        />
      </div>
      <div className="hidden md:flex w-2/3 flex-col">
        {selectedConversationId ? (
          <ChatWindow conversationId={selectedConversationId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Select a conversation to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesContent />
    </Suspense>
  )
}