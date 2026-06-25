import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import CustomAlert from '../components/CustomAlert'
import CustomSelect from '../components/CustomSelect'
import api from '../services/api'
import { API_ORIGIN } from '../config'

export default function TeacherAttendance() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [attendance, setAttendance] = useState({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' })
  const [semesterFilter, setSemesterFilter] = useState('all')
  
  // Always use today's date - no date picker
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'teacher')) {
      navigate('/login')
      return
    }
    
    fetchAssignedSubjects()
  }, [semesterFilter])

  const fetchAssignedSubjects = async () => {
    setLoading(true)
    try {
      const params = semesterFilter !== 'all' ? `?semester=${semesterFilter}` : ''
      const res = await api.authenticatedGet(`/teacher/get_assigned_subjects.php${params}`)
      
      if (res.success) {
        setCourses(res.data.subjects || [])
      } else {
        setAlert({ show: true, message: res.message || 'Failed to load subjects', type: 'error' })
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
      setAlert({ show: true, message: 'Failed to load subjects', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSelect = async (course) => {
    setSelectedCourse(course)
    setLoading(true)
    try {
      const res = await api.getAttendanceStudents({
        department: user.department,
        semester: course.semester,
        subject_id: course.id,
        date: today
      })
      
      if (res.success) {
        const courseStudents = res.data.students || []
        setStudents(courseStudents)
        
        // Initialize attendance from existing records only, no default selection
        const initialAttendance = {}
        courseStudents.forEach(student => {
          // Only set if there's an existing status, otherwise leave unselected
          if (student.status) {
            initialAttendance[student.id] = student.status
          }
        })
        setAttendance(initialAttendance)
      } else {
        setAlert({ show: true, message: res.message || 'Failed to load students', type: 'error' })
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setAlert({ show: true, message: 'Failed to load students', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSubmit = () => {
    setShowConfirmModal(true)
  }

  const confirmSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const result = await api.markAttendance({
        subject_id: selectedCourse.id,
        date: today,
        attendance: attendance
      })
      
      if (result.success) {
        setShowConfirmModal(false)
        setAlert({ 
          show: true, 
          message: `Attendance recorded successfully for ${selectedCourse.subject_name}!`, 
          type: 'success' 
        })
        
        // Reset after 2 seconds
        setTimeout(() => {
          setSelectedCourse(null)
          setAttendance({})
        }, 2000)
      } else {
        setAlert({ show: true, message: result.message || 'Failed to mark attendance', type: 'error' })
      }
    } catch (error) {
      console.error('Error submitting attendance:', error)
      setAlert({ show: true, message: 'An error occurred while submitting attendance', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPresentCount = () => {
    return Object.values(attendance).filter(status => status === 'present').length
  }

  const getAbsentCount = () => {
    return Object.values(attendance).filter(status => status === 'absent').length
  }

  const getUnmarkedCount = () => {
    return students.length - Object.keys(attendance).length
  }

  const getTodayDate = () => {
    const date = new Date()
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const filteredCourses = courses

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen pb-24 px-4 py-6 max-w-7xl mx-auto"
    >
      {/* Top Header */}
      <header className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => selectedCourse ? setSelectedCourse(null) : navigate('/teacher/dashboard')}
            className="btn-glass w-10 h-10 rounded-full flex items-center justify-center"
          >
            <i className="fas fa-arrow-left glass-text"></i>
          </button>
          <h1 className="text-3xl font-display font-bold glass-text">Attendance Management</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="glass-text-muted font-medium">{user?.full_name}</span>
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white">
            <i className="fas fa-calendar-check text-lg"></i>
          </div>
        </div>
      </header>

      {/* Date Banner - No date picker, just display today */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 mb-8 text-white shadow-glass-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-calendar-day text-3xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{getTodayDate()}</h2>
              <p className="text-orange-100">Mark attendance for your class</p>
            </div>
          </div>
          
          {selectedCourse && (
            <div className="text-right">
              <p className="text-sm text-orange-100">Selected Course</p>
              <p className="text-xl font-bold">{selectedCourse.subject_name}</p>
              <p className="text-orange-100 text-sm">{selectedCourse.subject_code} • Semester {selectedCourse.semester}</p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-6xl text-orange-500 mb-4"></i>
            <p className="glass-text-muted text-lg">Loading...</p>
          </div>
        </div>
      ) : !selectedCourse ? (
        /* Course Selection Grid */
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold glass-text">Select Your Course</h2>
            
            {/* Semester Filter */}
            <div className="flex items-center gap-2">
              <span className="glass-text-muted font-medium">Semester:</span>
              <CustomSelect
                name="semester"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Semesters' },
                  { value: '1', label: 'Semester 1' },
                  { value: '2', label: 'Semester 2' },
                  { value: '3', label: 'Semester 3' },
                  { value: '4', label: 'Semester 4' },
                  { value: '5', label: 'Semester 5' },
                  { value: '6', label: 'Semester 6' }
                ]}
                placeholder="Select Semester"
              />
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 glass-panel p-8">
              <i className="fas fa-book-open text-6xl text-slate-300 dark:text-slate-600 mb-4"></i>
              <p className="glass-text-muted text-lg mb-2">No courses assigned</p>
              <p className="glass-text-muted text-sm">
                {semesterFilter !== 'all' 
                  ? `No subjects assigned for Semester ${semesterFilter}` 
                  : 'You have no subjects assigned yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => handleCourseSelect(course)}
                  className="glass-card p-6 cursor-pointer flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-book text-2xl text-orange-500"></i>
                    </div>
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                      Sem {course.semester}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-bold glass-text mb-2">{course.subject_name}</h3>
                  <p className="text-sm glass-text-muted mb-4">{course.subject_code}</p>
                  <button className="btn-glass w-full py-2 mt-auto">
                    Select Course
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Attendance Marking Interface */
        <div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-primary rounded-2xl p-6 text-white shadow-glass">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/90 font-medium">Total Students</p>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <i className="fas fa-users"></i>
                </div>
              </div>
              <p className="text-4xl font-bold">{students.length}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-glass">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/90 font-medium">Present</p>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <i className="fas fa-check"></i>
                </div>
              </div>
              <p className="text-4xl font-bold">{getPresentCount()}</p>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-glass">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/90 font-medium">Absent</p>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <i className="fas fa-times"></i>
                </div>
              </div>
              <p className="text-4xl font-bold">{getAbsentCount()}</p>
            </div>
          </div>

          {/* Student List */}
          <div className="glass-panel p-6 mb-6">
            <h3 className="text-xl font-display font-bold glass-text mb-6">Student Attendance</h3>
            
            {students.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-user-slash text-6xl text-slate-300 dark:text-slate-600 mb-4"></i>
                <p className="glass-text-muted text-lg">No students enrolled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => {
                  const studentId = student.id
                  const studentName = `${student.first_name} ${student.last_name}`
                  const studentRoll = student.student_id
                  
                  return (
                    <motion.div
                      key={studentId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0
                      }}
                      transition={{ duration: 0.15 }}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        attendance[studentId] === 'present'
                          ? 'border-green-400 dark:border-green-500 bg-green-50/50 dark:bg-green-900/20'
                          : attendance[studentId] === 'absent'
                          ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20'
                          : !attendance[studentId]
                          ? 'border-yellow-400 dark:border-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/10'
                          : 'border-white/20 bg-white/50 dark:bg-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          {student.profile_image ? (
                            <img 
                              src={`${API_ORIGIN}${student.profile_image}`}
                              alt={studentName}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </div>
                          )}
                          {/* Status Badge */}
                          {attendance[studentId] === 'present' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-white dark:border-gray-800"
                            >
                              <i className="fas fa-check text-white text-xs"></i>
                            </motion.div>
                          )}
                          {attendance[studentId] === 'absent' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center border-2 border-white dark:border-gray-800"
                            >
                              <i className="fas fa-times text-white text-xs"></i>
                            </motion.div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold glass-text">{studentName}</p>
                          <p className="text-sm glass-text-muted">{studentRoll}</p>
                        </div>
                      </div>

                      {/* Attendance Toggle Buttons */}
                      <div className="flex items-center gap-3">
                        <motion.button
                          onClick={() => handleAttendanceChange(studentId, 'present')}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                            attendance[studentId] === 'present'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/50 ring-2 ring-green-400'
                              : 'bg-white/50 dark:bg-gray-600/50 text-slate-600 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-900/20 border border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          <motion.i 
                            className="fas fa-check"
                            animate={attendance[studentId] === 'present' ? {
                              scale: [1, 1.3, 1],
                              rotate: [0, 10, -10, 0]
                            } : {}}
                            transition={{ duration: 0.5 }}
                          ></motion.i>
                          Present
                        </motion.button>
                        <motion.button
                          onClick={() => handleAttendanceChange(studentId, 'absent')}
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                            attendance[studentId] === 'absent'
                              ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-xl shadow-red-500/50 ring-2 ring-red-400'
                              : 'bg-white/50 dark:bg-gray-600/50 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          <motion.i 
                            className="fas fa-times"
                            animate={attendance[studentId] === 'absent' ? {
                              scale: [1, 1.3, 1],
                              rotate: [0, 180, 360]
                            } : {}}
                            transition={{ duration: 0.5 }}
                          ></motion.i>
                          Absent
                        </motion.button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Submit Button */}
          {students.length > 0 && (
            <div className="flex flex-col items-center gap-4">
              {getUnmarkedCount() > 0 && (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg px-6 py-3 flex items-center gap-3">
                  <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-xl"></i>
                  <span className="text-yellow-800 dark:text-yellow-300 font-semibold">
                    {getUnmarkedCount()} student{getUnmarkedCount() > 1 ? 's' : ''} not marked yet
                  </span>
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={getUnmarkedCount() > 0}
                className={`px-12 py-4 rounded-xl font-bold text-lg shadow-glass-lg transition-all transform ${
                  getUnmarkedCount() > 0
                    ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white hover:scale-105'
                }`}
              >
                <i className="fas fa-check-circle mr-2"></i>
                Confirm Attendance
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 glass-backdrop flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-modal p-8 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-circle text-3xl text-orange-500"></i>
              </div>
              <h3 className="text-2xl font-display font-bold glass-text mb-2">Confirm Attendance</h3>
              <p className="glass-text-muted">
                Are you sure you want to submit attendance for {selectedCourse?.subject_code}?
              </p>
            </div>

            <div className="glass-panel p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="glass-text-muted">Total Students:</span>
                <span className="font-bold glass-text">{students.length}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-green-600 dark:text-green-400">Present:</span>
                <span className="font-bold text-green-600 dark:text-green-400">{getPresentCount()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600 dark:text-red-400">Absent:</span>
                <span className="font-bold text-red-600 dark:text-red-400">{getAbsentCount()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="btn-glass flex-1 px-6 py-3 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Confirm
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Alert */}
      <CustomAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
    </motion.div>
  )
}

