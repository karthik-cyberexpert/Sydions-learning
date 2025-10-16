'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiSearch, FiFilter, FiStar, FiUser, FiUsers, FiShield } from 'react-icons/fi'

interface Project {
  id: string
  title: string
  description: string
  project_url: string
  challenge: {
    title: string
    type: string
  }
  user: {
    username: string
  }
  guild: {
    name: string
  } | null
  team: {
    name: string
  } | null
  votes_count: number
  created_at: string
}

export default function Explore() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Fetch projects with related data
        const { data, error } = await supabase
          .from('submissions')
          .select(`
            id,
            description,
            live_url,
            created_at,
            challenges ( title, type ),
            profiles!user_id ( username ),
            guilds ( name )
          `)
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (error) throw error
        
        // Transform the data to match our Project interface
        const transformedData = (data || []).map((project: any) => ({
          id: project.id,
          title: project.challenges.title,
          description: project.description,
          project_url: project.live_url,
          challenge: {
            title: project.challenges.title,
            type: project.challenges.type,
          },
          user: {
            username: project.profiles.username,
          },
          guild: project.guilds ? { name: project.guilds.name } : null,
          team: null, // Team data structure is complex, setting to null for now
          votes_count: 0, // votes_count is not available in the schema
          created_at: project.created_at,
        }))
        
        setProjects(transformedData as Project[])
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProjects()
  }, [])

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                          (filter === 'solo' && !project.guild && !project.team) ||
                          (filter === 'team' && project.team) ||
                          (filter === 'guild' && project.guild)
    
    return matchesSearch && matchesFilter
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'solo':
        return <FiUser className="h-4 w-4" />
      case 'tag-team':
        return <FiUsers className="h-4 w-4" />
      case 'guild':
        return <FiShield className="h-4 w-4" />
      default:
        return <FiUser className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Explore Projects
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Discover amazing projects from our developer community
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="solo">Solo Projects</option>
            <option value="team">Team Projects</option>
            <option value="guild">Guild Projects</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {getTypeIcon(
                        project.guild ? 'guild' : 
                        project.team ? 'tag-team' : 'solo'
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {project.guild?.name || project.team?.name || project.user?.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <FiStar className="h-4 w-4 mr-1" />
                    <span>{project.votes_count}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {project.description.substring(0, 100)}...
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {project.challenge?.title}
                  </span>
                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    View Project
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <FiSearch className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  )
}