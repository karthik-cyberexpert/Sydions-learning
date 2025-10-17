export interface RewardItem {
  id: string
  item_id: string
  name: string
  item_type: string
}

export interface Level {
  level: number
  xp_required: number
  rank_name: string
  rewards: RewardItem[]
}

export interface ShopItem {
  id: string
  name: string
  item_type: string
}

// Type for the raw data returned by Supabase for a reward
export interface RawRewardData {
  id: string
  item_id: string
  shop_items: {
    name: string
    item_type: string
  }[]
}

// Type for the raw data returned by Supabase for a level
export interface RawLevelData {
  level: number
  xp_required: number
  rank_name: string
  level_rewards: RawRewardData[]
}

// Type for the form data used in the modal
export interface LevelFormData {
  level: number
  xp_required: number
  rank_name: string
  rewards: { item_id: string; item_name: string }[]
}