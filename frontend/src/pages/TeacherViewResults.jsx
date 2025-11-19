import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

export default function TeacherViewResults() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [results, setResults] = useState([])

  const teacherDepartment = user?.department || 'BCA'

  const semesterOptions = [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Semester 3' },
    { value: '4', label: 'Semester 4' },
    { value: '5', label: 'Semester 5' },
    { value: '6', label: 'Semester 6' }
  ]

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'teacher')) {
      navigate('/login')
    }
  }, [])

  // Fetch subjects when semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedSemester && teacherDepartment) {
        try {
          const response = await api.authenticatedGet(`/admin/subjects/list.php?department=${teacherDepartment}`)
          if (response.success && response.data?.subjects) {
            const allSubjects = response.data.subjects
            const semesterSubjects = allSubjects.filter(s => s.semester === selectedSemester)
            
            const formattedSubjects = semesterSubjects.map(s => ({
              value: s.subject_code,
              label: s.subject_name,
              id: s.id
            }))
            setAvailableSubjects(formattedSubjects)
          }
        } catch (error) {
          console.error('Error fetching subjects:', error)
        }
      }
    }

    fetchSubjects()
  }, [selectedSemester, teacherDepartment])

  const handleSearch = async () => {
    if (!selectedSemester || !selectedSubject) return

    setLoading(true)
    try {
      // Fetch students for the department and semester
      const studentsRes = await api.getTeacherStudents({ 
        department: teacherDepartment,
        semester: selectedSemester
      })
      
      if (studentsRes.success) {
        const studentList = studentsRes.data.students || []
        
        // For now, we'll mock the results as we don't have a "get marks by subject" API yet
        // In a real app, we would fetch marks for this subject
        // TODO: Implement /teacher/get_marks.php?subject_code=...
        
        // Mocking results for demonstration
        const mockedResults = studentList.map(student => ({
          id: student.id,
          rollNo: student.student_id,
          name: `${student.first_name} ${student.last_name}`,
          internal1: Math.floor(Math.random() * 20) + 20, // Mock data
          internal2: Math.floor(Math.random() * 20) + 20, // Mock data
          assignment: Math.floor(Math.random() * 10) + 5, // Mock data
          attendance: Math.floor(Math.random() * 5) + 0, // Mock data
          total: 0 // Calculated later
        })).map(r => ({
          ...r,
          total: r.internal1 + r.internal2 + r.assignment + r.attendance
        }))

        setResults(mockedResults)
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-24 px-4 py-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/teacher/dashboard')}
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-purple-500 hover:text-white transition-all"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Student Results</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.full_name}</span>
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
            <i className="fas fa-user-tie text-xl"></i>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value)
                setSelectedSubject('')
                setResults([])
              }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">Select Semester</option>
              {semesterOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedSemester}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
            >
              <option value="">Select Subject</option>
              {availableSubjects.map(sub => (
                <option key={sub.value} value={sub.value}>{sub.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={!selectedSubject || loading}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-purple-500/30"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : 'View Results'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Results for {availableSubjects.find(s => s.value === selectedSubject)?.label}
            </h2>
            <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-all">
              <i className="fas fa-download mr-2"></i> Export CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-700/50 text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Roll No</th>
                  <th className="p-4 font-semibold">Student Name</th>
                  <th className="p-4 font-semibold text-center">Internal 1 (40)</th>
                  <th className="p-4 font-semibold text-center">Internal 2 (40)</th>
                  <th className="p-4 font-semibold text-center">Assignment (15)</th>
                  <th className="p-4 font-semibold text-center">Attendance (5)</th>
                  <th className="p-4 font-semibold text-center">Total (100)</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 text-slate-800 dark:text-white font-medium">{result.rollNo}</td>
                    <td className="p-4 text-slate-800 dark:text-white">{result.name}</td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300">{result.internal1}</td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300">{result.internal2}</td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300">{result.assignment}</td>
                    <td className="p-4 text-center text-slate-600 dark:text-slate-300">{result.attendance}</td>
                    <td className="p-4 text-center font-bold text-purple-600 dark:text-purple-400">{result.total}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        result.total >= 40 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {result.total >= 40 ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results.length === 0 && !loading && selectedSubject && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-search text-3xl text-slate-400"></i>
          </div>
          <p className="text-slate-500 dark:text-slate-400">No results found for this selection</p>
        </div>
      )}
    </motion.div>
  )
}
