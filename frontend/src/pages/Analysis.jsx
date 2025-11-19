import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Navigation from '../components/Navigation'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

export default function Analysis() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  const [stats, setStats] = useState({
    gpa: '0.00',
    courses: 0,
    assignments: 0,
    rank: 0,
    subjects: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      try {
        const result = await api.getDashboardStats(user.student_id)
        if (result.success) {
          const data = result.data
          setStats({
            gpa: data.gpa || '0.00',
            courses: data.marks?.length || 0,
            assignments: 0, // Placeholder as assignments API not ready
            rank: 0, // Placeholder
            subjects: data.marks || []
          })
        }
      } catch (error) {
        console.error('Error fetching analysis:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-slate-800 dark:text-white">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen pb-24 px-4 py-6 max-w-6xl mx-auto"
      >
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Performance Analysis</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.full_name || 'Student'}</span>
          {user?.profile_image ? (
            <img 
              src={user.profile_image} 
              alt={user.full_name} 
              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
          )}
        </div>
      </header>

      <p className="text-slate-600 dark:text-slate-400 mb-8">Track your academic progress</p>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-all cursor-pointer">
          <div className="text-blue-500 mb-2">
            <i className="fas fa-chart-line text-3xl"></i>
          </div>
          <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-1">Current GPA</h3>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.gpa}</p>
        </div>

        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-green-500/10 dark:hover:bg-green-500/20 transition-all cursor-pointer">
          <div className="text-green-500 mb-2">
            <i className="fas fa-book text-3xl"></i>
          </div>
          <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-1">Courses</h3>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.courses}</p>
        </div>

        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-all cursor-pointer">
          <div className="text-purple-500 mb-2">
            <i className="fas fa-tasks text-3xl"></i>
          </div>
          <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-1">Assignments</h3>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.assignments}</p>
        </div>

        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-orange-500/10 dark:hover:bg-orange-500/20 transition-all cursor-pointer">
          <div className="text-orange-500 mb-2">
            <i className="fas fa-trophy text-3xl"></i>
          </div>
          <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-1">Rank</h3>
          <p className="text-3xl font-bold text-slate-800 dark:text-white">#{stats.rank || '-'}</p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">GPA Trend</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                { semester: 'Sem 1', gpa: 7.2 },
                { semester: 'Sem 2', gpa: 7.5 },
                { semester: 'Sem 3', gpa: 7.8 },
                { semester: 'Sem 4', gpa: 7.4 },
                { semester: 'Sem 5', gpa: 8.1 },
                { semester: 'Sem 6', gpa: stats.gpa !== '0.00' ? parseFloat(stats.gpa) : 8.2 },
              ]}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} vertical={false} />
              <XAxis 
                dataKey="semester" 
                stroke="#94a3b8" 
                tick={{fill: '#94a3b8'}}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                domain={[0, 10]} 
                tick={{fill: '#94a3b8'}}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(30, 41, 59, 0.8)', 
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '12px', 
                  color: '#fff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: '#818cf8' }}
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Area 
                type="monotone" 
                dataKey="gpa" 
                stroke="#6366f1" 
                fillOpacity={1} 
                fill="url(#colorGpa)" 
                strokeWidth={4} 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Subject Performance</h2>
        <div className="space-y-4">
          {stats.subjects.length === 0 ? (
            <p className="text-slate-500">No performance data available.</p>
          ) : (
            stats.subjects.map((subject, index) => {
              const performance = subject.total_marks || 0
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-800 dark:text-white">{subject.subject_name}</span>
                    <span className="text-slate-600 dark:text-slate-400">{performance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all"
                      style={{ width: `${performance}%` }}
                    ></div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
      </motion.div>
      <Navigation />
    </>
  )
}
