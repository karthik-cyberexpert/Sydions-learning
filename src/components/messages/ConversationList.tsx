'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { FiPlus, FiSearch } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

interface Conversation {
  conversation_id: string
  last_message_at: string
  last_message_content: string | null
  other_user_id: string
  other_user_username: string
  other_user_avatar_url: string | null
}

interface SearchResult {
  id: string
  username: string
  full_name: string | null
}

interface ConversationListProps {
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
}

export default function ConversationList({ selectedConversationId, onSelectConversation }: ConversationListProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    if (!user) return
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('get_user_conversations')
    
    if (rpcError) {
      console.error('Error fetching conversations:', rpcError)
      setError('Could not load conversations. Please try again later.')
    } else {
      setConversations(data || [])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:messages:for-conversations-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const handleSearch = async () => {
        if (!user) return
        setIsSearching(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
          .neq('id', user.id)
          .limit(10)
        
        if (error) {
          console.error('Error searching users:', error)
        } else {
          setSearchResults(data || [])
        }
      }
      const timer = setTimeout(() => handleSearch(), 300)
      return () => clearTimeout(timer)
    } else {
      setIsSearching(false)
      setSearchResults([])
    }
  }, [searchTerm, user])

  const handleSelectUser = async (otherUserId: string) => {
    const { data: conversationId, error } = await supabase.rpc('find_or_create_dm_conversation', {
      p_other_user_id: otherUserId
    })
    if (error) {
      console.error('Error starting conversation:', error)
      setError('Could not start conversation.')
    } else {
      onSelectConversation(conversationId)
      setSearchTerm('')
    }
  }

  const handleMyChat = async () => {
    if (!user) return
    setIsMenuOpen(false)
    await handleSelectUser(user.id)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <FiPlus className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border dark:border-gray-700"
                >
                  <button onClick={handleMyChat} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    My Chat
                  </button>
                  <button disabled className="block w-full text-left px-4 py-2 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed">
                    New Group (Soon)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="mt-4 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search or start a new chat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {isSearching ? (
          <ul>
            {searchResults.length > 0 ? (
              searchResults.map(result => (
                <li key={result.id}>
                  <button onClick={() => handleSelectUser(result.id)} className="w-full text-left p-4 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-gray-600">{result.username?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{result.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{result.full_name}</p>
                    </div>
                  </button>
                </li>
              ))
            ) : (
              <p className="p-4 text-center text-gray-500 dark:text-gray-400">No users found.</p>
            )}
          </ul>
        ) : (
          <>
            {loading ? (
              <p className="p-4 text-center text-gray-500 dark:text-gray-400">Loading conversations...</p>
            ) : error ? (
              <p className="p-4 text-center text-red-500">{error}</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-center text-gray-500 dark:text-gray-400">No conversations yet.</p>
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
          </>
        )}
      </div>
    </div>
  )
}