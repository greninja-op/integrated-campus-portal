import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import CustomSelect from '../components/CustomSelect'
import SemesterMarksForm from '../components/SemesterMarksForm'
import api from '../services/api'

export default function TeacherMarks() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  const [showModal, setShowModal] = useState(false)
  const [examType, setExamType] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [maxMarks, setMaxMarks] = useState(40)
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({})
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [submissions, setSubmissions] = useState([])

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'teacher')) {
      navigate('/login')
      return
    }
    
    // Load students from teacher's department
    loadData()
    
    // Load submissions from localStorage
    const savedSubmissions = localStorage.getItem('teacherMarksSubmissions')
    if (savedSubmissions) {
      setSubmissions(JSON.parse(savedSubmissions))
    }
  }, [])

  const loadData = async () => {
    try {
      // Fetch students
      const studentsRes = await api.getTeacherStudents({ department: user.department })
      if (studentsRes.success) {
        const mappedStudents = (studentsRes.data.students || []).map(s => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          rollNo: s.student_id,
          semester: s.semester
        }))
        setStudents(mappedStudents)
      }

      // Fetch subjects
      const subjectsRes = await api.authenticatedGet(`/admin/subjects/list.php?department=${user.department}`)
      if (subjectsRes.success) {
        const subjects = subjectsRes.data.subjects || []
        
        // Group subjects by semester
        const groupedSubjects = {}
        subjects.forEach(sub => {
          if (!groupedSubjects[sub.semester]) {
            groupedSubjects[sub.semester] = []
          }
          groupedSubjects[sub.semester].push({
            value: sub.subject_code,
            label: sub.subject_name,
            id: sub.id
          })
        })
        setAvailableSubjects(groupedSubjects)
      }
    } catch (error) {
      console.error("Failed to load data", error)
    }
  }

  const examTypes = [
    { value: 'class_test', label: 'Class Test' },
    { value: 'internal_1', label: 'First Internal' },
    { value: 'internal_2', label: 'Second Internal' },
    { value: 'model_exam', label: 'Model Exam' },
    { value: 'semester_exam', label: 'Semester Exam' }
  ]

  const semesterOptions = [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Semester 3' },
    { value: '4', label: 'Semester 4' },
    { value: '5', label: 'Semester 5' },
    { value: '6', label: 'Semester 6' }
  ]

  // Get teacher's department (from user object)
  const teacherDepartment = user?.department || 'BCA'

  // Update available subjects when semester changes
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
              label: s.subject_name
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

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const handleExamTypeChange = (e) => {
    const type = e.target.value
    setExamType(type)
    
    // Set default max marks based on exam type
    if (type === 'class_test' || type === 'internal_1') {
      setMaxMarks(40)
    } else if (type === 'internal_2') {
      setMaxMarks(80)
    }
  }

  const handleMarkChange = (studentId, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: value
    }))
  }

  const handleSubmit = () => {
    // Save marks to localStorage or API
    const subjectLabel = availableSubjects.find(s => s.value === selectedSubject)?.label || selectedSubject
    const examLabel = examTypes.find(e => e.value === examType)?.label || examType
    
    const marksData = {
      id: Date.now(),
      examType,
      examLabel,
      subject: selectedSubject,
      subjectLabel,
      semester: selectedSemester,
      maxMarks,
      marks,
      studentCount: Object.keys(marks).length,
      submittedBy: user.full_name,
      submittedAt: new Date().toISOString()
    }
    
    console.log('Submitting marks:', marksData)
    
    // Add to submissions history
    setSubmissions(prev => {
      const updated = [marksData, ...prev]
      // Save to localStorage
      localStorage.setItem('teacherMarksSubmissions', JSON.stringify(updated))
      return updated
    })
    
    alert('✅ Marks submitted successfully!')
    setShowModal(false)
    resetForm()
  }

  const resetForm = () => {
    setExamType('')
    setSelectedSemester('')
    setSelectedSubject('')
    setMaxMarks(40)
    setMarks({})
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.15 }}
        className="min-h-screen pb-24 px-4 py-6 max-w-7xl mx-auto"
      >
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Marks Management</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.full_name}</span>
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
              <i className="fas fa-user-tie text-xl"></i>
            </div>
          </div>
        </header>

        <p className="text-slate-600 dark:text-slate-400 mb-8">Enter test and exam marks for students</p>

        {/* Add Marks Card */}
        <div 
          onClick={handleOpenModal}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 mb-8 text-white shadow-2xl cursor-pointer hover:shadow-2xl transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-pen text-4xl"></i>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Add Marks</h2>
              <p className="text-green-100">Enter test and exam marks</p>
            </div>
          </div>
        </div>

        {/* Recent Marks History */}
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Recent Submissions</h2>
          
          {submissions.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">No marks submitted yet</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="bg-white/50 dark:bg-gray-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                        {submission.examLabel}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        <i className="fas fa-book mr-2"></i>
                        {submission.subjectLabel} - Semester {submission.semester}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                        <i className="fas fa-users mr-2"></i>
                        {submission.studentCount} students • Max Marks: {submission.maxMarks}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(submission.submittedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full my-8 shadow-2xl max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-8 pb-4">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Add Marks</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 pb-8">

            {/* Step 1: Select Exam Type */}
            {!examType && (
              <div className="space-y-6">
                <CustomSelect
                  name="examType"
                  value={examType}
                  onChange={handleExamTypeChange}
                  options={examTypes}
                  label="Select Exam Type"
                  placeholder="Choose exam type"
                />
              </div>
            )}

            {/* Step 2: Select Semester */}
            {examType && !selectedSemester && (
              <div className="space-y-6">
                <button
                  onClick={() => setExamType('')}
                  className="text-indigo-500 hover:text-indigo-600 mb-4"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back
                </button>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-4">
                  <p className="text-slate-800 dark:text-white font-semibold">
                    {examTypes.find(e => e.value === examType)?.label}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Department: {teacherDepartment}</p>
                </div>

                <CustomSelect
                  name="semester"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  options={semesterOptions}
                  label="Select Semester"
                  placeholder="Choose semester"
                />

                <button
                  onClick={() => selectedSemester && setSelectedSemester(selectedSemester)}
                  disabled={!selectedSemester}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 3: Select Subject and Configure */}
            {examType && selectedSemester && !selectedSubject && (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedSemester('')}
                  className="text-indigo-500 hover:text-indigo-600 mb-4"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back
                </button>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-4">
                  <p className="text-slate-800 dark:text-white font-semibold">
                    {examTypes.find(e => e.value === examType)?.label} - Semester {selectedSemester}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Department: {teacherDepartment}</p>
                </div>

                <CustomSelect
                  name="subject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  options={availableSubjects}
                  label="Select Subject"
                  placeholder="Choose subject"
                />

                {examType !== 'semester' && (
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                      Maximum Marks
                    </label>
                    <input
                      type="number"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                )}

                <button
                  onClick={() => selectedSubject && setSelectedSubject(selectedSubject)}
                  disabled={!selectedSubject}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 3: Enter Marks */}
            {examType && selectedSubject && examType !== 'semester' && (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedSubject('')}
                  className="text-indigo-500 hover:text-indigo-600 mb-4"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back
                </button>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-4">
                  <p className="text-slate-800 dark:text-white font-semibold">
                    {examTypes.find(e => e.value === examType)?.label} - {availableSubjects.find(s => s.value === selectedSubject)?.label}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Maximum Marks: {maxMarks}</p>
                </div>

                <div className="space-y-3">
                  {students.filter(s => s.semester === parseInt(selectedSemester)).map(student => (
                    <div key={student.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-white">{student.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{student.rollNo}</p>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          max={maxMarks}
                          value={marks[student.id] || ''}
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                          placeholder={`/ ${maxMarks}`}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all"
                >
                  <i className="fas fa-check mr-2"></i>
                  Submit Marks
                </button>
              </div>
            )}

            {/* Semester Marks - Complex Form */}
            {examType === 'semester' && selectedSubject && !selectedStudent && (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedSubject('')}
                  className="text-indigo-500 hover:text-indigo-600 mb-4"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back
                </button>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-4">
                  <p className="text-slate-800 dark:text-white font-semibold">
                    Semester Exam - {availableSubjects.find(s => s.value === selectedSubject)?.label}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Select a student to enter marks</p>
                </div>

                <div className="space-y-3">
                  {students.filter(s => s.semester === parseInt(selectedSemester)).map(student => (
                    <div 
                      key={student.id} 
                      onClick={() => setSelectedStudent(student)}
                      className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-white">{student.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{student.rollNo} - Semester {student.semester}</p>
                      </div>
                      <i className="fas fa-chevron-right text-slate-400"></i>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Semester Marks Entry Form */}
            {examType === 'semester' && selectedStudent && (
              <SemesterMarksForm
                student={selectedStudent}
                onSubmit={(data) => {
                  console.log('Semester marks:', data)
                  // Save to localStorage or API
                  localStorage.setItem(`semester_marks_${selectedStudent.id}`, JSON.stringify(data))
                  alert('✅ Semester marks submitted successfully!')
                  setShowModal(false)
                  resetForm()
                  setSelectedStudent(null)
                }}
                onBack={() => setSelectedStudent(null)}
              />
            )}
            </div>
          </motion.div>
        </div>
      )}

    </>
  )
}

