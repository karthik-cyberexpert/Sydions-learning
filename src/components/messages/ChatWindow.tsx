'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { FiSend } from 'react-icons/fi'

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface ConversationDetails {
  name: string | null
  type: 'dm' | 'group'
  participants: {
    profiles: {
      id: string
      username: string
    }
  }[]
}

interface ChatWindowProps {
  conversationId: string
}

export default function ChatWindow({ conversationId }: ChatWindowProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`*`)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData.map(p => [p.id, p]));
      const fullMessages = messagesData.map(message => ({
        ...message,
        profiles: profilesMap.get(message.user_id) || { username: 'Unknown', avatar_url: null }
      }));

      setMessages(fullMessages as any);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !user) return;
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        name,
        type,
        participants:conversation_participants(
          profiles(id, username)
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error("Error fetching conversation details", error);
    } else {
      setConversationDetails(data as any);
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (conversationId) {
      setLoading(true);
      fetchConversationDetails();
      fetchMessages();
    }
  }, [conversationId, fetchMessages, fetchConversationDetails]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const content = newMessage.trim()
    setNewMessage('')

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        content: content,
      })

    if (error) {
      console.error('Error sending message:', error)
      setNewMessage(content)
    }
  }

  const getConversationName = () => {
    if (!conversationDetails || !user) return 'Chat';
    if (conversationDetails.type === 'group') {
      return conversationDetails.name;
    }
    // For DMs, find the other user's name
    const otherUser = conversationDetails.participants.find(p => p.profiles.id !== user.id);
    return otherUser?.profiles.username || 'Chat';
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">Loading messages...</p></div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-lg">{getConversationName()}</h3>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
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