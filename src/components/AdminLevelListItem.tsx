import { FiEdit, FiTrash } from 'react-icons/fi'
import { motion } from 'framer-motion'

interface RewardItem {
  id: string
  item_id: string
  name: string
  item_type: string
}

interface Level {
  level: number
  xp_required: number
  rank_name: string
  rewards: RewardItem[]
}

interface AdminLevelListItemProps {
  levelData: Level
  onEdit: (level: Level) => void
  onDelete: (level: number) => void
}

export default function AdminLevelListItem({ levelData, onEdit, onDelete }: AdminLevelListItemProps) {
  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 py-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300">{levelData.level}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Level {levelData.level} - {levelData.rank_name || 'No Rank'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Requires {levelData.xp_required.toLocaleString()} XP</p>
        </div>
      </div>
      <div className="mt-3 md:mt-0 flex flex-wrap items-center space-x-4">
        <div className="flex flex-wrap gap-2">
          {levelData.rewards.length > 0 ? (
            levelData.rewards.map(reward => (
              <span key={reward.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                {reward.name} ({reward.item_type})
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-400">No rewards assigned</span>
          )}
        </div>
        <button
          onClick={() => onEdit(levelData)}
          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiEdit className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(levelData.level)}
          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiTrash className="h-5 w-5" />
        </button>
      </div>
    </motion.li>
  )
}