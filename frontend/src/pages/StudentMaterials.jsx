import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

export default function StudentMaterials() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [selectedType, setSelectedType] = useState(null) // 'notes' or 'question_papers'
  const [selectedSemester, setSelectedSemester] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedUnitOrYear, setSelectedUnitOrYear] = useState(null) // Unit for notes, Year for question papers
  const [materials, setMaterials] = useState([])
  const [unitsOrYears, setUnitsOrYears] = useState([]) // List of units or years
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/login')
      return
    }
  }, [])

  // Fetch subjects when semester is selected
  useEffect(() => {
    if (selectedSemester) {
      fetchSubjects()
    }
  }, [selectedSemester])

  // Fetch units/years when subject is selected
  useEffect(() => {
    if (selectedSubject) {
      fetchUnitsOrYears()
    }
  }, [selectedSubject])

  const fetchSubjects = async () => {
    try {
      const result = await api.getSubjects(user.student_id, selectedSemester)
      if (result.success) {
        // Map backend subjects to simple string array if that's what the UI expects
        // Or better, use the full object. The UI seems to expect strings in the mock data: ['Subject 1', 'Subject 2']
        // But let's check how it's used.
        // It is used in a dropdown: <option key={subject} value={subject}>{subject}</option>
        // So we should map to names.
        const subjectNames = result.data.subjects?.map(s => s.subject_name) || []
        setSubjects(subjectNames)
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchUnitsOrYears = async () => {
    setLoading(true)
    
    try {
      const result = await api.getMaterials(user.department)
      if (result.success) {
        const allMaterials = result.data.materials || []
        
        // Filter by selected subject and type
        const filtered = allMaterials.filter(m => 
          m.subject === selectedSubject && 
          m.material_type === selectedType
        )
        
        // Extract unique units or years
        if (selectedType === 'notes') {
          const units = [...new Set(filtered.map(m => m.unit))].sort()
          // Format for UI: [{ unit: '1', count: X }]
          const unitData = units.map(u => ({
            unit: u,
            count: filtered.filter(m => m.unit === u).length
          }))
          setMaterials(unitData)
        } else {
          // Question papers - group by year
          // Assuming 'unit' field is used for year in question papers or there is a year field?
          // The DB schema for materials likely has 'unit' and 'description'.
          // Let's assume question papers use 'unit' as year or we just list them.
          // For now, let's just show them.
          setMaterials(filtered)
        }
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch actual files when unit/year is selected
  useEffect(() => {
    if (selectedUnitOrYear) {
      fetchFiles()
    }
  }, [selectedUnitOrYear])

  const fetchFiles = async () => {
    setLoading(true)
    
    try {
      const result = await api.getMaterials(user.department)
      if (result.success) {
        const allMaterials = result.data.materials || []
        
        // Filter by subject, type, and unit/year
        const filtered = allMaterials.filter(m => 
          m.subject === selectedSubject && 
          m.material_type === selectedType &&
          (selectedType === 'notes' ? m.unit === selectedUnitOrYear : m.year === selectedUnitOrYear)
        )
        
        setMaterials(filtered)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (selectedUnitOrYear) {
      setSelectedUnitOrYear(null)
      setMaterials([])
    } else if (selectedSubject) {
      setSelectedSubject(null)
      setUnitsOrYears([])
    } else if (selectedSemester) {
      setSelectedSemester(null)
      setSubjects([])
    } else if (selectedType) {
      setSelectedType(null)
    }
  }

  const handleView = async (material) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8080/api/materials/view.php?id=${material.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        alert('Failed to load file')
        return
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) {
      console.error('View error:', error)
      alert('Failed to load file')
    }
  }

  const handleDownload = async (material) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8080/api/materials/download.php?id=${material.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        alert('Failed to download file')
        return
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = material.file_name || 'download.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file')
    }
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
        {/* Top Header */}
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {(selectedType || selectedSemester || selectedSubject) && (
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all"
              >
                <i className="fas fa-arrow-left text-slate-800 dark:text-white"></i>
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Study Materials</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {user?.department} • Semester {user?.semester}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-slate-700 dark:text-slate-300 font-medium">{user?.full_name}</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-lg">
          <AnimatePresence mode="wait">
            {!selectedType ? (
              /* Step 1: Select Material Type */
              <motion.div
                key="type-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                  Select Material Type
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType('notes')}
                    className="p-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <i className="fas fa-book text-5xl mb-4"></i>
                    <h3 className="text-2xl font-bold mb-2">Notes</h3>
                    <p className="text-purple-100">Study notes and materials</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType('question_papers')}
                    className="p-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <i className="fas fa-file-alt text-5xl mb-4"></i>
                    <h3 className="text-2xl font-bold mb-2">Question Papers</h3>
                    <p className="text-blue-100">Previous year papers</p>
                  </motion.button>
                </div>
              </motion.div>
            ) : !selectedSemester ? (
              /* Step 2: Select Semester */
              <motion.div
                key="semester-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  Select Semester
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {selectedType === 'notes' ? 'Notes' : 'Question Papers'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((sem) => (
                    <motion.button
                      key={sem}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSemester(sem)}
                      className="p-6 bg-white/50 dark:bg-gray-700/50 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 rounded-xl font-bold text-lg shadow-lg transition-all text-slate-800 dark:text-white"
                    >
                      <i className="fas fa-calendar-alt text-3xl mb-2"></i>
                      <p>Semester {sem}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : !selectedSubject ? (
              /* Step 3: Select Subject */
              <motion.div
                key="subject-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  Select Subject
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Semester {selectedSemester} • {selectedType === 'notes' ? 'Notes' : 'Question Papers'}
                </p>
                {subjects.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                    <i className="fas fa-book-open text-6xl mb-4"></i>
                    <p>No subjects found for this semester</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjects.map((subject, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedSubject(subject)}
                        className="p-6 bg-white/50 dark:bg-gray-700/50 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-500 rounded-xl font-semibold text-left shadow-lg transition-all text-slate-800 dark:text-white"
                      >
                        <i className="fas fa-book text-2xl mb-2"></i>
                        <p>{subject}</p>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : !selectedUnitOrYear ? (
              /* Step 4: Select Unit (for Notes) or Year (for Question Papers) */
              <motion.div
                key="unit-year-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  {selectedSubject}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Semester {selectedSemester} • {selectedType === 'notes' ? 'Select Unit' : 'Select Year'}
                </p>
                
                {loading ? (
                  <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                    <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
                    <p>Loading...</p>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                    <i className="fas fa-folder-open text-6xl mb-4"></i>
                    <p>No {selectedType === 'notes' ? 'units' : 'years'} available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {materials.map((item, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedUnitOrYear(selectedType === 'notes' ? item.unit : item.year)}
                        className="p-6 bg-white/50 dark:bg-gray-700/50 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 rounded-xl font-bold text-lg shadow-lg transition-all text-slate-800 dark:text-white"
                      >
                        <i className={`fas ${selectedType === 'notes' ? 'fa-list-ol' : 'fa-calendar'} text-3xl mb-2`}></i>
                        <p>{selectedType === 'notes' ? `Unit ${item.unit}` : item.year}</p>
                        {item.count && (
                          <p className="text-sm opacity-75 mt-1">{item.count} file{item.count > 1 ? 's' : ''}</p>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Step 5: Display PDF Files */
              <motion.div
                key="materials-display"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  {selectedSubject}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Semester {selectedSemester} • {selectedType === 'notes' ? 'Notes' : 'Question Papers'}
                </p>
                
                {loading ? (
                  <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                    <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
                    <p>Loading materials...</p>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                    <i className="fas fa-folder-open text-6xl mb-4"></i>
                    <p>No materials available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materials.map((material) => (
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
                              {material.title}
                            </h4>
                            {material.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {material.description}
                              </p>
                            )}
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              Uploaded: {new Date(material.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(material)}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                          >
                            <i className="fas fa-eye"></i>
                            View
                          </button>
                          <button
                            onClick={() => handleDownload(material)}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                          >
                            <i className="fas fa-download"></i>
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <Navigation />
    </>
  )
}

