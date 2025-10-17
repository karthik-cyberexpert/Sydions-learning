'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { FiUsers, FiStar, FiUser, FiCalendar, FiAlertCircle, FiLogIn, FiLogOut, FiAward, FiMessageSquare, FiInfo } from 'react-icons/fi'
import Link from 'next/link'
import ChatPanel from '@/components/ChatPanel'

interface Guild {
  id: string
  name: string
  description: string
  owner_id: string
  created_at: string
}

interface Member {
  id: string
  username: string
}

export default function GuildDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [guild, setGuild] = useState<Guild | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [guildPoints, setGuildPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [isLeader, setIsLeader] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const fetchGuildData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch guild details
      const { data: guildData, error: guildError } = await supabase
        .from('guilds')
        .select('id, name, description, owner_id, created_at')
        .eq('id', id)
        .single();

      if (guildError) throw guildError;
      setGuild(guildData);

      // Fetch guild points from leaderboard view
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('guild_leaderboard')
        .select('total_xp')
        .eq('id', id)
        .single();
      
      if (leaderboardError) console.warn("Could not fetch guild points", leaderboardError.message);
      setGuildPoints(leaderboardData?.total_xp || 0);

      // Fetch guild members
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('guild_id', id);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Check user's membership status
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('guild_id, is_guildleader')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;

        const isUserMember = profileData?.guild_id === id;
        setIsMember(isUserMember);
        setIsLeader(isUserMember && profileData.is_guildleader);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchGuildData();
  }, [fetchGuildData]);

  const handleJoinGuild = async () => {
    if (!user) return;
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ guild_id: id })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await fetchGuildData(); // Re-fetch all data to ensure consistency
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleLeaveGuild = async () => {
    if (!user || isLeader) {
      setError('Guild leaders cannot leave their guild. Please delete the guild instead.');
      return;
    }
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ guild_id: null, is_guildleader: false })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await fetchGuildData(); // Re-fetch all data
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error && !guild) {
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
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {guild.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              {guild.description}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            {isMember ? (
              <button
                onClick={handleLeaveGuild}
                disabled={isLeader}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm ${
                  isLeader 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
                    : 'text-white bg-red-600 hover:bg-red-700'
                }`}
              >
                <FiLogOut className="mr-2" />
                {isLeader ? 'You are the Leader' : 'Leave Guild'}
              </button>
            ) : (
              <button
                onClick={handleJoinGuild}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FiLogIn className="mr-2" />
                Join Guild
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('details')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FiInfo className="mr-2" /> Details
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'members'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <FiUsers className="mr-2" /> Members ({members.length})
          </button>
          {isMember && (
            <button
              onClick={() => setActiveTab('chat')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'chat'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <FiMessageSquare className="mr-2" /> Chat
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'details' && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Points</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center"><FiStar className="mr-2" />{guildPoints}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Members</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center"><FiUsers className="mr-2" />{members.length}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center"><FiCalendar className="mr-2" />{new Date(guild.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {members.map((member) => (
                <li key={member.id}>
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex items-center">
                      <FiUser className="h-6 w-6 text-gray-400" />
                      <p className="ml-4 text-sm font-medium text-gray-900 dark:text-white">{member.username}</p>
                    </div>
                    {guild.owner_id === member.id && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <FiAward className="mr-1 -ml-0.5 h-4 w-4" />
                        Leader
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'chat' && isMember && guild && <ChatPanel guildId={guild.id} />}
      </div>
    </div>
  )
}