import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import CustomAlert from '../components/CustomAlert'
import CustomSelect from '../components/CustomSelect'
import AssignmentDatePicker from '../components/AssignmentDatePicker'
import api from '../services/api'

export default function TeacherAssignments() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [mode, setMode] = useState('select') // select, upload, view, submissions
  const [subjects, setSubjects] = useState([])
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({ submitted: [], not_submitted: [] })
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' })
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', semester: '', subject_id: '', due_date: '', file: null
  })
  const [semesterSubjects, setSemesterSubjects] = useState([])
  
  // Rejection dialog
  const [rejectDialog, setRejectDialog] = useState({ show: false, submission: null, reason: '' })

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'teacher')) {
      navigate('/login')
      return
    }
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const res = await api.authenticatedGet('/teacher/get_assigned_subjects.php')
      if (res.success) setSubjects(res.data.subjects || [])
    } catch (e) { console.error(e) }
  }


  const fetchSubjectsBySemester = async (semester) => {
    try {
      const res = await api.authenticatedGet(`/assignments/get_subjects_by_semester.php?semester=${semester}`)
      if (res.success) setSemesterSubjects(res.data.subjects || [])
      else setSemesterSubjects([])
    } catch (e) { setSemesterSubjects([]) }
  }

  const fetchAssignments = async (subjectId = null) => {
    setLoading(true)
    try {
      const endpoint = subjectId 
        ? `/assignments/get_teacher_assignments.php?subject_id=${subjectId}`
        : '/assignments/get_teacher_assignments.php'
      const res = await api.authenticatedGet(endpoint)
      if (res.success) setAssignments(res.data.assignments || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fetchSubmissions = async (assignmentId) => {
    setLoading(true)
    try {
      const res = await api.authenticatedGet(`/assignments/get_submissions.php?assignment_id=${assignmentId}`)
      if (res.success) {
        setSubmissions({ submitted: res.data.submitted || [], not_submitted: res.data.not_submitted || [] })
        setSelectedAssignment(res.data.assignment)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSemesterChange = (e) => {
    const sem = e.target.value
    setUploadForm({ ...uploadForm, semester: sem, subject_id: '' })
    if (sem) fetchSubjectsBySemester(sem)
    else setSemesterSubjects([])
  }

  const handleFileChange = (e) => {
    setUploadForm({ ...uploadForm, file: e.target.files[0] })
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadForm.title || !uploadForm.subject_id || !uploadForm.semester || !uploadForm.due_date) {
      setAlert({ show: true, message: 'Please fill all required fields', type: 'error' })
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title', uploadForm.title)
      formData.append('description', uploadForm.description)
      formData.append('subject_id', uploadForm.subject_id)
      formData.append('semester', uploadForm.semester)
      formData.append('due_date', uploadForm.due_date)
      if (uploadForm.file) formData.append('file', uploadForm.file)

      const res = await fetch('http://localhost:8080/api/assignments/create.php', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setAlert({ show: true, message: 'Assignment created successfully!', type: 'success' })
        setUploadForm({ title: '', description: '', semester: '', subject_id: '', due_date: '', file: null })
        setMode('select')
      } else {
        setAlert({ show: true, message: data.message || 'Failed to create assignment', type: 'error' })
      }
    } catch (e) {
      setAlert({ show: true, message: 'Error creating assignment', type: 'error' })
    }
    setLoading(false)
  }


  const handleReject = async () => {
    if (!rejectDialog.submission) return
    setLoading(true)
    try {
      const res = await api.authenticatedPost('/assignments/review_submission.php', {
        submission_id: rejectDialog.submission.submission_id,
        action: 'reject',
        reason: rejectDialog.reason
      })
      if (res.success) {
        setAlert({ show: true, message: 'Submission rejected', type: 'success' })
        fetchSubmissions(selectedAssignment.id)
      } else {
        setAlert({ show: true, message: res.message || 'Failed to reject', type: 'error' })
      }
    } catch (e) {
      setAlert({ show: true, message: 'Error rejecting submission', type: 'error' })
    }
    setRejectDialog({ show: false, submission: null, reason: '' })
    setLoading(false)
  }

  const handleViewSubject = (subject) => {
    fetchAssignments(subject.id)
    setMode('view')
  }

  const handleViewSubmissions = (assignment) => {
    fetchSubmissions(assignment.id)
    setMode('submissions')
  }

  const goBack = () => {
    if (mode === 'submissions') { setMode('view'); setSelectedAssignment(null) }
    else if (mode === 'view' || mode === 'upload') { setMode('select'); setAssignments([]) }
    else navigate('/teacher/dashboard')
  }

  return (
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
            <h2 className="text-2xl font-bold">
              {mode === 'upload' ? 'Create Assignment' : mode === 'view' ? 'View Assignments' : mode === 'submissions' ? 'Submissions' : 'Assignment Management'}
            </h2>
            <p className="text-indigo-100">
              {mode === 'upload' ? 'Upload a new assignment for your students' : mode === 'submissions' ? `Viewing submissions for: ${selectedAssignment?.title}` : 'Create and manage assignments'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-6xl text-indigo-500"></i>
        </div>
      ) : mode === 'select' ? (
        /* Mode Selection */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => setMode('upload')}
            className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-lg cursor-pointer hover:bg-indigo-500/10 transition-all">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
              <i className="fas fa-upload text-3xl text-indigo-500"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Upload Assignment</h3>
            <p className="text-slate-600 dark:text-slate-400">Create a new assignment for your students</p>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => { fetchAssignments(); setMode('view') }}
            className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-lg cursor-pointer hover:bg-purple-500/10 transition-all">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
              <i className="fas fa-eye text-3xl text-purple-500"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">View Assignments</h3>
            <p className="text-slate-600 dark:text-slate-400">View and manage your assignments</p>
          </motion.div>
        </div>
      ) : mode === 'upload' ? (
        /* Upload Form */
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-lg">
          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Title *</label>
              <input type="text" value={uploadForm.title} onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                placeholder="Assignment title" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <textarea value={uploadForm.description} onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                rows="3" placeholder="Assignment description or instructions" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Semester *</label>
                <CustomSelect name="semester" value={uploadForm.semester} onChange={handleSemesterChange}
                  options={[1,2,3,4,5,6].map(s => ({ value: s.toString(), label: `Semester ${s}` }))} placeholder="Select Semester" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subject *</label>
                <CustomSelect name="subject" value={uploadForm.subject_id} onChange={(e) => setUploadForm({...uploadForm, subject_id: e.target.value})}
                  options={semesterSubjects.map(s => ({ value: s.id.toString(), label: `${s.subject_name} (${s.subject_code})` }))} 
                  placeholder={uploadForm.semester ? "Select Subject" : "Select semester first"} disabled={!uploadForm.semester} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AssignmentDatePicker
                label="Due Date"
                name="due_date"
                value={uploadForm.due_date}
                onChange={(e) => setUploadForm({...uploadForm, due_date: e.target.value})}
                required
              />
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Attachment (Optional)</label>
                <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-500 file:text-white" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50">
              {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Creating...</> : <><i className="fas fa-plus mr-2"></i>Create Assignment</>}
            </button>
          </form>
        </div>

      ) : mode === 'view' ? (
        /* View Assignments */
        <div>
          {assignments.length === 0 ? (
            <div className="text-center py-12 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20">
              <i className="fas fa-folder-open text-6xl text-slate-300 dark:text-slate-600 mb-4"></i>
              <p className="text-slate-600 dark:text-slate-400 text-lg">No assignments created yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => {
                const isPastDue = new Date(assignment.due_date) < new Date()
                return (
                  <motion.div key={assignment.id} whileHover={{ scale: 1.02 }}
                    className={`bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg ${isPastDue ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <i className="fas fa-file-alt text-xl text-indigo-500"></i>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPastDue ? 'bg-red-500/20 text-red-600' : 'bg-green-500/20 text-green-600'}`}>
                        {isPastDue ? 'Past Due' : 'Active'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{assignment.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{assignment.subject_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                      <i className="fas fa-calendar mr-1"></i> Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        <i className="fas fa-users mr-1"></i> {assignment.submission_count}/{assignment.total_students} submitted
                      </span>
                    </div>
                    <button onClick={() => handleViewSubmissions(assignment)}
                      className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-all">
                      View Submissions
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      ) : mode === 'submissions' ? (
        /* Submissions View */
        <div>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-white/90 font-medium mb-1">Total Students</p>
              <p className="text-4xl font-bold">{submissions.submitted.length + submissions.not_submitted.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-white/90 font-medium mb-1">Submitted</p>
              <p className="text-4xl font-bold">{submissions.submitted.length}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-white/90 font-medium mb-1">Not Submitted</p>
              <p className="text-4xl font-bold">{submissions.not_submitted.length}</p>
            </div>
          </div>

          {/* Submitted List */}
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-check-circle text-green-500"></i> Submitted ({submissions.submitted.length})
            </h3>
            {submissions.submitted.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4">No submissions yet</p>
            ) : (
              <div className="space-y-3">
                {submissions.submitted.map((student) => (
                  <div key={student.id} className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                    student.status === 'rejected' ? 'border-red-400 bg-red-50/50 dark:bg-red-900/20' : 
                    student.status === 'accepted' ? 'border-green-400 bg-green-50/50 dark:bg-green-900/20' : 
                    'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{student.first_name} {student.last_name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{student.student_id}</p>
                        <p className="text-xs text-slate-500">{new Date(student.submitted_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        student.status === 'rejected' ? 'bg-red-500 text-white' : 
                        student.status === 'accepted' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                      }`}>{student.status}</span>
                      <a href={`http://localhost:8080${student.file_path}`} target="_blank" rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold">
                        <i className="fas fa-eye mr-1"></i> View
                      </a>
                      {student.status !== 'rejected' && (
                        <button onClick={() => setRejectDialog({ show: true, submission: student, reason: '' })}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold">
                          <i className="fas fa-times mr-1"></i> Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Not Submitted List */}
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <i className="fas fa-times-circle text-red-500"></i> Not Submitted ({submissions.not_submitted.length})
            </h3>
            {submissions.not_submitted.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-4">All students have submitted!</p>
            ) : (
              <div className="space-y-3">
                {submissions.not_submitted.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold">
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{student.first_name} {student.last_name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{student.student_id}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-semibold">Pending</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Reject Dialog */}
      {rejectDialog.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-times-circle text-3xl text-red-500"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Reject Submission</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Rejecting submission from {rejectDialog.submission?.first_name} {rejectDialog.submission?.last_name}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Reason for Rejection</label>
              <textarea value={rejectDialog.reason} onChange={(e) => setRejectDialog({...rejectDialog, reason: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-gray-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                rows="3" placeholder="Enter reason for rejection..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRejectDialog({ show: false, submission: null, reason: '' })}
                className="flex-1 px-6 py-3 bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-white rounded-lg font-semibold">Cancel</button>
              <button onClick={handleReject}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold">Reject</button>
            </div>
          </motion.div>
        </div>
      )}

      <CustomAlert show={alert.show} message={alert.message} type={alert.type} onClose={() => setAlert({...alert, show: false})} />
    </motion.div>
  )
}
