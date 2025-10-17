'use client'

import Image from 'next/image'

// Define a more detailed Conversation type
export interface Conversation {
  id: string;
  // This structure assumes the query provides the other participant's profile
  participant: {
    username: string;
    avatar_url: string;
  };
  last_message_content: string | null;
  last_message_time: string | null;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">Messages</h2>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {conversations.map((convo) => (
          <li key={convo.id}>
            <button
              onClick={() => onSelectConversation(convo.id)}
              className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none ${
                selectedConversationId === convo.id ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {convo.participant.avatar_url ? (
                    <Image
                      src={convo.participant.avatar_url}
                      alt={convo.participant.username}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                     <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                          {convo.participant.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {convo.participant.username}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {convo.last_message_content || 'No messages yet'}
                  </p>
                </div>
                {convo.last_message_time && (
                   <div className="text-xs text-gray-400">
                     {new Date(convo.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </div>
                )}
              </div>
            </button>
          </li>
        ))}
         {conversations.length === 0 && (
          <li className="p-4 text-center text-gray-500 dark:text-gray-400">
            No conversations found.
          </li>
        )}
      </ul>
    </div>
  )
}