import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ThemeToggle from '../../components/ThemeToggle'
import CustomSelect from '../../components/CustomSelect'
import api from '../../services/api'

export default function AdminTeachers() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = api.getCurrentUser()
  
  // Get filter parameters from URL
  const urlDepartment = searchParams.get('department')
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [filteredTeachers, setFilteredTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState(null)
  const [searchQuery, setSearchQuery] = useState('') // Search filter
  const [filterDepartment, setFilterDepartment] = useState('all') // Department filter
  
  // Form data
  const [formData, setFormData] = useState({
    teacher_id: '',
    full_name: '',
    username: '',
    email: '',
    password: '',
    department: 'BCA',
    specialization: '',
    phone: '',
    qualification: 'Ph.D.',
    assigned_subjects: [] // Array of subject IDs
  })
  
  const [subjects, setSubjects] = useState([])
  const [filteredSubjects, setFilteredSubjects] = useState([])

  const departments = ['BCA', 'BBA', 'B.Com']
  const qualifications = ['Ph.D.', 'M.Tech', 'M.Sc.', 'B.Tech']
  
  // Convert to options format for CustomSelect
  const departmentOptions = departments.map(dept => ({ value: dept, label: dept }))
  const qualificationOptions = qualifications.map(qual => ({ value: qual, label: qual }))

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchTeachers()
    fetchSubjects()
  }, [])
  
  // Filter subjects when department changes
  useEffect(() => {
    if (formData.department) {
      const filtered = subjects.filter(s => s.department === formData.department)
      setFilteredSubjects(filtered)
    }
  }, [formData.department, subjects])

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const response = await api.getTeachers()
      if (response.success && response.data) {
        // Map backend data to frontend format
        const teachersData = response.data.teachers || []
        const mappedTeachers = teachersData.map(t => ({
          id: t.id,
          teacher_id: t.teacher_id,
          full_name: `${t.first_name} ${t.last_name}`,
          first_name: t.first_name,
          last_name: t.last_name,
          username: t.username,
          email: t.email,
          department: t.department,
          specialization: t.specialization || '',
          phone: t.phone,
          qualification: t.qualification || 'M.Tech',
          designation: t.designation || 'Assistant Professor',
          profile_image: t.profile_image
        }))
        setTeachers(mappedTeachers)
        filterTeachers(mappedTeachers)
      }
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const fetchSubjects = async () => {
    try {
      const response = await api.getAllSubjects()
      if (response.success && response.data) {
        setSubjects(response.data.subjects || [])
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }
  
  const filterTeachers = (teacherList) => {
    let filtered = teacherList
    
    if (urlDepartment) {
      filtered = filtered.filter(t => t.department === urlDepartment)
    }
    
    // Apply manual department filter (for manage mode)
    if (!urlDepartment && filterDepartment !== 'all') {
      filtered = filtered.filter(t => t.department === filterDepartment)
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.teacher_id?.toLowerCase().includes(query) ||
        t.full_name?.toLowerCase().includes(query) ||
        t.department?.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query) ||
        t.specialization?.toLowerCase().includes(query)
      )
    }
    
    setFilteredTeachers(filtered)
  }
  
  useEffect(() => {
    filterTeachers(teachers)
  }, [urlDepartment, teachers, searchQuery, filterDepartment])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      assigned_subjects: prev.assigned_subjects.includes(subjectId)
        ? prev.assigned_subjects.filter(id => id !== subjectId)
        : [...prev.assigned_subjects, subjectId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Prepare data for submission
    const submitData = { ...formData }
    
    // Split full_name into first_name and last_name
    if (submitData.full_name) {
      const nameParts = submitData.full_name.trim().split(' ')
      submitData.first_name = nameParts[0]
      submitData.last_name = nameParts.slice(1).join(' ') || '.' // Ensure last_name is not empty if required
    }

    // Ensure joining_date is set (default to today if missing)
    if (!submitData.joining_date) {
      submitData.joining_date = new Date().toISOString().split('T')[0]
    }
    
    // Ensure gender is set (default to other if missing)
    if (!submitData.gender) {
      submitData.gender = 'other'
    }
    
    // Ensure designation is set
    if (!submitData.designation) {
      submitData.designation = 'Teacher'
    }

    const response = isEditMode 
      ? await api.updateTeacher(editingTeacher.teacher_id, submitData)
      : await api.addTeacher(submitData)
    
    if (response.success) {
      alert(isEditMode ? 'Teacher updated successfully!' : 'Teacher added successfully!')
      setShowAddForm(false)
      setIsEditMode(false)
      setEditingTeacher(null)
      setFormData({
        teacher_id: '',
        full_name: '',
        username: '',
        email: '',
        password: '',
        department: 'BCA',
        specialization: '',
        phone: '',
        qualification: 'Ph.D.',
        assigned_subjects: []
      })
      fetchTeachers()
    } else {
      // Prioritize message over error code
      alert(response.message || response.error || (isEditMode ? 'Failed to update teacher' : 'Failed to add teacher'))
      setLoading(false)
    }
  }

  const handleEdit = (teacher) => {
    setIsEditMode(true)
    setEditingTeacher(teacher)
    setFormData({
      teacher_id: teacher.teacher_id,
      full_name: teacher.full_name,
      username: teacher.username || '',
      email: teacher.email || '',
      password: '',
      department: teacher.department,
      specialization: teacher.specialization || '',
      phone: teacher.phone || '',
      qualification: teacher.qualification || 'Ph.D.'
    })
    setShowAddForm(true)
  }

  const handleDelete = (teacherId) => {
    setTeacherToDelete(teacherId)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setLoading(true)
    setShowDeleteModal(false)
    
    const response = await api.deleteTeacher(teacherToDelete)
    
    if (response.success) {
      alert('Teacher deleted successfully!')
      fetchTeachers()
    } else {
      alert(response.error || 'Failed to delete teacher')
    }
    setLoading(false)
    setTeacherToDelete(null)
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setTeacherToDelete(null)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditingTeacher(null)
    setShowAddForm(false)
    setFormData({
      teacher_id: '',
      full_name: '',
      username: '',
      email: '',
      password: '',
      department: 'BCA',
      specialization: '',
      phone: '',
      qualification: 'Ph.D.',
      assigned_subjects: []
    })
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
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-10 h-10 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all"
          >
            <i className="fas fa-arrow-left text-slate-800 dark:text-white"></i>
          </button>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            {urlDepartment ? 'View Teachers' : 'Manage Teachers'}
          </h1>
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

      {/* Add Teacher Button - Only show when not in filtered view mode */}
      {!urlDepartment && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/teachers/add')}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold shadow-lg flex items-center gap-2 transition-all"
          >
            <i className="fas fa-plus"></i>
            Add New Teacher
          </button>
        </div>
      )}

      {/* Teachers List */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            All Teachers
          </h2>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
            />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Found {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="text-2xl text-slate-800 dark:text-white">Loading...</div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-chalkboard-teacher text-6xl text-slate-400 mb-4"></i>
            <p className="text-slate-600 dark:text-slate-400">
              No teachers found. Add your first teacher!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Teacher ID</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Department</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Qualification</th>
                  <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher, index) => (
                  <tr key={index} className="border-b border-slate-200 dark:border-slate-700 hover:bg-green-500/10 dark:hover:bg-green-500/20 transition-all">
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{teacher.teacher_id}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{teacher.full_name}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{teacher.department}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-white">{teacher.qualification}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => {
                          handleEdit(teacher)
                          navigate('/admin/teachers/add')
                        }}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mr-2 transition-all"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(teacher.teacher_id)}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg mb-6"
        >
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
            {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Teacher ID */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Teacher ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleInputChange}
                placeholder="e.g., T2025001"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Dr. John Smith"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="e.g., john.smith"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="teacher@university.edu"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
              />
            </div>

            {/* Qualification */}
            <CustomSelect
              name="qualification"
              value={formData.qualification}
              onChange={handleInputChange}
              options={qualificationOptions}
              label={<>Qualification <span className="text-red-500">*</span></>}
              placeholder="Select qualification"
              icon="fas fa-graduation-cap"
            />

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

            {/* Specialization */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Specialization
              </label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                placeholder="e.g., Machine Learning, Data Structures"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
              />
            </div>

            {/* Phone */}
            <div className="md:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 234 567 8900"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
              />
            </div>

            {/* Assigned Subjects */}
            <div className="md:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
                Assign Subjects <span className="text-slate-500 text-sm">(Select subjects this teacher will teach)</span>
              </label>
              <div className="bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-300 dark:border-gray-600 p-4 max-h-64 overflow-y-auto">
                {filteredSubjects.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                    No subjects available for {formData.department} department. Please add subjects first.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredSubjects.map(subject => (
                      <label
                        key={subject.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 dark:hover:bg-gray-600/50 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={formData.assigned_subjects.includes(subject.id)}
                          onChange={() => handleSubjectToggle(subject.id)}
                          className="mt-1 w-4 h-4 text-green-500 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 dark:text-white">
                            {subject.subject_name}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {subject.subject_code} • Semester {subject.semester}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Selected: {formData.assigned_subjects.length} subject(s)
              </p>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
              >
                <i className="fas fa-save mr-2"></i>
                {isEditMode ? 'Update Teacher' : 'Add Teacher'}
              </button>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </motion.div>
      )}



      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-red-200 dark:border-red-900"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-red-600 dark:text-red-400"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                Delete Teacher
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Are you sure you want to delete this teacher? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  <i className="fas fa-trash mr-2"></i>
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
