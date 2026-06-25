import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'
import { API_ORIGIN } from '../config'

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
  const [loading, setLoading] = useState(false)
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

  // Removed loading screen - show page immediately

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen pb-24 px-4 py-6 max-w-7xl mx-auto"
    >
      {/* Top Header */}
      <header className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold glass-text">Admin Dashboard</h1>
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <span className="hidden sm:inline glass-text-muted font-medium">{user?.full_name}</span>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
            <i className="fas fa-user-shield text-xl"></i>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg font-semibold transition-all shrink-0"
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
          className="glass-card p-6 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="glass-text-muted font-medium">View Students</p>
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <i className="fas fa-user-graduate text-primary"></i>
            </div>
          </div>
          <p className="text-4xl font-display font-bold glass-text mb-1">Students</p>
          <p className="glass-text-muted text-sm">Browse by year and department</p>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02, y: -5 }}
          onClick={() => setShowTeacherModal(true)}
          className="glass-card p-6 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="glass-text-muted font-medium">View Teachers</p>
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <i className="fas fa-chalkboard-teacher text-emerald-500"></i>
            </div>
          </div>
          <p className="text-4xl font-display font-bold glass-text mb-1">Teachers</p>
          <p className="glass-text-muted text-sm">Browse by department</p>
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
        <div className="glass-panel p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
                <i className="fas fa-bullhorn text-3xl text-primary"></i>
              </div>
              <h3 className="text-2xl font-display font-bold glass-text">Recent Notices</h3>
            </div>
            <button 
              onClick={() => navigate('/admin/notices')}
              className="text-primary hover:text-primary/80 font-semibold text-base"
            >
              View All →
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8 glass-text-muted">Loading notices...</div>
          ) : recentNotices.length === 0 ? (
            <div className="text-center py-8 glass-text-muted">No recent notices</div>
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
                    transition={{ duration: 0.15 }}
                    className="glass-card p-6 cursor-pointer"
                    onClick={() => navigate('/admin/notices')}
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Notice Content */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-4">
                          <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                            recentNotices[currentNoticeIndex].category === 'urgent' ? 'bg-danger' :
                            recentNotices[currentNoticeIndex].category === 'event' ? 'bg-primary' :
                            recentNotices[currentNoticeIndex].category === 'academic' ? 'bg-purple-500' :
                            'bg-emerald-500'
                          }`}></div>
                          <div className="flex-1">
                            <h4 className="font-display font-bold glass-text text-xl mb-3">
                              {recentNotices[currentNoticeIndex].title}
                            </h4>
                            <p className="glass-text-muted text-base leading-relaxed mb-3">
                              {recentNotices[currentNoticeIndex].content}
                            </p>
                            <span className="text-sm glass-text-muted">
                              {new Date(recentNotices[currentNoticeIndex].date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Notice Image */}
                      {recentNotices[currentNoticeIndex].attachment_url && (
                        <div className="md:w-64 flex-shrink-0">
                          <img 
                            src={`${API_ORIGIN}${recentNotices[currentNoticeIndex].attachment_url}`}
                            alt={recentNotices[currentNoticeIndex].title}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}
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
                    className="w-10 h-10 rounded-full bg-primary/15 hover:bg-primary/25 flex items-center justify-center text-primary transition-all text-lg"
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
                            ? 'bg-primary w-8' 
                            : 'bg-slate-400 dark:bg-slate-600 w-2.5'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentNoticeIndex((prev) => 
                      prev === recentNotices.length - 1 ? 0 : prev + 1
                    )}
                    className="w-10 h-10 rounded-full bg-primary/15 hover:bg-primary/25 flex items-center justify-center text-primary transition-all text-lg"
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
          className="glass-card p-6 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <i className="fas fa-user-graduate text-2xl text-primary"></i>
          </div>
          <h3 className="text-xl font-display font-bold glass-text mb-2">Manage Students</h3>
          <p className="glass-text-muted mb-4">Add, edit, or remove student records</p>
          <button className="btn-glass w-full py-2">
            Open
          </button>
        </div>

        {/* Manage Teachers */}
        <div 
          onClick={() => navigate('/admin/teachers')}
          className="glass-card p-6 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
            <i className="fas fa-chalkboard-teacher text-2xl text-emerald-500"></i>
          </div>
          <h3 className="text-xl font-display font-bold glass-text mb-2">Manage Teachers</h3>
          <p className="glass-text-muted mb-4">Add, edit, or remove teacher profiles</p>
          <button className="btn-glass w-full py-2">
            Open
          </button>
        </div>

        {/* Manage Courses */}
        <div 
          onClick={() => navigate('/admin/courses')}
          className="glass-card p-6 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-purple-500/15 flex items-center justify-center mb-4">
            <i className="fas fa-book text-2xl text-purple-500"></i>
          </div>
          <h3 className="text-xl font-display font-bold glass-text mb-2">Manage Courses</h3>
          <p className="glass-text-muted mb-4">Create and manage course catalog</p>
          <button className="btn-glass w-full py-2">
            Open
          </button>
        </div>

        {/* Post Notices */}
        <div 
          onClick={() => navigate('/admin/notices')}
          className="glass-card p-6 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center mb-4">
            <i className="fas fa-bullhorn text-2xl text-danger"></i>
          </div>
          <h3 className="text-xl font-display font-bold glass-text mb-2">Post Notices</h3>
          <p className="glass-text-muted mb-4">Create and manage announcements</p>
          <button className="btn-glass w-full py-2">
            Open
          </button>
        </div>

        {/* Fee Management */}
        <div 
          onClick={() => navigate('/admin/fee-management')}
          className="glass-card p-6 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-teal-500/15 flex items-center justify-center mb-4">
            <i className="fas fa-dollar-sign text-2xl text-teal-500"></i>
          </div>
          <h3 className="text-xl font-display font-bold glass-text mb-2">Fee Management</h3>
          <p className="glass-text-muted mb-4">Track and manage fee payments</p>
          <button className="btn-glass w-full py-2">
            Open
          </button>
        </div>

        {/* Upload Study Materials */}
        <div 
          onClick={() => navigate('/admin/upload-materials')}
          className="glass-card p-6 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-purple-500/15 flex items-center justify-center mb-4">
            <i className="fas fa-file-pdf text-2xl text-purple-500"></i>
          </div>
          <h3 className="text-xl font-display font-bold glass-text mb-2">Upload Study Materials</h3>
          <p className="glass-text-muted mb-4">Upload notes and question papers</p>
          <button className="btn-glass w-full py-2">
            Open
          </button>
        </div>
      </div>

      {/* Student Browse Modal */}
      <AnimatePresence>
        {showStudentModal && (
          <div 
          className="fixed inset-0 glass-backdrop flex items-center justify-center z-50 p-4"
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
            className="glass-modal p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold glass-text">Browse Students</h2>
              <button
                onClick={() => {
                  setShowStudentModal(false)
                  setSelectedYear(null)
                  setSelectedDepartment(null)
                }}
                className="btn-glass w-10 h-10 rounded-full flex items-center justify-center"
              >
                <i className="fas fa-times glass-text"></i>
              </button>
            </div>

            {!selectedYear ? (
              /* Year Selection */
              <div>
                <h3 className="text-lg font-semibold glass-text mb-4">Select Academic Year</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((year) => (
                    <motion.button
                      key={year}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedYear(year)}
                      className="glass-card p-6 glass-text font-bold text-lg"
                    >
                      <i className="fas fa-graduation-cap text-3xl mb-2 text-primary"></i>
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
                  className="mb-4 flex items-center gap-2 text-primary hover:underline"
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Year Selection
                </button>
                <h3 className="text-lg font-semibold glass-text mb-4">
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
                      className="glass-card p-6 glass-text font-bold"
                    >
                      <i className="fas fa-building text-3xl mb-2 text-purple-500"></i>
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
          className="fixed inset-0 glass-backdrop flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowTeacherModal(false)
            setSelectedDepartment(null)
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-modal p-8 max-w-4xl w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold glass-text">Browse Teachers</h2>
              <button
                onClick={() => {
                  setShowTeacherModal(false)
                  setSelectedDepartment(null)
                }}
                className="btn-glass w-10 h-10 rounded-full flex items-center justify-center"
              >
                <i className="fas fa-times glass-text"></i>
              </button>
            </div>

            <h3 className="text-lg font-semibold glass-text mb-4">Select Department</h3>
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
                  className="glass-card p-6 glass-text font-bold"
                >
                  <i className="fas fa-chalkboard-teacher text-3xl mb-2 text-emerald-500"></i>
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

