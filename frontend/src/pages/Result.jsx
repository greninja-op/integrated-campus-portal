import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

export default function Result() {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const user = api.getCurrentUser()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchResults = async () => {
      try {
        const result = await api.getResults(user.student_id)
        if (result.success) {
          // Backend returns { marks: [], gpa: ..., cgpa: ... }
          setResults(result.data.marks || [])
        }
      } catch (error) {
        console.error('Error fetching results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  // Calculate GPA if not provided by backend, or use backend value if we stored it
  // For now, we'll calculate from the results array if needed, but ideally we should store the GPA from the API
  const totalGPA = results.length > 0 
    ? (results.reduce((sum, r) => sum + parseFloat(r.grade_point || 0), 0) / results.length).toFixed(2)
    : '0.00'

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
        <h1 className="text-3xl font-display font-bold glass-text">Academic Results</h1>
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

      {loading ? (
        <div className="text-center py-12">
          <div className="text-2xl glass-text">Loading results...</div>
        </div>
      ) : (
        <>
      <p className="glass-text-muted mb-8">Your semester performance</p>

      {/* GPA Card */}
      <div className="bg-primary rounded-2xl p-8 mb-8 text-white shadow-glass-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/80 mb-2">Overall GPA</p>
            <h2 className="text-6xl font-bold">{totalGPA}</h2>
          </div>
          <div className="text-right">
            <p className="text-white/80 mb-2">Semester</p>
            <p className="text-2xl font-semibold">Spring 2024</p>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-display font-bold glass-text mb-6">Course Results</h2>
        
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 glass-card cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                    {result.subject_code}
                  </span>
                  <h3 className="font-semibold glass-text">
                    {result.subject_name}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-sm glass-text-muted mb-1">Marks</p>
                  <p className="text-2xl font-bold glass-text">{result.marks_obtained}/{result.total_marks}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm glass-text-muted mb-1">Grade</p>
                  <p className="text-2xl font-bold glass-text">{result.grade}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-primary w-full mt-6 py-3">
          Download Transcript
        </button>
      </div>
      </>
      )}
      </motion.div>
      <Navigation />
    </>
  )
}

