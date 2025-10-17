'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import MessageItem from './MessageItem'
import MessageInput from './MessageInput'

interface ProfileData {
  username: string
  avatar_url: string
}

export interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  conversation_id: string
  profiles: ProfileData
}

// Raw type definition to match the structure returned by the Supabase query
interface RawMessageData {
  id: string
  content: string
  created_at: string
  user_id: string
  conversation_id: string
  profiles: ProfileData[] // Supabase returns the joined table as an array
}

interface ChatWindowProps {
  user: User | null
  conversationId: string
}

export default function ChatWindow({ user, conversationId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          conversation_id,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error;

      const transformedMessages = (data as RawMessageData[] || []).map(msg => ({
        ...msg,
        profiles: msg.profiles?.[0] || { username: 'Unknown User', avatar_url: '' }
      }));

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [conversationId])

  const fetchMessageWithProfile = useCallback(async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          conversation_id,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('id', messageId)
        .single()

      if (error) throw error;

      const newMessage: Message = {
        ...(data as RawMessageData),
        profiles: (data as RawMessageData).profiles?.[0] || { username: 'Unknown User', avatar_url: '' }
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);
    } catch (error) {
      console.error('Error fetching new message with profile:', error);
    }
  }, [])

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.new.conversation_id === conversationId) {
            fetchMessageWithProfile(payload.new.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, fetchMessages, fetchMessageWithProfile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!user || !content.trim()) return

    const { error } = await supabase
      .from('messages')
      .insert([{ content, user_id: user.id, conversation_id: conversationId }])

    if (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} isCurrentUser={message.user_id === user?.id} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  )
}