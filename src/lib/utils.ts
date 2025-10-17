export const getRankFromLevel = (level: number | null | undefined): string => {
  // This function is now deprecated. Rank name should be fetched directly from the profiles_with_level view (which should include rank_name)
  // For backward compatibility during transition, we keep a basic fallback.
  if (!level || level < 2) return 'Rookie';
  if (level < 5) return 'Apprentice';
  if (level < 8) return 'Developer';
  if (level < 10) return 'Master Dev';
  return 'Legend';
};

export const getRankBadge = (rank: string): string => {
  switch (rank) {
    case 'Rookie':
      return '🥉';
    case 'Apprentice':
      return '🥈';
    case 'Developer':
    case 'Master Dev':
      return '🥇';
    case 'Legend':
      return '👑';
    default:
      return '👤';
  }
};