import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

export default function StudentAttendance() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentage: 0
  })
  const user = api.getCurrentUser()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      const result = await api.getAttendanceHistory()
      if (result.success) {
        setHistory(result.data.history || [])
        setStats(result.data.stats || { total: 0, present: 0, absent: 0, percentage: 0 })
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
      case 'absent': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
      case 'late': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'excused': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return 'fa-check-circle'
      case 'absent': return 'fa-times-circle'
      case 'late': return 'fa-clock'
      case 'excused': return 'fa-info-circle'
      default: return 'fa-question-circle'
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">My Attendance</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <i className="fas fa-spinner fa-spin text-4xl text-indigo-500"></i>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Classes</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Present</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">Absent</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white"
              >
                <p className="text-white/80 text-sm font-medium mb-1">Attendance %</p>
                <p className="text-3xl font-bold">{stats.percentage}%</p>
              </motion.div>
            </div>

            {/* Attendance History List */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Attendance History</h2>
              </div>
              
              {history.length === 0 ? (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <i className="fas fa-calendar-times text-4xl mb-4 opacity-50"></i>
                  <p>No attendance records found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {history.map((record, index) => (
                    <div key={index} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(record.status)}`}>
                          <i className={`fas ${getStatusIcon(record.status)}`}></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-white">{record.subject_name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{record.subject_code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-800 dark:text-white">
                          {new Date(record.attendance_date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
      <Navigation />
    </div>
  )
}
