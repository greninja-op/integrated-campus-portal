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
  const [loading, setLoading] = useState(false)

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

  // Removed loading screen

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.15 }}
        className="min-h-screen pb-24 px-4 py-6 max-w-6xl mx-auto"
      >
      {/* Top Header */}
      <header className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold glass-text">Performance Analysis</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="glass-text-muted font-medium">{user?.full_name || 'Student'}</span>
          {user?.profile_image ? (
            <img 
              src={user.profile_image} 
              alt={user.full_name} 
              className="w-10 h-10 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
          )}
        </div>
      </header>

      <p className="glass-text-muted mb-8">Track your academic progress</p>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 cursor-pointer">
          <div className="text-primary mb-2">
            <i className="fas fa-chart-line text-3xl"></i>
          </div>
          <h3 className="text-sm glass-text-muted mb-1">Current GPA</h3>
          <p className="text-3xl font-bold glass-text">{stats.gpa}</p>
        </div>

        <div className="glass-card p-6 cursor-pointer">
          <div className="text-green-500 mb-2">
            <i className="fas fa-book text-3xl"></i>
          </div>
          <h3 className="text-sm glass-text-muted mb-1">Courses</h3>
          <p className="text-3xl font-bold glass-text">{stats.courses}</p>
        </div>

        <div className="glass-card p-6 cursor-pointer">
          <div className="text-purple-500 mb-2">
            <i className="fas fa-tasks text-3xl"></i>
          </div>
          <h3 className="text-sm glass-text-muted mb-1">Assignments</h3>
          <p className="text-3xl font-bold glass-text">{stats.assignments}</p>
        </div>

        <div className="glass-card p-6 cursor-pointer">
          <div className="text-orange-500 mb-2">
            <i className="fas fa-trophy text-3xl"></i>
          </div>
          <h3 className="text-sm glass-text-muted mb-1">Rank</h3>
          <p className="text-3xl font-bold glass-text">#{stats.rank || '-'}</p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-2xl font-display font-bold glass-text mb-6">GPA Trend</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                { semester: 'Sem 1', gpa: 7.2 },
                { semester: 'Sem 2', gpa: 7.5 },
                { semester: 'Sem 3', gpa: 7.8 },
                ...(user.semester >= 4 ? [{ semester: 'Sem 4', gpa: 7.4 }] : []),
                ...(user.semester >= 5 ? [{ semester: 'Sem 5', gpa: 8.1 }] : []),
                ...(user.semester >= 6 ? [{ semester: 'Sem 6', gpa: stats.gpa !== '0.00' ? parseFloat(stats.gpa) : 8.2 }] : []),
              ].slice(0, user.semester)}
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
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-display font-bold glass-text mb-6">Subject Performance</h2>
        <div className="space-y-4">
          {stats.subjects.length === 0 ? (
            <p className="glass-text-muted">No performance data available.</p>
          ) : (
            stats.subjects.map((subject, index) => {
              const performance = subject.total_marks || 0
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold glass-text">{subject.subject_name}</span>
                    <span className="glass-text-muted">{performance}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
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

