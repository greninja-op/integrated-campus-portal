import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

import { API_BASE_URL } from '../config';

export default function TeacherViewMaterials() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterSemester, setFilterSemester] = useState('all')

  // ============================================
  // BACKEND TODO: Get teacher's department from profile
  // Teachers can ONLY view materials from their own department
  // ============================================
  const teacherDepartment = user?.department || 'BCA'

  useEffect(() => {
    fetchMaterials()
  }, [filterType, filterSemester])

  const fetchMaterials = async () => {
    setLoading(true)
    
    try {
      const response = await api.getMaterials(teacherDepartment)
      if (response.success && response.data?.materials) {
        let filtered = response.data.materials
        
        if (filterType !== 'all') {
          filtered = filtered.filter(m => m.type === filterType)
        }
        
        if (filterSemester !== 'all') {
          filtered = filtered.filter(m => m.semester === filterSemester)
        }
        
        setMaterials(filtered)
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (material) => {
    // In a real app, this would trigger a file download
    // For now, we'll just alert
    // If the file path is a full URL, we could window.open(material.file_path)
    if (material.file_path) {
      window.open(`${API_BASE_URL.replace('/api', '')}/${material.file_path}`, '_blank')
    } else {
      alert(`Downloading: ${material.fileName || material.file_name}`)
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
      <header className="flex flex-wrap gap-3 justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="btn-glass w-10 h-10 rounded-lg flex items-center justify-center"
          >
            <i className="fas fa-arrow-left glass-text"></i>
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold glass-text">Study Materials</h1>
            <p className="glass-text-muted mt-1">Department: {teacherDepartment} (View Only)</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="glass-text-muted font-medium">{user?.full_name}</span>
        </div>
      </header>

      {/* Filters */}
      <div className="glass-panel p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="glass-input px-4 py-2"
          >
            <option value="all">All Types</option>
            <option value="notes">Notes</option>
            <option value="question_paper">Question Papers</option>
          </select>

          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="glass-input px-4 py-2"
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials List */}
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-display font-bold glass-text mb-6">Available Materials</h2>
        
        {loading ? (
          <div className="text-center py-12 glass-text-muted">
            <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
            <p>Loading materials...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 glass-text-muted">
            <i className="fas fa-folder-open text-6xl mb-4"></i>
            <p>No materials found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {materials.map(material => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-glass">
                      <i className="fas fa-file-pdf text-3xl text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-display font-bold glass-text mb-1">
                        {material.subject} - Semester {material.semester}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                          {material.material_type === 'notes' ? 'Notes' : 'Question Paper'}
                        </span>
                        {material.year && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-sm font-semibold">
                            {material.year}
                          </span>
                        )}
                        {material.exam_type && (
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-semibold">
                            {material.exam_type === 'internal_1' ? 'Internal 1' : material.exam_type === 'internal_2' ? 'Internal 2' : 'Semester Exam'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm glass-text-muted mb-1">
                        <i className="fas fa-file mr-2"></i>
                        {material.file_name}
                      </p>
                      <p className="text-xs glass-text-muted">
                        <i className="fas fa-clock mr-2"></i>
                        Uploaded {material.uploaded_at ? new Date(material.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(material.file_url, '_blank')}
                      className="btn-primary px-4 py-2 flex items-center gap-2"
                    >
                      <i className="fas fa-eye"></i>
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(material)}
                      className="btn-glass px-4 py-2 flex items-center gap-2"
                    >
                      <i className="fas fa-download"></i>
                      Download
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

