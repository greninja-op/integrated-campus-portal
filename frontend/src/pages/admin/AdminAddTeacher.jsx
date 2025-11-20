import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/ThemeToggle'
import CustomSelect from '../../components/CustomSelect'
import api from '../../services/api'

export default function AdminAddTeacher() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [filteredSubjects, setFilteredSubjects] = useState([])
  
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
    assigned_subjects: []
  })

  const departments = ['BCA', 'BBA', 'B.Com']
  const qualifications = ['Ph.D.', 'M.Tech', 'M.Sc.', 'B.Tech', 'MBA', 'M.Com']
  
  const departmentOptions = departments.map(dept => ({ value: dept, label: dept }))
  const qualificationOptions = qualifications.map(qual => ({ value: qual, label: qual }))

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (formData.department) {
      const filtered = subjects.filter(s => s.department === formData.department)
      setFilteredSubjects(filtered)
    }
  }, [formData.department, subjects])

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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Auto-generate username from full name
    if (name === 'full_name') {
      const username = value.toLowerCase().replace(/\s+/g, '.')
      setFormData(prev => ({ ...prev, [name]: value, username }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
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
    
    // Validate at least one subject is assigned
    if (formData.assigned_subjects.length === 0) {
      alert('Please assign at least one subject to the teacher')
      return
    }
    
    setLoading(true)
    
    const submitData = { ...formData }
    const nameParts = submitData.full_name.trim().split(' ')
    submitData.first_name = nameParts[0]
    submitData.last_name = nameParts.slice(1).join(' ') || '.'

    if (!submitData.joining_date) {
      submitData.joining_date = new Date().toISOString().split('T')[0]
    }
    
    if (!submitData.gender) {
      submitData.gender = 'other'
    }
    
    if (!submitData.designation) {
      submitData.designation = 'Teacher'
    }

    const response = await api.addTeacher(submitData)
    
    if (response.success) {
      alert('Teacher added successfully!')
      navigate('/admin/teachers')
    } else {
      alert(response.message || response.error || 'Failed to add teacher')
      setLoading(false)
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
      {/* Top Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/teachers')}
            className="w-10 h-10 rounded-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all"
          >
            <i className="fas fa-arrow-left text-slate-800 dark:text-white"></i>
          </button>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Add New Teacher
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

      {/* Add Teacher Form */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg"
      >
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
              placeholder="e.g., 202501234567"
              required
              pattern="\d{12}"
              title="Teacher ID must be exactly 12 digits"
              maxLength="12"
              minLength="12"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Must be 12 digits</p>
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
              maxLength="32"
              pattern="[A-Za-z\s.]+"
              title="Only letters, spaces, and dots allowed (max 32 characters)"
              style={{ textTransform: 'capitalize' }}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Max 32 characters, letters only</p>
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
              placeholder="Auto-captured"
              required
              readOnly
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none cursor-not-allowed transition-all"
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
              minLength="8"
              title="Password must be at least 8 characters"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum 8 characters</p>
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
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="1234567890"
              required
              pattern="[0-9]{10,15}"
              title="Phone number must be 10-15 digits only"
              maxLength="15"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-green-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">10-15 digits only, no spaces or symbols</p>
          </div>

          {/* Assigned Subjects */}
          <div className="md:col-span-2">
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
              Assign Subjects <span className="text-red-500">*</span> <span className="text-slate-500 text-sm">(Select at least one subject)</span>
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
            <p className={`text-sm mt-2 ${formData.assigned_subjects.length === 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
              Selected: {formData.assigned_subjects.length} subject(s) {formData.assigned_subjects.length === 0 && '(Required: At least 1)'}
            </p>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50"
            >
              <i className="fas fa-save mr-2"></i>
              {loading ? 'Adding...' : 'Add Teacher'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/teachers')}
              className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
            >
              <i className="fas fa-times mr-2"></i>
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
