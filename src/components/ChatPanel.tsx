'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { FiSend } from 'react-icons/fi'

interface ProfileData {
  username: string
  avatar_url: string | null
}

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: ProfileData
}

interface ChatPanelProps {
  guildId: string
}

export default function ChatPanel({ guildId }: ChatPanelProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('guild_messages')
        .select(`*, profiles ( username, avatar_url )`)
        .eq('guild_id', guildId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages(data as Message[])
      }
      setLoading(false)
    }

    fetchMessages()
  }, [guildId])

  useEffect(() => {
    const channel = supabase
      .channel(`guild-chat-${guildId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guild_messages',
          filter: `guild_id=eq.${guildId}`,
        },
        async (payload) => {
          // Fetch the full message with profile data
          const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.user_id)
            .single()
          
          if (!error && data) {
            const fullMessage: Message = { ...payload.new, profiles: data } as Message
            setMessages((prevMessages) => [...prevMessages, fullMessage])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [guildId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const content = newMessage.trim()
    setNewMessage('')

    const { error } = await supabase
      .from('guild_messages')
      .insert({
        guild_id: guildId,
        user_id: user.id,
        content: content,
      })

    if (error) {
      console.error('Error sending message:', error)
      setNewMessage(content)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg flex flex-col h-[60vh]">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Guild Chat</h3>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 ${message.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-sm text-gray-600">{message.profiles.username?.charAt(0).toUpperCase()}</span>
                </div>
                <div className={`p-3 rounded-lg max-w-xs ${message.user_id === user?.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                  <p className="text-sm font-bold">{message.profiles.username}</p>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button type="submit" className="inline-flex items-center p-3 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <FiSend className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}