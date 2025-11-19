import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/ThemeToggle'
import CustomSelect from '../../components/CustomSelect'
import api from '../../services/api'

export default function AdminUploadMaterials() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [formData, setFormData] = useState({
    department: 'BCA',
    semester: '1',
    subject: '',
    materialType: 'notes',
    unit: '1', // For notes
    year: new Date().getFullYear().toString(), // For question papers
    description: ''
  })
  
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [uploadedMaterials, setUploadedMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  const departments = ['BCA', 'BBA', 'B.Com']
  const semesters = ['1', '2', '3', '4', '5', '6']
  const materialTypes = ['notes', 'question_papers']
  const units = ['1', '2', '3', '4', '5', '6', '7', '8']
  
  const departmentOptions = departments.map(dept => ({ value: dept, label: dept }))
  const semesterOptions = semesters.map(sem => ({ value: sem, label: `Semester ${sem}` }))
  const materialTypeOptions = materialTypes.map(type => ({ 
    value: type, 
    label: type === 'notes' ? 'Notes' : 'Question Papers' 
  }))
  const unitOptions = units.map(unit => ({ value: unit, label: `Unit ${unit}` }))
  const subjectOptions = availableSubjects.map(subj => ({ 
    value: subj.subject_name, 
    label: subj.subject_name 
  }))

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' })
    }, 3000)
  }

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchMaterials()
    fetchSubjects() // Load subjects for initial department and semester
  }, [])

  // Fetch subjects when department or semester changes
  useEffect(() => {
    if (formData.department && formData.semester) {
      fetchSubjects()
    }
  }, [formData.department, formData.semester])

  const fetchMaterials = async () => {
    setLoading(true)
    // ============================================
    // BACKEND TODO: Fetch all uploaded materials
    // API: GET /api/study-materials
    // Response: { success: true, materials: [...] }
    // ============================================
    const response = await api.getStudyMaterials()
    if (response.success) {
      setUploadedMaterials(response.materials || [])
    }
    setLoading(false)
  }

  const fetchSubjects = async () => {
    setLoadingSubjects(true)
    // ============================================
    // BACKEND TODO: Fetch subjects for selected department and semester
    // API: GET /api/subjects/by-dept-sem?department={department}&semester={semester}
    // Response: { success: true, subjects: [{ subject_name: "..." }] }
    // ============================================
    const response = await api.getSubjectsByDepartmentAndSemester(formData.department, formData.semester)
    if (response.success) {
      setAvailableSubjects(response.subjects || [])
      // Reset subject selection when department/semester changes
      setFormData(prev => ({ ...prev, subject: '' }))
    }
    setLoadingSubjects(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        showToast('Please select a PDF file', 'error')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showToast('File size must be less than 10MB', 'error')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      showToast('Please select a PDF file', 'error')
      return
    }

    setUploading(true)

    // ============================================
    // BACKEND TODO: Upload study material
    // API: POST /api/study-materials/upload
    // FormData: {
    //   department, semester, subject, materialType, 
    //   unit (for notes), year (for question papers), 
    //   description, file (PDF)
    // }
    // Response: { success: true, material: {...} }
    // ============================================
    
    const uploadData = new FormData()
    uploadData.append('department', formData.department)
    uploadData.append('semester', formData.semester)
    uploadData.append('subject', formData.subject)
    uploadData.append('materialType', formData.materialType)
    
    // Add unit for notes or year for question papers
    if (formData.materialType === 'notes') {
      uploadData.append('unit', formData.unit)
    } else {
      uploadData.append('year', formData.year)
    }
    
    uploadData.append('description', formData.description)
    uploadData.append('file', selectedFile)

    const response = await api.uploadStudyMaterial(uploadData)
    
    setUploading(false)

    if (response.success) {
      showToast('Material uploaded successfully!', 'success')
      setFormData({
        department: 'BCA',
        semester: '1',
        subject: '',
        materialType: 'notes',
        unit: '1',
        year: new Date().getFullYear().toString(),
        description: ''
      })
      setSelectedFile(null)
      fetchMaterials()
    } else {
      showToast(response.error || 'Failed to upload material', 'error')
    }
  }

  const handleDelete = async (materialId) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    
    // ============================================
    // BACKEND TODO: Delete study material
    // API: DELETE /api/study-materials/:id
    // Response: { success: true }
    // ============================================
    
    const response = await api.deleteStudyMaterial(materialId)
    if (response.success) {
      showToast('Material deleted successfully!', 'success')
      fetchMaterials()
    } else {
      showToast(response.error || 'Failed to delete material', 'error')
    }
  }

  const handleLogout = () => {
    api.logout()
    navigate('/login')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-24 px-4 py-6 max-w-7xl mx-auto"
    >
      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white font-semibold`}
        >
          {toast.message}
        </motion.div>
      )}

      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all"
          >
            <i className="fas fa-arrow-left text-slate-800 dark:text-white"></i>
          </button>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Upload Study Materials</h1>
        </div>
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

      {/* Upload Form */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Upload New Material</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department */}
            <CustomSelect
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              options={departmentOptions}
              label={<>Department <span className="text-red-500">*</span></>}
              placeholder="Select department"
              icon="fas fa-building"
            />

            {/* Semester */}
            <CustomSelect
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              options={semesterOptions}
              label={<>Semester <span className="text-red-500">*</span></>}
              placeholder="Select semester"
              icon="fas fa-calendar-alt"
            />

            {/* Subject */}
            <CustomSelect
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              options={subjectOptions}
              label={<>Subject <span className="text-red-500">*</span></>}
              placeholder={loadingSubjects ? "Loading subjects..." : "Select subject"}
              icon="fas fa-book"
              disabled={loadingSubjects || availableSubjects.length === 0}
            />

            {/* Material Type */}
            <CustomSelect
              name="materialType"
              value={formData.materialType}
              onChange={handleInputChange}
              options={materialTypeOptions}
              label={<>Material Type <span className="text-red-500">*</span></>}
              placeholder="Select type"
              icon="fas fa-file-alt"
            />

            {/* Unit (for Notes) or Year (for Question Papers) */}
            {formData.materialType === 'notes' ? (
              <CustomSelect
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                options={unitOptions}
                label={<>Unit <span className="text-red-500">*</span></>}
                placeholder="Select unit"
                icon="fas fa-list-ol"
              />
            ) : (
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
                />
              </div>
            )}

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the material"
                rows="3"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
              ></textarea>
            </div>

            {/* File Upload */}
            <div className="md:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                PDF File <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white cursor-pointer hover:border-purple-500 transition-all">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-file-pdf text-2xl text-purple-500"></i>
                    <div>
                      <p className="font-semibold">
                        {selectedFile ? selectedFile.name : 'Click to select PDF file'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Max size: 10MB
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
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
            </div>
          </div>
        </form>
      </div>

      {/* Uploaded Materials List */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Uploaded Materials</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="text-2xl text-slate-800 dark:text-white">Loading...</div>
          </div>
        ) : uploadedMaterials.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-file-pdf text-6xl text-slate-400 mb-4"></i>
            <p className="text-slate-600 dark:text-slate-400">No materials uploaded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Subject</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Department</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Semester</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Unit/Year</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploadedMaterials.map((material, index) => (
                  <tr key={index} className="border-b border-slate-200 dark:border-slate-700 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-all">
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{material.subject}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{material.department}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white">Sem {material.semester}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white">
                      {material.materialType === 'notes' ? 'Notes' : 'Q. Paper'}
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white">
                      {material.materialType === 'notes' ? `Unit ${material.unit}` : material.year}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold"
                        >
                          <i className="fas fa-eye"></i>
                        </a>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}
