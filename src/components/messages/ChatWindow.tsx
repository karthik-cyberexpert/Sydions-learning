'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import MessageItem from './MessageItem'
import MessageInput from './MessageInput'

interface ProfileData {
  username: string | null
  avatar_url: string | null
  full_name: string | null
  email_fallback?: string // Added email fallback field
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

// Helper function to fetch email if profile is missing data
const fetchEmailFallback = async (userId: string): Promise<string | undefined> => {
  const { data: authUser, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    console.error('Error fetching auth user for email fallback:', error);
    return undefined;
  }
  return authUser?.user.email;
}

export default function ChatWindow({ user, conversationId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const transformAndSetMessages = useCallback(async (rawMessages: RawMessageData[]) => {
    const transformedMessages: Message[] = await Promise.all(
      (rawMessages || []).map(async (msg) => {
        const profile = msg.profiles?.[0] || { username: null, avatar_url: null, full_name: null };
        
        // Check if we need a fallback name (username or full_name is missing)
        if (!profile.username && !profile.full_name) {
          const email = await fetchEmailFallback(msg.user_id);
          profile.email_fallback = email?.split('@')[0] || 'Unknown User';
        }

        return {
          ...msg,
          profiles: profile
        };
      })
    );
    setMessages(transformedMessages);
  }, [])

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
            avatar_url,
            full_name
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error;

      await transformAndSetMessages(data as RawMessageData[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [conversationId, transformAndSetMessages])

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
            avatar_url,
            full_name
          )
        `)
        .eq('id', messageId)
        .single()

      if (error) throw error;

      const rawMessage: RawMessageData = data as RawMessageData;
      const profile = rawMessage.profiles?.[0] || { username: null, avatar_url: null, full_name: null };

      // Check if we need a fallback name
      if (!profile.username && !profile.full_name) {
        const email = await fetchEmailFallback(rawMessage.user_id);
        profile.email_fallback = email?.split('@')[0] || 'Unknown User';
      }

      const newMessage: Message = {
        ...rawMessage,
        profiles: profile
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