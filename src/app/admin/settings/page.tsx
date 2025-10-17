'use client'

import { FiSettings } from 'react-icons/fi'

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage global settings for the Dyad Dev Challenges platform.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
        <FiSettings className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Future-Proofing Your Platform
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This area is reserved for future platform-wide settings. You could add options here to:
        </p>
        <ul className="mt-4 text-sm text-gray-500 dark:text-gray-400 list-disc list-inside text-left max-w-md mx-auto">
          <li>Enable or disable new user registrations.</li>
          <li>Set a site-wide announcement banner.</li>
          <li>Manage API keys for third-party integrations.</li>
          <li>Configure default points or rewards for actions.</li>
        </ul>
      </div>
    </div>
  )
}