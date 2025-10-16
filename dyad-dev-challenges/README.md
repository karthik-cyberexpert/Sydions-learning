# Dyad Dev Challenges

A full-stack web platform for developer challenges, projects, voting, and community engagement built with Next.js, TailwindCSS, and Supabase.

## Features

### 👑 Admin Features
- Create challenges with project titles, descriptions, types (Solo/Tag-Team/Guild), difficulty levels, deadlines, and max points
- Automatic challenge phase handling (Submission → Voting → Leaderboard update)
- Dispute management and flagged submission review
- Analytics dashboard with participant statistics and leaderboard trends

### 👥 User Features
- **Authentication**: Supabase Auth with Google + Email login
- **Project Participation**: Join or create Solo, Tag-Team, or Guild projects
- **Submissions**: Submit hosted project links with descriptions
- **Voting & Reviews**: Vote for projects and provide feedback during voting phase
- **Gamification**: XP/coin economy, ranks, badges, and seasonal system
- **Guild & Alliance System**: Create/join temporary teams or permanent guilds
- **Leaderboards**: Individual, guild, and alliance rankings
- **Realtime Collaboration**: Chat panels using Supabase Realtime
- **Notifications**: In-app alerts for challenges, voting, and updates
- **Profile Customization**: Banner colors, social links, and badge display

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Framer Motion
- **Backend**: Supabase (Auth, Database, Realtime)
- **Deployment**: Vercel
- **UI Components**: React Icons
- **State Management**: React Context API
- **Styling**: TailwindCSS with dark mode support

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # User dashboard pages
│   ├── (admin)/         # Admin dashboard pages
│   ├── (public)/        # Public pages
│   └── layout.tsx       # Root layout
├── components/          # Reusable UI components
├── contexts/            # React context providers
├── lib/                 # Utility functions and Supabase client
├── hooks/               # Custom React hooks
├── services/            # Business logic services
├── types/               # TypeScript interfaces and types
└── ...
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Supabase:
   - Create a Supabase project
   - Update `.env.local` with your Supabase credentials
4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database Schema

The application requires the following tables in Supabase:

- `profiles` - User profiles with XP, coins, and ranks
- `challenges` - Coding challenges with deadlines and types
- `submissions` - Project submissions with URLs and descriptions
- `votes` - User votes on submissions
- `guilds` - Developer guilds with points and descriptions
- `guild_members` - Guild membership relationships
- `tag_teams` - Temporary project teams
- `tag_team_members` - Team membership relationships

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## Future Enhancements

- AI-powered project summaries
- Discord bot integration
- Push notifications
- Mobile app version
- Advanced analytics and reporting
- Code submission and evaluation system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details.