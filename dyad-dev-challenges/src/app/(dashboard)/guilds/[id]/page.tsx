'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { FiUsers, FiStar, FiShield, FiUser, FiCalendar, FiAlertCircle } from 'react-icons/fi'
import Link from 'next/link'

interface Guild {
  id: string
  name: string
  description: string
  leader_id: string
  points: number
  created_at: string
}

interface Member {
  id: string
  user: {
    username: string
  }
  joined_at: string
}

export default function GuildDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [guild, setGuild] = useState<Guild | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [isLeader, setIsLeader] = useState(false)

  useEffect(() => {
    const fetchGuild = async () => {
      if (!id) return
      
      try {
        // Fetch guild details
        const { data: guildData, error: guildError } = await supabase
          .from('guilds')
          .select('*')
          .eq('id', id)
          .single()
        
        if (guildError) throw guildError
        setGuild(guildData)
        
        // Check if user is a member
        if (user) {
          const { data: memberData, error: memberError } = await supabase
            .from('guild_members')
            .select('id')
            .eq('guild_id', id)
            .eq('user_id', user.id)
            .single()
          
          if (!memberError && memberData) {
            setIsMember(true)
            setIsLeader(guildData.leader_id === user.id)
          }
        }
        
        // Fetch guild members
        const { data: membersData, error: membersError } = await supabase
          .from('guild_members')
          .select(`
            id,
            joined_at,
            user:profiles(username)
          `)
          .eq('guild_id', id)
        
        if (membersError) throw membersError
        
        // Transform the data
        const transformedMembers = (membersData || []).map((member: any) => ({
          ...member,
          user: member.user?.[0] || { username: 'Unknown' }
        }))
        
        setMembers(transformedMembers)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchGuild()
  }, [id, user])

  const handleJoinGuild = async () => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('guild_members')
        .insert([
          {
            guild_id: id,
            user_id: user.id
          }
        ])
      
      if (error) throw error
      
      setIsMember(true)
      setMembers(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          user: { username: user.email?.split('@')[0] || 'User' },
          joined_at: new Date().toISOString()
        }
      ])
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleLeaveGuild = async () => {
    if (!user) return
    
    try {
      // Check if user is the leader
      if (isLeader) {
        setError('Guild leaders cannot leave their guild. Please delete the guild instead.')
        return
      }
      
      const { error } = await supabase
        .from('guild_members')
        .delete()
        .eq('guild_id', id)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      setIsMember(false)
      setMembers(prev => prev.filter(member => member.user.username !== (user.email?.split('@')[0] || 'User')))
    } catch (error: any) {
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading guild</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!guild) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Guild not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The guild you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <Link
            href="/guilds"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Guilds
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {guild.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {guild.description}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Guild Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Details about this guild
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              {isMember ? (
                <button
                  onClick={isLeader ? undefined : handleLeaveGuild}
                  disabled={isLeader}
                  className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md ${
                    isLeader 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400' 
                      : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {isLeader ? 'Guild Leader' : 'Leave Guild'}
                </button>
              ) : (
                <button
                  onClick={handleJoinGuild}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Join Guild
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Points
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  <FiStar className="mr-2" />
                  {guild.points}
                </div>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Members
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  <FiUsers className="mr-2" />
                  {members.length}
                </div>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Created
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  <FiCalendar className="mr-2" />
                  {new Date(guild.created_at).toLocaleDateString()}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Guild Members
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Developers in this guild
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {members.map((member) => (
              <li key={member.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FiUser className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div>
                      {guild.leader_id === member.user.username && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          Leader
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}