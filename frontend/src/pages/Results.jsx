import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import CustomAlert from '../components/CustomAlert'
import CustomSelect from '../components/CustomSelect'
import api from '../services/api'

export default function Results() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [view, setView] = useState('current')
  const [currentResults, setCurrentResults] = useState({ class_test: [], internal_1: [], internal_2: [] })
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' })
  const [expandedCard, setExpandedCard] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/login')
      return
    }
    fetchCurrentResults()
  }, [])

  const fetchCurrentResults = async () => {
    setLoading(true)
    try {
      const res = await api.authenticatedGet('/student/get_current_results.php')
      if (res.success) {
        setCurrentResults(res.data.results)
        setStudent(res.data.student)
      } else {
        setAlert({ show: true, message: res.message, type: 'error' })
      }
    } catch (e) {
      console.error(e)
      setAlert({ show: true, message: 'Failed to load results', type: 'error' })
    }
    setLoading(false)
  }

  const examTypeLabels = {
    class_test: 'Class Test',
    internal_1: 'First Internal Exam',
    internal_2: 'Second Internal Exam'
  }

  const calculateStats = (marks) => {
    if (marks.length === 0) return { total: 0, obtained: 0, percentage: 0 }
    const total = marks.reduce((sum, m) => sum + parseFloat(m.max_marks), 0)
    const obtained = marks.reduce((sum, m) => sum + parseFloat(m.marks_obtained), 0)
    const percentage = total > 0 ? (obtained / total) * 100 : 0
    return { total, obtained, percentage }
  }

  const ResultCard = ({ examType, marks }) => {
    const stats = calculateStats(marks)
    const isExpanded = expandedCard === examType
    
    return (
      <motion.div
        layout
        className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg overflow-hidden"
      >
        <div 
          className="p-6 cursor-pointer hover:bg-white/10 transition-all"
          onClick={() => setExpandedCard(isExpanded ? null : examType)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                {examTypeLabels[examType]}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {marks.length} Subject{marks.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-800 dark:text-white">
                {stats.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {stats.obtained} / {stats.total}
              </div>
            </div>
          </div>
          
          {marks.length > 0 && (
            <div className="mt-4">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    stats.percentage >= 75 ? 'bg-green-500' :
                    stats.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${stats.percentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && marks.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-300 dark:border-slate-600"
            >
              <div className="p-6 space-y-3">
                {marks.map((mark, idx) => {
                  const percentage = (mark.marks_obtained / mark.max_marks) * 100
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-700/50">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{mark.subject_name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{mark.subject_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 dark:text-white">
                          {mark.marks_obtained} / {mark.max_marks}
                        </p>
                        <p className={`text-xs font-semibold ${
                          percentage >= 75 ? 'text-green-600 dark:text-green-400' :
                          percentage >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )
                })}
                
                <button
                  onClick={(e) => { e.stopPropagation() }}
                  className="w-full mt-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
                >
                  <i className="fas fa-download mr-2"></i> Download Result
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {marks.length === 0 && (
          <div className="p-6 border-t border-slate-300 dark:border-slate-600 text-center">
            <p className="text-slate-500 dark:text-slate-400">No marks available yet</p>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen pb-24 px-4 py-6 max-w-7xl mx-auto"
    >
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all">
            <i className="fas fa-arrow-left text-slate-800 dark:text-white"></i>
          </button>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Academic Results</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.full_name}</span>
        </div>
      </header>

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Semester {student?.semester}</h2>
            <p className="text-indigo-100">{student?.department} - {student?.program}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-6xl text-indigo-500"></i>
        </div>
      ) : (
        <div className="space-y-6">
          <ResultCard examType="internal_1" marks={currentResults.internal_1} />
          <ResultCard examType="internal_2" marks={currentResults.internal_2} />
          <ResultCard examType="class_test" marks={currentResults.class_test} />
        </div>
      )}

      <CustomAlert show={alert.show} message={alert.message} type={alert.type} onClose={() => setAlert({...alert, show: false})} />
    </motion.div>
  )
}
