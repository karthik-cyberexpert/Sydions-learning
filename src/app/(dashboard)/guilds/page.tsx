'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiUsers, FiPlus, FiSearch, FiShield, FiStar } from 'react-icons/fi'
import Link from 'next/link'

interface Guild {
  id: string
  name: string
  description: string
  leader_id: string
  points: number
  members_count: number
  created_at: string
}

export default function Guilds() {
  const { user } = useAuth()
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userGuild, setUserGuild] = useState<Guild | null>(null)

  useEffect(() => {
    const fetchGuilds = async () => {
      try {
        // Fetch all guilds from the leaderboard view
        const { data: guildsData, error: guildsError } = await supabase
          .from('guild_leaderboard')
          .select('id, name, description, owner_id, total_xp, member_count, created_at')
          .order('total_xp', { ascending: false });

        if (guildsError) throw guildsError;

        const transformedGuilds = (guildsData || []).map((guild: any) => ({
          id: guild.id,
          name: guild.name,
          description: guild.description,
          leader_id: guild.owner_id,
          points: guild.total_xp || 0,
          members_count: guild.member_count || 0,
          created_at: guild.created_at,
        }));
        setGuilds(transformedGuilds);

        // Check if user is in a guild
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('guild_id')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.warn('Could not fetch user profile for guild check:', profileError.message);
          }

          if (profileData?.guild_id) {
            const userGuildFromList = transformedGuilds.find(g => g.id === profileData.guild_id);
            if (userGuildFromList) {
              setUserGuild(userGuildFromList);
            } else {
              // If not in the main list (e.g., a new guild with 0 points), fetch it separately
              const { data: separateGuildData, error: separateGuildError } = await supabase
                .from('guild_leaderboard')
                .select('id, name, description, owner_id, total_xp, member_count, created_at')
                .eq('id', profileData.guild_id)
                .single();
              
              if (separateGuildError) throw separateGuildError;

              if (separateGuildData) {
                setUserGuild({
                  id: separateGuildData.id,
                  name: separateGuildData.name,
                  description: separateGuildData.description,
                  leader_id: separateGuildData.owner_id,
                  points: separateGuildData.total_xp || 0,
                  members_count: separateGuildData.member_count || 0,
                  created_at: separateGuildData.created_at,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching guilds:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchGuilds();
    } else {
      setLoading(false);
    }
  }, [user]);

  const filteredGuilds = guilds.filter(guild => 
    guild.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guild.description && guild.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Guilds
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Join or create a guild to collaborate with other developers
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/guilds/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiPlus className="mr-2" />
            Create Guild
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          placeholder="Search guilds..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* User's Guild */}
      {userGuild && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Your Guild
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              You are currently a member of this guild
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiShield className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {userGuild.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userGuild.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-right mr-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {userGuild.points} points
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {userGuild.members_count} members
                    </div>
                  </div>
                  <Link
                    href={`/guilds/${userGuild.id}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    View Guild
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Guilds */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          All Guilds
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Browse and join guilds that match your interests
        </p>
      </div>

      {filteredGuilds.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredGuilds.map((guild, index) => (
            <motion.div
              key={guild.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FiShield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {guild.name}
                    </h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {guild.description && guild.description.substring(0, 100)}...
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <FiUsers className="mr-1" />
                    <span>{guild.members_count} members</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <FiStar className="mr-1" />
                    <span>{guild.points} points</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href={`/guilds/${guild.id}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Guild
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No guilds found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search' : 'Be the first to create a guild!'}
          </p>
          <div className="mt-6">
            <Link
              href="/guilds/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiPlus className="mr-2" />
              Create Guild
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}