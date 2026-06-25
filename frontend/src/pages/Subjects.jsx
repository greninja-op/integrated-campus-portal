import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

export default function Subjects() {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)
  const user = api.getCurrentUser()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchSubjects = async () => {
      try {
        const result = await api.getSubjects(user.student_id)
        if (result.success) {
          setSubjects(result.data.subjects || [])
        }
      } catch (error) {
        console.error('Error fetching subjects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubjects()
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
        <h1 className="text-3xl font-display font-bold glass-text">My Subjects</h1>
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

      <div className="bg-primary rounded-2xl p-6 mb-8 text-white shadow-glass-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Semester {user?.semester || '1'} - {user?.department || 'BCA'}</h2>
            <p className="text-white/80">Current semester courses</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{subjects.length}</p>
            <p className="text-white/80 text-sm">Subjects</p>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-book-open text-6xl glass-text-muted mb-4"></i>
          <p className="glass-text-muted text-lg">No subjects found for your semester</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subjects.map((subject, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <i className="fas fa-book text-2xl text-primary"></i>
                </div>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                  {subject.credit_hours || subject.credits} Credits
                </span>
              </div>
              <h3 className="text-xl font-display font-bold glass-text mb-2">
                {subject.subject_name || subject.name}
              </h3>
              <p className="glass-text-muted text-sm mb-3">
                {subject.subject_code || subject.code}
              </p>
              <div className="flex items-center glass-text-muted text-sm">
                <i className="fas fa-user-tie mr-2"></i>
                {subject.teacher || 'Not Assigned'}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      </motion.div>
      <Navigation />
    </>
  )
}

