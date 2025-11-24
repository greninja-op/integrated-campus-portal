import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import CustomSelect from '../components/CustomSelect'
import api from '../services/api'

export default function TeacherStudentList() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'teacher')) {
      navigate('/login')
      return
    }
    fetchStudents()
  }, [])
  
  const fetchStudents = async () => {
    setLoading(true)
    try {
      const response = await api.getTeacherStudents({ department: user.department })
      if (response.success && response.data) {
        const studentsData = response.data.students || []
        const mappedStudents = studentsData.map(s => ({
          id: s.id,
          rollNo: s.student_id,
          name: `${s.first_name} ${s.last_name}`,
          email: s.email,
          phone: s.phone,
          department: s.department,
          semester: s.semester,
          section: 'A',
          profileImage: s.profile_image,
          attendance: parseFloat(s.attendance_percentage || 0).toFixed(1),
          cgpa: parseFloat(s.cgpa || 0).toFixed(2),
          courses: [],
          address: s.address,
          dateOfBirth: s.date_of_birth,
          guardianName: '',
          guardianPhone: '',
          bloodGroup: '',
          recentMarks: []
        }))
        setStudents(mappedStudents)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Old mock data removed - now using real API
  const [oldMockStudents] = useState([
    {
      id: 1,
      rollNo: 'BCA2023001',
      name: 'Aarav Sharma',
      email: 'aarav@university.edu',
      phone: '+91 98765 43210',
      department: 'BCA',
      semester: 5,
      section: 'A',
      profileImage: null,
      attendance: 87.5,
      cgpa: 8.4,
      courses: ['Computer Networks', 'IT and Environment', 'Java Programming Using Linux', 'Open Course'],
      address: '123 MG Road, Bangalore, Karnataka',
      dateOfBirth: '2004-05-15',
      guardianName: 'Rajesh Sharma',
      guardianPhone: '+91 98765 43211',
      bloodGroup: 'O+',
      recentMarks: [
        { subject: 'Computer Networks', marks: 85, total: 100 },
        { subject: 'Java Programming Using Linux', marks: 78, total: 100 },
        { subject: 'IT and Environment', marks: 92, total: 100 }
      ]
    },
    {
      id: 2,
      rollNo: 'BCA2023002',
      name: 'Diya Patel',
      email: 'diya@university.edu',
      phone: '+91 98765 43212',
      department: 'BCA',
      semester: 5,
      section: 'A',
      profileImage: null,
      attendance: 92.3,
      cgpa: 9.1,
      courses: ['Computer Networks', 'Java Programming Using Linux', 'Cloud Computing'],
      address: '456 Park Street, Mumbai, Maharashtra',
      dateOfBirth: '2004-08-22',
      guardianName: 'Amit Patel',
      guardianPhone: '+91 98765 43213',
      bloodGroup: 'A+',
      recentMarks: [
        { subject: 'Computer Networks', marks: 95, total: 100 },
        { subject: 'Java Programming Using Linux', marks: 88, total: 100 },
        { subject: 'Cloud Computing', marks: 90, total: 100 }
      ]
    },
    {
      id: 3,
      rollNo: 'BBA2023003',
      name: 'Arjun Kumar',
      email: 'arjun@university.edu',
      phone: '+91 98765 43214',
      department: 'BBA',
      semester: 3,
      section: 'B',
      profileImage: null,
      attendance: 78.9,
      cgpa: 7.8,
      courses: ['Operating Systems', 'Computer Graphics'],
      address: '789 Lake View, Chennai, Tamil Nadu',
      dateOfBirth: '2004-03-10',
      guardianName: 'Suresh Kumar',
      guardianPhone: '+91 98765 43215',
      bloodGroup: 'B+',
      recentMarks: [
        { subject: 'Operating Systems', marks: 72, total: 100 },
        { subject: 'Computer Graphics', marks: 80, total: 100 }
      ]
    },
    {
      id: 4,
      rollNo: 'COM2023004',
      name: 'Ananya Singh',
      email: 'ananya@university.edu',
      phone: '+91 98765 43216',
      department: 'B.Com',
      semester: 5,
      section: 'A',
      profileImage: null,
      attendance: 95.2,
      cgpa: 9.3,
      courses: ['Web Programming Using PHP', 'Design and Analysis of Algorithms', 'System Analysis and Software Engineering'],
      address: '321 Gandhi Nagar, Delhi',
      dateOfBirth: '2004-11-05',
      guardianName: 'Vikram Singh',
      guardianPhone: '+91 98765 43217',
      bloodGroup: 'AB+',
      recentMarks: [
        { subject: 'Web Programming Using PHP', marks: 98, total: 100 },
        { subject: 'Design and Analysis of Algorithms', marks: 94, total: 100 },
        { subject: 'System Analysis and Software Engineering', marks: 96, total: 100 }
      ]
    },
    {
      id: 5,
      rollNo: 'BCA2024005',
      name: 'Vihaan Reddy',
      email: 'vihaan@university.edu',
      phone: '+91 98765 43218',
      department: 'BCA',
      semester: 1,
      section: 'B',
      profileImage: null,
      attendance: 82.1,
      cgpa: 8.0,
      courses: ['Data Mining', 'Mobile Application Development Android'],
      address: '654 Tech Park, Hyderabad, Telangana',
      dateOfBirth: '2004-07-18',
      guardianName: 'Ramesh Reddy',
      guardianPhone: '+91 98765 43219',
      bloodGroup: 'O-',
      recentMarks: [
        { subject: 'Data Mining', marks: 82, total: 100 },
        { subject: 'Mobile Application Development Android', marks: 79, total: 100 }
      ]
    }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [filterBatch, setFilterBatch] = useState('all')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterSemester, setFilterSemester] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showFullDetails, setShowFullDetails] = useState(false)

  // Get teacher's department from user data
  const teacherDepartment = user?.department || 'BCA'

  // Calculate admission year from semester (assuming current year is 2024)
  const getAdmissionYear = (semester) => {
    const currentYear = 2024
    const yearsPassed = Math.floor((semester - 1) / 2)
    return currentYear - yearsPassed
  }

  // Generate batch label with year range (e.g., "2025-2028")
  const getBatchLabel = (admissionYear) => {
    const graduationYear = admissionYear + 3 // 3-year degree program
    return `${admissionYear}-${graduationYear}`
  }

  // Filter students by department, semester, and batch
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDepartment = filterDepartment === 'all' || student.department === filterDepartment
    const matchesSemester = filterSemester === 'all' || student.semester === parseInt(filterSemester)
    
    const studentBatch = getAdmissionYear(student.semester)
    const matchesBatch = filterBatch === 'all' || studentBatch === parseInt(filterBatch)
    
    return matchesSearch && matchesDepartment && matchesSemester && matchesBatch
  })

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400'
    if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getAttendanceBgColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500/20'
    if (percentage >= 75) return 'bg-yellow-500/20'
    return 'bg-red-500/20'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen pb-24 px-4 py-6 max-w-7xl mx-auto"
    >
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all"
          >
            <i className="fas fa-arrow-left text-slate-800 dark:text-white"></i>
          </button>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Student List</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.full_name}</span>
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-users text-lg"></i>
          </div>
        </div>
      </header>

      {/* Page Title - Exact Design */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-3">Student List</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Manage your students and view their academic progress.</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg mb-6 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2 lg:col-span-1">
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 z-10"></i>
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a9ff]"
            />
          </div>

          {/* Semester Filter */}
          <CustomSelect
            name="semester"
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
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

          {/* Batch/Admission Year Filter */}
          <CustomSelect
            name="batch"
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            options={[
              { value: 'all', label: 'All Batches' },
              { value: '2025', label: '2025-2028 Batch' },
              { value: '2024', label: '2024-2027 Batch' },
              { value: '2023', label: '2023-2026 Batch' },
              { value: '2022', label: '2022-2025 Batch' },
              { value: '2021', label: '2021-2024 Batch' }
            ]}
            placeholder="Select Batch"
          />
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {filteredStudents.map((student) => (
          <motion.div
            key={student.id}
            whileHover={{ scale: 1.02, y: -5 }}
            onClick={() => {
              setSelectedStudent(student)
              setShowFullDetails(true)
            }}
            className="overflow-hidden rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer hover:shadow-[0_20px_60px_rgb(0,0,0,0.3)] hover:-translate-y-2 transition-all duration-300"
          >
            {/* Red Header - Compact */}
            <div className="relative bg-gradient-to-r from-red-500 via-rose-600 to-red-600 p-5 text-white shadow-[inset_0_-2px_10px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-200/50 flex items-center justify-center text-white font-bold text-base shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
                  {student.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold drop-shadow-sm">{student.name}</h3>
                  <p className="text-sm text-red-50">{student.rollNo}</p>
                  <p className="text-xs text-red-100">Department</p>
                </div>
              </div>
            </div>

            {/* Light Red Body with 3D depth */}
            <div className="relative bg-red-50 dark:bg-red-900/20 p-5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)]">
              {/* Department Icon and Name */}
              <div className="flex items-center gap-2 mb-4">
                <i className="fas fa-building text-slate-800 dark:text-slate-200 text-sm"></i>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{student.department}</span>
              </div>

              {/* Stats Grid with 3D depth */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Attendance</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{student.attendance}%</p>
                </div>
                <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">CGPA</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{student.cgpa}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setSelectedStudent(null)
              setShowFullDetails(false)
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ${
                showFullDetails ? 'w-full max-w-6xl max-h-[90vh]' : 'w-full max-w-2xl'
              } transition-all duration-300`}
            >
              {/* Modal Header - Red, Compact */}
              <div className="bg-gradient-to-r from-red-500 via-rose-600 to-red-600 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-200/50 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                      <p className="text-red-50">{selectedStudent.rollNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFullDetails(!showFullDetails)}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                    >
                      <i className={`fas ${showFullDetails ? 'fa-compress' : 'fa-expand'}`}></i>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudent(null)
                        setShowFullDetails(false)
                      }}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                {!showFullDetails ? (
                  /* Compact View */
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                          <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                          <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Department</p>
                          <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent.department}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Semester</p>
                          <p className="font-semibold text-slate-800 dark:text-white">Semester {selectedStudent.semester}</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats - Purple Theme */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 mb-2">
                          <i className="fas fa-calendar-check text-red-500"></i>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Attendance</p>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{selectedStudent.attendance}%</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 cursor-pointer hover:underline">View Full Attendance →</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <i className="fas fa-chart-line text-blue-500"></i>
                          <p className="text-xs text-slate-600 dark:text-slate-400">CGPA</p>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{selectedStudent.cgpa}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Out of 10.0</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <i className="fas fa-book text-purple-500"></i>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Courses</p>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{selectedStudent.courses.length}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enrolled</p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => setShowFullDetails(true)}
                      className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg font-semibold transition-all"
                    >
                      <i className="fas fa-expand mr-2"></i>
                      View Full Details
                    </button>
                  </div>
                ) : (
                  /* Full Details View */
                  <div className="space-y-6">
                    {/* Performance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`${getAttendanceBgColor(selectedStudent.attendance)} rounded-xl p-6`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Attendance</p>
                          <i className="fas fa-calendar-check text-2xl text-slate-400"></i>
                        </div>
                        <p className={`text-4xl font-bold ${getAttendanceColor(selectedStudent.attendance)} mb-2`}>
                          {selectedStudent.attendance}%
                        </p>
                        <button
                          onClick={() => navigate('/teacher/student-attendance/' + selectedStudent.id)}
                          className="text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                          View Full Attendance →
                        </button>
                      </div>

                      <div className="bg-blue-500/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-slate-600 dark:text-slate-400">CGPA</p>
                          <i className="fas fa-chart-line text-2xl text-slate-400"></i>
                        </div>
                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{selectedStudent.cgpa}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Out of 10.0</p>
                      </div>

                      <div className="bg-purple-500/20 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Courses</p>
                          <i className="fas fa-book text-2xl text-slate-400"></i>
                        </div>
                        <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                          {selectedStudent.courses.length}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Enrolled</p>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-slate-100 dark:bg-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Date of Birth</p>
                          <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent.dateOfBirth}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Blood Group</p>
                          <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent.bloodGroup}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Address</p>
                          <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Guardian Information */}
                    <div className="bg-slate-100 dark:bg-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Guardian Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Guardian Name</p>
                          <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent.guardianName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Guardian Phone</p>
                          <p className="font-semibold text-slate-800 dark:text-white">{selectedStudent.guardianPhone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Recent Marks */}
                    <div className="bg-slate-100 dark:bg-gray-700/50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Marks</h3>
                        <button
                          onClick={() => navigate('/teacher/student-marks/' + selectedStudent.id)}
                          className="text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                          View All Marks →
                        </button>
                      </div>
                      <div className="space-y-3">
                        {selectedStudent.recentMarks.map((mark, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600/50 rounded-lg">
                            <span className="font-medium text-slate-800 dark:text-white">{mark.subject}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-slate-800 dark:text-white">{mark.marks}</span>
                              <span className="text-slate-600 dark:text-slate-400">/ {mark.total}</span>
                              <span className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                                (mark.marks / mark.total) * 100 >= 90 ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                                (mark.marks / mark.total) * 100 >= 75 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                'bg-red-500/20 text-red-600 dark:text-red-400'
                              }`}>
                                {((mark.marks / mark.total) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Enrolled Courses */}
                    <div className="bg-slate-100 dark:bg-gray-700/50 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Enrolled Courses</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.courses.map((course, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg font-semibold"
                          >
                            {course}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

