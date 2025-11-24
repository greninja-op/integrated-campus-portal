import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

export default function Notice() {
  const navigate = useNavigate()
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(false)
  const user = api.getCurrentUser()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchNotices = async () => {
      try {
        const result = await api.getNotices()
        if (result.success) {
          setNotices(result.data.notices || [])
        }
      } catch (error) {
        console.error('Error fetching notices:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotices()
  }, [])

  const categories = {
    general: { label: 'General', icon: 'fa-info-circle', color: 'purple' },
    academic: { label: 'Academic', icon: 'fa-graduation-cap', color: 'blue' },
    event: { label: 'Event', icon: 'fa-calendar-alt', color: 'green' },
    exam: { label: 'Exam', icon: 'fa-file-alt', color: 'orange' },
    holiday: { label: 'Holiday', icon: 'fa-umbrella-beach', color: 'teal' },
    sports: { label: 'Sports', icon: 'fa-futbol', color: 'red' }
  }

  const getCategoryIcon = (category) => {
    return categories[category]?.icon || 'fa-info-circle'
  }

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-gradient-to-br from-purple-500 to-pink-500',
      academic: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      event: 'bg-gradient-to-br from-green-500 to-emerald-500',
      exam: 'bg-gradient-to-br from-orange-500 to-red-500',
      holiday: 'bg-gradient-to-br from-teal-500 to-blue-500',
      sports: 'bg-gradient-to-br from-red-500 to-pink-500'
    }
    return colors[category] || colors.general
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
      normal: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30',
      high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30',
      urgent: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
    }
    return colors[priority] || colors.normal
  }
  
  const getCategoryBadgeColor = (category) => {
    const colors = {
      general: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30',
      academic: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30',
      event: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30',
      exam: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30',
      holiday: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30',
      sports: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
    }
    return colors[category] || colors.general
  }

  // Removed loading screen

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.15 }}
        className="min-h-screen pb-24 px-4 py-6 max-w-5xl mx-auto"
      >
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Notice Board</h1>
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

      <p className="text-slate-600 dark:text-slate-400 mb-8">Stay updated with announcements</p>

      {/* Notices */}
      <div className="space-y-6">
        {notices.length === 0 ? (
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-12 border border-white/20 shadow-lg text-center">
            <i className="fas fa-bullhorn text-6xl text-slate-400 mb-4"></i>
            <p className="text-slate-600 dark:text-slate-400 text-lg">No notices available at the moment.</p>
          </div>
        ) : (
          notices.map((notice, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden hover:shadow-2xl transition-all"
            >
              <div className="flex">
                {/* Notice Content */}
                <div className="p-6 flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryColor(notice.category || 'general')} shadow-lg`}>
                      <i className={`fas ${getCategoryIcon(notice.category || 'general')} text-white text-lg`}></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{notice.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <i className="fas fa-user-circle"></i>
                        <span>{notice.created_by || 'Admin'}</span>
                        <span>•</span>
                        <i className="fas fa-calendar"></i>
                        <span>{new Date(notice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-4">
                    {notice.priority && (
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${getPriorityColor(notice.priority)}`}>
                        {notice.priority}
                      </span>
                    )}
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getCategoryBadgeColor(notice.category)}`}>
                      {categories[notice.category]?.label || notice.category}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                </div>
                
                {/* Notice Image on Far Right */}
                {notice.image_url && (
                  <div className="w-64 flex-shrink-0 bg-slate-100 dark:bg-slate-700 flex items-center justify-center p-4">
                    <img 
                      src={`http://localhost:8080${notice.image_url}`}
                      alt={notice.title}
                      className="w-full h-auto rounded-lg object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        console.error('Failed to load image:', notice.image_url)
                      }}
                    />
                  </div>
                )}
                </div>
                
                {/* Pay Now Button for Fee Notices */}
                {notice.feeDetails && (
                  <div className="p-6 pt-0">
                    <div className="pt-6 border-t border-slate-300 dark:border-slate-600">
                    <button
                      onClick={() => navigate('/payments')}
                      className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
                    >
                      <i className="fas fa-credit-card text-xl"></i>
                      Pay Now - ₹{notice.feeDetails.amount}
                    </button>
                    <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-3">
                      <i className="fas fa-info-circle mr-1"></i>
                      Click to proceed to payment page
                    </p>
                    </div>
                  </div>
                )}
              
            </motion.div>
          ))
        )}
      </div>
      </motion.div>
      <Navigation />
    </>
  )
}

