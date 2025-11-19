import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    activeNotices: 0
  })
  const [recentNotices, setRecentNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)
  
  // Student/Teacher drill-down states
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [showTeacherModal, setShowTeacherModal] = useState(false)
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login')
      return
    }
    
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.getAdminDashboardStats()
      
      if (response.success) {
        setStats({
          totalStudents: response.data.totalStudents,
          totalTeachers: response.data.totalTeachers,
          totalCourses: response.data.totalCourses,
          activeNotices: response.data.activeNotices
        })
        setRecentNotices(response.data.notices || [])
      } else {
        console.error('Failed to fetch dashboard data:', response.message)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    api.logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-slate-800 dark:text-white">Loading...</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-24 px-4 py-6 max-w-7xl mx-auto"
    >
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.full_name}</span>
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
            <i className="fas fa-user-shield text-xl"></i>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Quick Stats - Interactive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div 
          whileHover={{ scale: 1.02, y: -5 }}
          onClick={() => setShowStudentModal(true)}
          className="bg-gradient-to-br from-blue-500 to-blue-600 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/90 font-medium">View Students</p>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-user-graduate text-white"></i>
            </div>
          </div>
          <p className="text-4xl font-bold text-white mb-1">Students</p>
          <p className="text-blue-100 text-sm">Browse by year and department</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -5 }}
          onClick={() => setShowTeacherModal(true)}
          className="bg-gradient-to-br from-green-500 to-green-600 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/90 font-medium">View Teachers</p>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-chalkboard-teacher text-white"></i>
            </div>
          </div>
          <p className="text-4xl font-bold text-white mb-1">Teachers</p>
          <p className="text-green-100 text-sm">Browse by department</p>
        </motion.div>
      </div>

      {/* Recent Notices Card */}
      {/* ============================================
          BACKEND INTEGRATION POINT
          API Endpoint: GET /api/notices?exclude_fee=true&limit=3
          Expected Response: { success: true, data: [{ id, title, content, category, date }] }
          Fetch college-wide notices (holidays, events, etc.)
          Exclude individual fee notices
          ============================================ */}
      <div className="mb-8">
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                <i className="fas fa-bullhorn text-3xl text-blue-500"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Recent Notices</h3>
            </div>
            <button 
              onClick={() => navigate('/admin/notices')}
              className="text-blue-500 hover:text-blue-600 font-semibold text-base"
            >
              View All →
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">Loading notices...</div>
          ) : recentNotices.length === 0 ? (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">No recent notices</div>
          ) : (
            <div className="relative">
              {/* Carousel Container */}
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentNoticeIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 bg-white/20 dark:bg-gray-700/20 rounded-xl cursor-pointer hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all min-h-[140px]"
                    onClick={() => navigate('/admin/notices')}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                        recentNotices[currentNoticeIndex].category === 'urgent' ? 'bg-red-500' :
                        recentNotices[currentNoticeIndex].category === 'event' ? 'bg-blue-500' :
                        recentNotices[currentNoticeIndex].category === 'academic' ? 'bg-purple-500' :
                        'bg-green-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-white text-lg mb-2">
                          {recentNotices[currentNoticeIndex].title}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
                          {recentNotices[currentNoticeIndex].content}
                        </p>
                        <span className="text-sm text-slate-500 dark:text-slate-500 mt-3 inline-block">
                          {new Date(recentNotices[currentNoticeIndex].date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Arrows */}
              {recentNotices.length > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setCurrentNoticeIndex((prev) => 
                      prev === 0 ? recentNotices.length - 1 : prev - 1
                    )}
                    className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center text-blue-500 transition-all text-lg"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="flex gap-2">
                    {recentNotices.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentNoticeIndex(index)}
                        className={`h-2.5 rounded-full transition-all ${
                          index === currentNoticeIndex 
                            ? 'bg-blue-500 w-8' 
                            : 'bg-slate-400 dark:bg-slate-600 w-2.5'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentNoticeIndex((prev) => 
                      prev === recentNotices.length - 1 ? 0 : prev + 1
                    )}
                    className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/30 flex items-center justify-center text-blue-500 transition-all text-lg"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin Functions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Manage Students */}
        <div 
          onClick={() => navigate('/admin/students')}
          className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
            <i className="fas fa-user-graduate text-2xl text-blue-500"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Manage Students</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Add, edit, or remove student records</p>
          <button className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all">
            Open
          </button>
        </div>

        {/* Manage Teachers */}
        <div 
          onClick={() => navigate('/admin/teachers')}
          className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-green-500/10 dark:hover:bg-green-500/20 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <i className="fas fa-chalkboard-teacher text-2xl text-green-500"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Manage Teachers</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Add, edit, or remove teacher profiles</p>
          <button className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all">
            Open
          </button>
        </div>

        {/* Manage Courses */}
        <div 
          onClick={() => navigate('/admin/courses')}
          className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <i className="fas fa-book text-2xl text-purple-500"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Manage Courses</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Create and manage course catalog</p>
          <button className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all">
            Open
          </button>
        </div>

        {/* Post Notices */}
        <div 
          onClick={() => navigate('/admin/notices')}
          className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <i className="fas fa-bullhorn text-2xl text-red-500"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Post Notices</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Create and manage announcements</p>
          <button className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all">
            Open
          </button>
        </div>

        {/* Fee Management */}
        <div 
          onClick={() => navigate('/admin/fee-management')}
          className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-teal-500/10 dark:hover:bg-teal-500/20 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-4">
            <i className="fas fa-dollar-sign text-2xl text-teal-500"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Fee Management</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Track and manage fee payments</p>
          <button className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold transition-all">
            Open
          </button>
        </div>

        {/* Upload Study Materials */}
        <div 
          onClick={() => navigate('/admin/upload-materials')}
          className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-all cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
            <i className="fas fa-file-pdf text-2xl text-purple-500"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Upload Study Materials</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Upload notes and question papers</p>
          <button className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all">
            Open
          </button>
        </div>
      </div>

      {/* Student Browse Modal */}
      <AnimatePresence>
        {showStudentModal && (
          <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowStudentModal(false)
            setSelectedYear(null)
            setSelectedDepartment(null)
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Browse Students</h2>
              <button
                onClick={() => {
                  setShowStudentModal(false)
                  setSelectedYear(null)
                  setSelectedDepartment(null)
                }}
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 flex items-center justify-center transition-all"
              >
                <i className="fas fa-times text-slate-800 dark:text-white"></i>
              </button>
            </div>

            {!selectedYear ? (
              /* Year Selection */
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Select Academic Year</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((year) => (
                    <motion.button
                      key={year}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedYear(year)}
                      className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      <i className="fas fa-graduation-cap text-3xl mb-2"></i>
                      <p>{year}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : !selectedDepartment ? (
              /* Department Selection */
              <div>
                <button
                  onClick={() => setSelectedYear(null)}
                  className="mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Year Selection
                </button>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                  Select Department - {selectedYear}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['BCA', 'BBA', 'B.Com', 'BSc Physics'].map((dept) => (
                    <motion.button
                      key={dept}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedDepartment(dept)
                        // Navigate to students page with filters
                        navigate(`/admin/students?year=${selectedYear}&department=${dept}`)
                      }}
                      className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      <i className="fas fa-building text-3xl mb-2"></i>
                      <p>{dept}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
        )}
      </AnimatePresence>

      {/* Teacher Browse Modal */}
      <AnimatePresence>
        {showTeacherModal && (
          <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowTeacherModal(false)
            setSelectedDepartment(null)
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Browse Teachers</h2>
              <button
                onClick={() => {
                  setShowTeacherModal(false)
                  setSelectedDepartment(null)
                }}
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 flex items-center justify-center transition-all"
              >
                <i className="fas fa-times text-slate-800 dark:text-white"></i>
              </button>
            </div>

            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Select Department</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['BCA', 'BBA', 'B.Com', 'BSc Physics'].map((dept) => (
                <motion.button
                  key={dept}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedDepartment(dept)
                    // Navigate to teachers page with filter
                    navigate(`/admin/teachers?department=${dept}`)
                  }}
                  className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  <i className="fas fa-chalkboard-teacher text-3xl mb-2"></i>
                  <p>{dept}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
