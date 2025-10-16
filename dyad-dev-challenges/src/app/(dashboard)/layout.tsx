'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { FiHome, FiCompass, FiUser, FiUsers, FiAward, FiSettings, FiLogOut, FiMoon, FiSun } from 'react-icons/fi'
import { useTheme } from 'next-themes'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Explore', href: '/explore', icon: FiCompass },
    { name: 'Profile', href: '/profile', icon: FiUser },
    { name: 'Guilds', href: '/guilds', icon: FiUsers },
    { name: 'Leaderboard', href: '/leaderboard', icon: FiAward },
    { name: 'Settings', href: '/settings', icon: FiSettings },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-gray-800 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Dyad Challenges</h1>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                    >
                      <Icon
                        className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <div>
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center">
                    <button
                      onClick={toggleTheme}
                      className="flex-shrink-0 bg-gray-200 dark:bg-gray-600 relative inline-flex h-6 w-11 items-center rounded-full"
                    >
                      {mounted && (
                        <>
                          {theme === 'dark' ? (
                            <FiMoon className="h-4 w-4 text-yellow-400 ml-1" />
                          ) : (
                            <FiSun className="h-4 w-4 text-gray-600 ml-1" />
                          )}
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="ml-4 flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <FiLogOut className="mr-1 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}