import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

export default function TeacherUploadMaterials() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [uploadType, setUploadType] = useState('notes')
  const [formData, setFormData] = useState({
    department: 'BCA',
    subject: '',
    semester: '1',
    year: new Date().getFullYear().toString(),
    examType: 'internal_1',
    file: null
  })
  const [uploading, setUploading] = useState(false)
  const [uploadedMaterials, setUploadedMaterials] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])

  // Get teacher's department from profile
  const teacherDepartment = user?.department || 'BCA'

  useEffect(() => {
    fetchData()
  }, [teacherDepartment])

  // Fetch subjects when department or semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      const department = formData.department || teacherDepartment
      if (formData.semester && department) {
        try {
          const semesterInt = parseInt(formData.semester)
          const response = await api.authenticatedGet(`/admin/subjects/list.php?department=${department}&semester=${semesterInt}`)
          if (response.success && response.data?.subjects) {
            const formattedSubjects = response.data.subjects.map(s => s.subject_name)
            setAvailableSubjects(formattedSubjects)
          }
        } catch (error) {
          console.error('Error fetching subjects:', error)
          setAvailableSubjects([])
        }
      } else {
        setAvailableSubjects([])
      }
    }

    fetchSubjects()
  }, [formData.semester, formData.department, teacherDepartment])

  const fetchData = async () => {
    try {
      const response = await api.getMaterials(teacherDepartment)
      if (response.success && response.data?.materials) {
        setUploadedMaterials(response.data.materials)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file')
      e.target.value = ''
      return
    }
    
    if (file.size > maxSize) {
      alert('File size exceeds 50MB limit. Please select a smaller file.')
      e.target.value = ''
      return
    }
    
    setFormData(prev => ({ ...prev, file }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.file) {
      alert('Please select a PDF file')
      return
    }

    setUploading(true)

    try {
      const data = new FormData()
      data.append('department', teacherDepartment)
      data.append('semester', formData.semester)
      data.append('subject', formData.subject)
      data.append('materialType', uploadType)
      if (uploadType === 'question_paper') {
        data.append('year', formData.year)
        data.append('examType', formData.examType)
      }
      data.append('file', formData.file)

      const response = await api.uploadMaterial(data)
      
      if (response.success) {
        alert('✅ Material uploaded successfully!')
        setFormData({
          subject: '',
          semester: '1',
          year: new Date().getFullYear().toString(),
          file: null
        })
        document.getElementById('fileInput').value = ''
        fetchData() // Refresh list
      } else {
        alert('❌ Upload failed: ' + response.message)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('❌ An error occurred during upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return

    try {
      const response = await api.deleteMaterial(materialId)
      if (response.success) {
        setUploadedMaterials(prev => prev.filter(m => m.id !== materialId))
        alert('✅ Material deleted successfully')
      } else {
        alert('❌ Delete failed: ' + response.message)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('❌ An error occurred during deletion')
    }
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
            className="w-10 h-10 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all"
          >
            <i className="fas fa-arrow-left text-slate-800 dark:text-white"></i>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Upload Study Materials</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Department: {teacherDepartment}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.full_name}</span>
        </div>
      </header>

      {/* Upload Form */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Upload New Material</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Material Type */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-3">
              Material Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  value="notes"
                  checked={uploadType === 'notes'}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  uploadType === 'notes'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-gray-700/50'
                }`}>
                  <i className="fas fa-book text-2xl mb-2 text-purple-500"></i>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Notes</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Study notes and materials</p>
                </div>
              </label>
              
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  value="question_paper"
                  checked={uploadType === 'question_paper'}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 rounded-lg border-2 transition-all ${
                  uploadType === 'question_paper'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-gray-700/50'
                }`}>
                  <i className="fas fa-file-alt text-2xl mb-2 text-purple-500"></i>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Question Paper</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Previous year papers</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subject */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Subject</option>
                {availableSubjects.map((subject, index) => (
                  <option key={index} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 transition-all"
              >
                {[1, 2, 3, 4, 5, 6].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            {/* Year (only for question papers) */}
            {uploadType === 'question_paper' && (
              <>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min="2020"
                    max="2030"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                    Exam Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="examType"
                    value={formData.examType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 transition-all"
                  >
                    <option value="internal_1">Internal 1</option>
                    <option value="internal_2">Internal 2</option>
                    <option value="semester">Semester Exam</option>
                  </select>
                </div>
              </>
            )}

            {/* File Upload */}
            <div className={uploadType === 'question_paper' ? '' : 'md:col-span-2'}>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                PDF File <span className="text-red-500">*</span>
              </label>
              <input
                id="fileInput"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 transition-all"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Max file size: 50MB | Format: PDF only
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Uploading...
              </>
            ) : (
              <>
                <i className="fas fa-upload mr-2"></i>
                Upload Material
              </>
            )}
          </button>
        </form>
      </div>

      {/* Uploaded Materials List */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Uploaded Materials</h2>
        
        {uploadedMaterials.length === 0 ? (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">
            <i className="fas fa-folder-open text-6xl mb-4"></i>
            <p>No materials uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploadedMaterials.map(material => (
              <div
                key={material.id}
                className="flex items-center justify-between p-4 bg-white/20 dark:bg-gray-700/20 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <i className="fas fa-file-pdf text-2xl text-purple-500"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 dark:text-white">
                      {material.subject} - Semester {material.semester}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {material.type === 'notes' ? 'Notes' : `Question Paper (${material.year})`} • {material.fileName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {new Date(material.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(material.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

