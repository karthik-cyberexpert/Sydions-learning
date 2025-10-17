'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FiCode, FiUsers, FiAward, FiZap } from 'react-icons/fi'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
                >
                  <span className="block">Sydions - Learning</span>
                  <span className="block text-indigo-600 dark:text-indigo-400">Development Skills</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-3 text-base text-gray-500 dark:text-gray-400 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
                >
                  Join our community of developers to participate in coding challenges, build projects, vote on submissions, and climb the leaderboard. Perfect for students, teams, and solo developers.
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start"
                >
                  <div className="rounded-md shadow">
                    <Link
                      href="/sign-up"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                    >
                      Get started
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/explore"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10 dark:text-indigo-300 dark:bg-indigo-900 dark:hover:bg-indigo-800"
                    >
                      Explore projects
                    </Link>
                  </div>
                </motion.div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase"
            >
              Features
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl"
            >
              Everything you need to grow as a developer
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto"
            >
              Our platform provides all the tools and community support you need to level up your coding skills.
            </motion.p>
          </div>

          <div className="mt-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10"
            >
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <FiCode className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Coding Challenges</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Participate in solo, tag-team, or guild challenges with varying difficulty levels and deadlines.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <FiUsers className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Community &amp; Collaboration</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Join or create guilds and temporary teams to collaborate on projects with other developers.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <FiAward className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Gamification System</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Earn XP, coins, and ranks as you complete challenges and submit projects. Climb the leaderboard.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <FiZap className="h-6 w-6" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Real-time Feedback</h3>
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                    Vote on other developers&apos; projects and receive feedback from the community during voting phases.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700 dark:bg-indigo-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            <span className="block">Ready to start your journey?</span>
            <span className="block text-indigo-200">Join our developer community today.</span>
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex lg:mt-0 lg:flex-shrink-0"
          >
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Get started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Explore projects
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}