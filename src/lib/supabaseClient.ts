import { createClient } from '@supabase/supabase-js'

// Define types for our Supabase client
export interface UserProfile {
  id: string
  username: string
  email: string
  is_admin: boolean
  xp: number
  coins: number
  created_at: string
  updated_at: string
}

// Define types for our challenge system
export type ChallengeType = 'solo' | 'tag-team' | 'guild'
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type ChallengeStatus = 'Upcoming' | 'Voting' | 'Completed'

export interface Challenge {
  id: string
  title: string
  description: string
  type: ChallengeType
  difficulty: ChallengeDifficulty
  deadline: string
  max_points: number
  max_team_size: number
  created_at: string
  updated_at: string
  status: ChallengeStatus
}

export interface ProjectSubmission {
  id: string
  challenge_id: string
  user_id: string
  team_id: string | null
  guild_id: string | null
  project_url: string
  description: string
  created_at: string
  updated_at: string
}

export interface Vote {
  id: string
  user_id: string
  submission_id: string
  challenge_id: string
  created_at: string
}

export interface Guild {
  id: string
  name: string
  description: string
  leader_id: string
  banner_url: string | null
  created_at: string
  updated_at: string
}

export interface GuildMember {
  id: string
  guild_id: string
  user_id: string
  joined_at: string
}

export interface TagTeam {
  id: string
  name: string
  challenge_id: string
  invite_code: string
  created_at: string
  updated_at: string
}

export interface TagTeamMember {
  id: string
  team_id: string
  user_id: string
  joined_at: string
  approved: boolean
}

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)