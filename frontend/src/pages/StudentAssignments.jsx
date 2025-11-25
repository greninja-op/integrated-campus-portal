import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ThemeToggle from '../components/ThemeToggle'
import CustomAlert from '../components/CustomAlert'
import api from '../services/api'

export default function StudentAssignments() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = api.getCurrentUser()
  
  const [mode, setMode] = useState('subjects') // subjects, assignments
  const [subjects, setSubjects] = useState([])
  const [assignments, setAssignments] = useState({ pending: [], rejected: [], submitted: [], overdue: [] })
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null)
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/login')
      return
    }
    fetchSubjects()
    
    // Check if redirected from dashboard with specific assignment
    const assignmentId = searchParams.get('assignment')
    const subjectId = searchParams.get('subject')
    if (subjectId) {
      fetchAssignments(subjectId)
      setMode('assignments')
    }
  }, [])

  const fetchSubjects = async () => {
    setLoading(true)
    try {
      const res = await api.authenticatedGet('/assignments/get_student_subjects.php')
      if (res.success) setSubjects(res.data.subjects || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchAssignments = async (subjectId) => {
    setLoading(true)
    try {
      const res = await api.authenticatedGet(`/assignments/get_student_assignments.php?subject_id=${subjectId}`)
      if (res.success) setAssignments(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }


  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject)
    fetchAssignments(subject.id)
    setMode('assignments')
  }

  const handleFileUpload = async (assignmentId, file) => {
    if (!file) return
    setUploading(assignmentId)
    try {
      const formData = new FormData()
      formData.append('assignment_id', assignmentId)
      formData.append('file', file)

      const res = await fetch('http://localhost:8080/api/assignments/submit.php', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setAlert({ show: true, message: 'Assignment submitted successfully!', type: 'success' })
        fetchAssignments(selectedSubject.id)
      } else {
        setAlert({ show: true, message: data.message || 'Failed to submit', type: 'error' })
      }
    } catch (e) {
      setAlert({ show: true, message: 'Error submitting assignment', type: 'error' })
    }
    setUploading(null)
  }

  const goBack = () => {
    if (mode === 'assignments') {
      setMode('subjects')
      setSelectedSubject(null)
      setAssignments({ pending: [], rejected: [], submitted: [], overdue: [] })
    } else {
      navigate('/dashboard')
    }
  }

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const AssignmentCard = ({ assignment, showUpload = true }) => {
    const isPastDue = new Date(assignment.due_date) < new Date()
    const isRejected = assignment.submission_status === 'rejected'
    const isSubmitted = assignment.submission_status === 'submitted' || assignment.submission_status === 'accepted'

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={`relative bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border-2 shadow-lg ${
          isRejected ? 'border-red-400' : isSubmitted ? 'border-green-400' : isPastDue ? 'border-gray-400 opacity-60' : 'border-indigo-400'
        }`}>
        {/* Past due overlay */}
        {isPastDue && !isSubmitted && (
          <div className="absolute inset-0 bg-gray-500/10 rounded-2xl flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm transform -rotate-12">
              Deadline: {formatDate(assignment.due_date)}
            </span>
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{assignment.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <i className="fas fa-user mr-1"></i> {assignment.teacher_first_name} {assignment.teacher_last_name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              <i className="fas fa-book mr-1"></i> {assignment.subject_name}
            </p>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isRejected ? 'bg-red-500 text-white' : 
              isSubmitted ? 'bg-green-500 text-white' : 
              isPastDue ? 'bg-gray-500 text-white' : 'bg-indigo-500 text-white'
            }`}>
              {isRejected ? 'Rejected' : isSubmitted ? 'Submitted' : isPastDue ? 'Overdue' : 'Pending'}
            </span>
            <p className={`text-sm mt-2 ${isPastDue && !isSubmitted ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
              Due: {formatDate(assignment.due_date)}
            </p>
          </div>
        </div>

        {assignment.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{assignment.description}</p>
        )}

        {/* Rejection reason */}
        {isRejected && assignment.rejection_reason && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              <i className="fas fa-exclamation-circle mr-1"></i> <strong>Rejection Reason:</strong> {assignment.rejection_reason}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {assignment.file_path && (
            <a href={`http://localhost:8080${assignment.file_path}`} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold">
              <i className="fas fa-file-pdf mr-1"></i> View Question
            </a>
          )}
          
          {showUpload && !isPastDue && (!isSubmitted || isRejected) && (
            <label className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold cursor-pointer">
              {uploading === assignment.id ? (
                <><i className="fas fa-spinner fa-spin mr-1"></i> Uploading...</>
              ) : (
                <><i className="fas fa-upload mr-1"></i> {isRejected ? 'Resubmit' : 'Submit'}</>
              )}
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(assignment.id, e.target.files[0])} disabled={uploading === assignment.id} />
            </label>
          )}

          {isSubmitted && assignment.submission_file && (
            <a href={`http://localhost:8080${assignment.submission_file}`} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold">
              <i className="fas fa-eye mr-1"></i> View Submission
            </a>
          )}
        </div>
      </motion.div>
    )
  }


  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.15 }}
        className="min-h-screen pb-24 px-4 py-6 max-w-7xl mx-auto"
      >
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all">
              <i className="fas fa-arrow-left text-slate-800 dark:text-white"></i>
            </button>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Assignments</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.full_name}</span>
          </div>
        </header>

        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-tasks text-3xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{mode === 'subjects' ? 'Your Subjects' : selectedSubject?.subject_name}</h2>
              <p className="text-indigo-100">{mode === 'subjects' ? 'Select a subject to view assignments' : `${selectedSubject?.subject_code} • Semester ${user?.semester}`}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <i className="fas fa-spinner fa-spin text-6xl text-indigo-500"></i>
          </div>
        ) : mode === 'subjects' ? (
          /* Subject Selection */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20">
                <i className="fas fa-book-open text-6xl text-slate-300 dark:text-slate-600 mb-4"></i>
                <p className="text-slate-600 dark:text-slate-400 text-lg">No subjects found</p>
              </div>
            ) : (
              subjects.map((subject) => (
                <motion.div key={subject.id} whileHover={{ scale: 1.02 }} onClick={() => handleSubjectClick(subject)}
                  className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg cursor-pointer hover:bg-indigo-500/10 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <i className="fas fa-book text-xl text-indigo-500"></i>
                    </div>
                    {(subject.pending_count > 0 || subject.rejected_count > 0) && (
                      <div className="flex gap-2">
                        {subject.pending_count > 0 && (
                          <span className="px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">
                            {subject.pending_count} new
                          </span>
                        )}
                        {subject.rejected_count > 0 && (
                          <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold">
                            {subject.rejected_count} rejected
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{subject.subject_name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{subject.subject_code}</p>
                  <p className="text-sm text-slate-500">{subject.total_assignments} assignment(s)</p>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          /* Assignments View */
          <div className="space-y-8">
            {/* Pending & Rejected (Priority) */}
            {(assignments.pending.length > 0 || assignments.rejected.length > 0) && (
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-orange-500"></i> Action Required
                </h3>
                <div className="space-y-4">
                  {assignments.rejected.map(a => <AssignmentCard key={a.id} assignment={a} />)}
                  {assignments.pending.map(a => <AssignmentCard key={a.id} assignment={a} />)}
                </div>
              </div>
            )}

            {/* Submitted */}
            {assignments.submitted.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-check-circle text-green-500"></i> Submitted
                </h3>
                <div className="space-y-4">
                  {assignments.submitted.map(a => <AssignmentCard key={a.id} assignment={a} showUpload={false} />)}
                </div>
              </div>
            )}

            {/* Overdue */}
            {assignments.overdue.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <i className="fas fa-clock text-red-500"></i> Past Due Date
                </h3>
                <div className="space-y-4">
                  {assignments.overdue.map(a => <AssignmentCard key={a.id} assignment={a} showUpload={false} />)}
                </div>
              </div>
            )}

            {assignments.pending.length === 0 && assignments.rejected.length === 0 && 
             assignments.submitted.length === 0 && assignments.overdue.length === 0 && (
              <div className="text-center py-12 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20">
                <i className="fas fa-inbox text-6xl text-slate-300 dark:text-slate-600 mb-4"></i>
                <p className="text-slate-600 dark:text-slate-400 text-lg">No assignments for this subject</p>
              </div>
            )}
          </div>
        )}

        <CustomAlert show={alert.show} message={alert.message} type={alert.type} onClose={() => setAlert({...alert, show: false})} />
      </motion.div>
      <Navigation />
    </>
  )
}
