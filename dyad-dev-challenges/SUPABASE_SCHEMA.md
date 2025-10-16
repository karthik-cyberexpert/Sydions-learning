# Supabase Database Schema

This document outlines the required database schema for the Dyad Dev Challenges application.

## Tables

### profiles
Stores user profile information including XP, coins, and ranks.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  role TEXT DEFAULT 'user',
  xp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  rank TEXT DEFAULT 'Rookie',
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### challenges
Stores coding challenges with their properties.

```sql
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('solo', 'tag-team', 'guild')),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  deadline TIMESTAMP WITH TIME ZONE,
  max_points INTEGER,
  max_team_size INTEGER DEFAULT 3,
  phase TEXT CHECK (phase IN ('submission', 'voting', 'completed')) DEFAULT 'submission',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### submissions
Stores project submissions for challenges.

```sql
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES tag_teams ON DELETE SET NULL,
  guild_id UUID REFERENCES guilds ON DELETE SET NULL,
  project_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### votes
Stores user votes on submissions.

```sql
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  submission_id UUID REFERENCES submissions ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES challenges ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id) -- Ensures one vote per user per challenge
);
```

### guilds
Stores developer guilds.

```sql
CREATE TABLE guilds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### guild_members
Stores guild membership relationships.

```sql
CREATE TABLE guild_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id UUID REFERENCES guilds ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guild_id, user_id)
);
```

### tag_teams
Stores temporary project teams (tag-teams).

```sql
CREATE TABLE tag_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  challenge_id UUID REFERENCES challenges ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### tag_team_members
Stores tag-team membership relationships.

```sql
CREATE TABLE tag_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES tag_teams ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved BOOLEAN DEFAULT FALSE,
  UNIQUE(team_id, user_id)
);
```

## Relationships

- Each user has one profile (1:1)
- Users can create multiple challenges (1:N)
- Challenges can have multiple submissions (1:N)
- Users can make multiple submissions (1:N)
- Users can vote on submissions (1:N)
- Users can be members of multiple guilds (N:M through guild_members)
- Guilds can have multiple members (1:N through guild_members)
- Users can be members of multiple tag-teams (N:M through tag_team_members)
- Tag-teams can have multiple members (1:N through tag_team_members)
- Submissions can belong to one tag-team or guild (1:1)

## Row Level Security (RLS)

Appropriate RLS policies should be implemented for each table to ensure data security:

- Users can only view their own profile
- Users can only update their own profile
- Admins can view and update all profiles
- Users can view all challenges
- Only admins can create/update challenges
- Users can only view submissions for challenges they're participating in
- Users can only create submissions for themselves
- Users can only vote once per challenge
- Users can only view guilds they're members of or public guild information
- Guild leaders can manage their guilds
- Users can only view tag-teams for challenges they're participating in