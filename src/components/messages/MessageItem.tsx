'use client'

import Image from 'next/image'
import { Message } from './ChatWindow' // Import the Message type from ChatWindow

interface MessageItemProps {
  message: Message
  isCurrentUser: boolean
}

export default function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  const alignment = isCurrentUser ? 'justify-end' : 'justify-start'
  const bubbleColor = isCurrentUser
    ? 'bg-indigo-500 text-white'
    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'

  const senderName = message.profiles?.username || message.profiles?.full_name || 'Unknown User'
  const senderInitial = senderName.charAt(0).toUpperCase()

  return (
    <div className={`flex items-end gap-2 ${alignment}`}>
      {!isCurrentUser && (
        <div className="flex-shrink-0">
          {message.profiles?.avatar_url ? (
            <Image
              src={message.profiles.avatar_url}
              alt={senderName || 'User avatar'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                {senderInitial}
              </span>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col space-y-1 max-w-xs md:max-w-md">
        {!isCurrentUser && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-3">
            {senderName}
          </span>
        )}
        <div className={`px-4 py-2 rounded-lg ${bubbleColor}`}>
          <p className="text-sm">{message.content}</p>
        </div>
        <span className={`text-xs text-gray-400 ${isCurrentUser ? 'text-right mr-3' : 'text-left ml-3'}`}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}