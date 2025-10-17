'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { useRouter, useParams } from 'next/navigation'
import { FiUsers, FiStar, FiUser, FiCalendar, FiAlertCircle, FiLogIn, FiLogOut, FiAward, FiMessageSquare, FiInfo, FiCode, FiPlus, FiGlobe, FiCheck, FiSend } from 'react-icons/fi'
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

interface GuildChallenge {
  id: string
  title: string
  difficulty: string
}

interface GlobalChallenge extends GuildChallenge {
  deadline: string;
}

interface Registration {
  challenge_id: string;
}

interface ParticipationRequest {
  challenge_id: string;
  user_id: string;
  profiles: {
    username: string;
  } | null;
}

interface LeaderboardEntry {
  user_id: string
  username: string
  total_xp: number
}

export default function GuildDetail() {
  const { user } = useAuth()
  const { id } = useParams()
  const [guild, setGuild] = useState<Guild | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [guildPoints, setGuildPoints] = useState(0)
  const [challenges, setChallenges] = useState<GuildChallenge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [isLeader, setIsLeader] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const [globalChallenges, setGlobalChallenges] = useState<GlobalChallenge[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [participationRequests, setParticipationRequests] = useState<ParticipationRequest[]>([]);

  const fetchGuildData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [
        guildRes, 
        leaderboardRes, 
        membersRes, 
        challengesRes, 
        profileRes,
        globalChallengesRes,
        registrationsRes,
        participationRequestsRes
      ] = await Promise.all([
        supabase.from('guilds').select('id, name, description, owner_id, created_at').eq('id', id).single(),
        supabase.from('guild_leaderboard').select('total_xp').eq('id', id).single(),
        supabase.from('profiles').select('id, username').eq('guild_id', id),
        supabase.from('challenges').select('id, title, difficulty').eq('guild_id', id),
        user ? supabase.from('profiles').select('guild_id, is_guildleader').eq('id', user.id).single() : Promise.resolve({ data: null, error: null }),
        supabase.from('challenges').select('id, title, difficulty, deadline').eq('type', 'guild').is('guild_id', null),
        supabase.from('guild_challenge_registrations').select('challenge_id').eq('guild_id', id),
        supabase.from('guild_participation_requests').select('challenge_id, user_id, profiles(username)').eq('guild_id', id)
      ]);

      if (guildRes.error) throw guildRes.error;
      setGuild(guildRes.data);

      setGuildPoints(leaderboardRes.data?.total_xp || 0);

      if (membersRes.error) throw membersRes.error;
      setMembers(membersRes.data || []);

      if (challengesRes.error) throw challengesRes.error;
      setChallenges(challengesRes.data || []);

      if (profileRes.error) throw profileRes.error;
      if (user && profileRes.data) {
        const isUserMember = profileRes.data.guild_id === id;
        setIsMember(isUserMember);
        setIsLeader(isUserMember && profileRes.data.is_guildleader);
      }

      if (globalChallengesRes.error) throw globalChallengesRes.error;
      setGlobalChallenges(globalChallengesRes.data || []);

      if (registrationsRes.error) throw registrationsRes.error;
      setRegistrations(registrationsRes.data || []);

      if (participationRequestsRes.error) throw participationRequestsRes.error;
      setParticipationRequests(participationRequestsRes.data as any || []);

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
      const { error } = await supabase.from('profiles').update({ guild_id: id }).eq('id', user.id);
      if (error) throw error;
      await fetchGuildData();
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
      const { error } = await supabase.from('profiles').update({ guild_id: null, is_guildleader: false }).eq('id', user.id);
      if (error) throw error;
      await fetchGuildData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRegister = async (challengeId: string) => {
    if (!user || !guild) return;
    setError(null);
    try {
      const { error } = await supabase.from('guild_challenge_registrations').insert({
        guild_id: guild.id,
        challenge_id: challengeId,
        registered_by: user.id
      });
      if (error) throw error;
      await fetchGuildData();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleRequest = async (challengeId: string) => {
    if (!user || !guild) return;
    setError(null);
    try {
      const { error } = await supabase.from('guild_participation_requests').insert({
        guild_id: guild.id,
        challenge_id: challengeId,
        user_id: user.id
      });
      if (error) throw error;
      await fetchGuildData();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const handleCancelRequest = async (challengeId: string) => {
    if (!user || !guild) return;
    setError(null);
    try {
      const { error } = await supabase.from('guild_participation_requests')
        .delete()
        .eq('guild_id', guild.id)
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);
      if (error) throw error;
      await fetchGuildData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
  }

  if (!guild) {
    return <div className="text-center py-12"><FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Guild not found</h3></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{guild.name}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{guild.description}</p>
          </div>
          <div className="mt-4 md:mt-0">
            {isMember ? (
              <button onClick={handleLeaveGuild} disabled={isLeader} className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm ${isLeader ? 'text-gray-400 bg-gray-100 cursor-not-allowed dark:bg-gray-700' : 'text-white bg-red-600 hover:bg-red-700'}`}><FiLogOut className="mr-2" />{isLeader ? 'You are the Leader' : 'Leave Guild'}</button>
            ) : (
              <button onClick={handleJoinGuild} className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"><FiLogIn className="mr-2" />Join Guild</button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'details' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}><FiInfo className="mr-2" /> Details</button>
          <button onClick={() => setActiveTab('members')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'members' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}><FiUsers className="mr-2" /> Members ({members.length})</button>
          <button onClick={() => setActiveTab('challenges')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'challenges' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}><FiCode className="mr-2" /> Challenges ({challenges.length})</button>
          <button onClick={() => setActiveTab('global')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'global' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}><FiGlobe className="mr-2" /> Global Challenges</button>
          <button onClick={() => setActiveTab('leaderboard')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'leaderboard' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}><FiAward className="mr-2" /> Leaderboard</button>
          {isMember && (<button onClick={() => setActiveTab('chat')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'chat' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}><FiMessageSquare className="mr-2" /> Chat</button>)}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'details' && (<div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"><div className="px-4 py-5 sm:p-0"><dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700"><div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Points</dt><dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center"><FiStar className="mr-2" />{guildPoints}</dd></div><div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Members</dt><dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center"><FiUsers className="mr-2" />{members.length}</dd></div><div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"><dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt><dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 flex items-center"><FiCalendar className="mr-2" />{new Date(guild.created_at).toLocaleDateString()}</dd></div></dl></div></div>)}
        {activeTab === 'members' && (<div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"><ul className="divide-y divide-gray-200 dark:divide-gray-700">{members.map((member) => (<li key={member.id}><div className="px-4 py-4 sm:px-6 flex items-center justify-between"><div className="flex items-center"><FiUser className="h-6 w-6 text-gray-400" /><p className="ml-4 text-sm font-medium text-gray-900 dark:text-white">{member.username}</p></div>{guild.owner_id === member.id && (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><FiAward className="mr-1 -ml-0.5 h-4 w-4" />Leader</span>)}</div></li>))}</ul></div>)}
        {activeTab === 'challenges' && (<div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"><div className="px-4 py-5 sm:px-6 flex justify-between items-center"><h3 className="text-lg font-medium text-gray-900 dark:text-white">Guild Challenges</h3>{isLeader && (<Link href={`/challenges/create?guildId=${guild.id}`} className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"><FiPlus className="mr-2" />Create Challenge</Link>)}</div><ul className="divide-y divide-gray-200 dark:divide-gray-700">{challenges.length > 0 ? challenges.map(challenge => (<li key={challenge.id}><Link href={`/challenges/${challenge.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700"><div className="px-4 py-4 sm:px-6 flex items-center justify-between"><p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{challenge.title}</p><span className="text-xs text-gray-500">{challenge.difficulty}</span></div></Link></li>)) : <li className="p-6 text-center text-gray-500">No guild-specific challenges yet.</li>}</ul></div>)}
        {activeTab === 'global' && (
          <div className="space-y-4">
            {globalChallenges.length > 0 ? globalChallenges.map(challenge => {
              const isRegistered = registrations.some(r => r.challenge_id === challenge.id);
              const requestsForThisChallenge = participationRequests.filter(r => r.challenge_id === challenge.id);
              const userHasRequested = requestsForThisChallenge.some(r => r.user_id === user?.id);

              return (
                <div key={challenge.id} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{challenge.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Difficulty: {challenge.difficulty} | Deadline: {new Date(challenge.deadline).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-3 md:mt-0">
                      {isRegistered ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><FiCheck className="mr-2" /> Registered</span>
                      ) : isLeader ? (
                        <button onClick={() => handleRegister(challenge.id)} className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">Register Guild</button>
                      ) : isMember ? (
                        userHasRequested ? (
                          <button onClick={() => handleCancelRequest(challenge.id)} className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300">Cancel Request</button>
                        ) : (
                          <button onClick={() => handleRequest(challenge.id)} className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"><FiSend className="mr-2" /> Request to Participate</button>
                        )
                      ) : null}
                    </div>
                  </div>
                  {requestsForThisChallenge.length > 0 && (
                    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Participation Requests ({requestsForThisChallenge.length}):</h5>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {requestsForThisChallenge.map(req => (
                          <span key={req.user_id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {req.profiles?.username || '...'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            }) : <p className="text-center text-gray-500 py-8">No global guild challenges available right now.</p>}
          </div>
        )}
        {activeTab === 'leaderboard' && (<div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"><ul className="divide-y divide-gray-200 dark:divide-gray-700">{leaderboard.length > 0 ? leaderboard.map((entry, index) => (<li key={entry.user_id}><div className="px-4 py-4 sm:px-6 flex items-center justify-between"><div className="flex items-center"><span className="w-8 text-lg">{index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}</span><p className="text-sm font-medium text-gray-900 dark:text-white">{entry.username}</p></div><p className="text-sm text-gray-500 dark:text-gray-400">{entry.total_xp} XP</p></div></li>)) : <li className="p-6 text-center text-gray-500">No points recorded for guild challenges yet.</li>}</ul></div>)}
        {activeTab === 'chat' && isMember && guild && <ChatPanel guildId={guild.id} />}
      </div>
    </div>
  )
}