import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../../components/ThemeToggle'
import CustomAlert from '../../components/CustomAlert'
import CustomSelect from '../../components/CustomSelect'
import api from '../../services/api'

export default function AdminCourses() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [courses, setCourses] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  
  // Alert state
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  })

  // Form state
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseName: '',
    department: 'BCA',
    credits: '3',
    description: ''
  })

  const departments = [
    { value: 'BCA', label: 'BCA' },
    { value: 'BBA', label: 'BBA' },
    { value: 'B.Com', label: 'B.Com' },
    { value: 'BSc Physics', label: 'BSc Physics' },
    { value: 'BCS', label: 'BCS' }
  ]

  const creditOptions = [
    { value: '1', label: '1 Credit' },
    { value: '2', label: '2 Credits' },
    { value: '3', label: '3 Credits' },
    { value: '4', label: '4 Credits' },
    { value: '5', label: '5 Credits' },
    { value: '6', label: '6 Credits' }
  ]

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await api.authenticatedGet('/admin/subjects/list.php')
      if (response.success) {
        // Map API response to component state structure if needed
        // The API returns { subjects: [...], total: N }
        // The component expects an array of course objects
        const mappedCourses = response.data.subjects.map(subject => ({
          id: subject.id,
          courseCode: subject.subject_code,
          courseName: subject.subject_name,
          department: subject.department,
          credits: subject.credit_hours.toString(),
          description: subject.description || '',
          semester: subject.semester
        }))
        setCourses(mappedCourses)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      showAlert('Error', 'Failed to fetch courses', 'error')
    }
  }

  const loadCourses = () => {
    fetchCourses()
  }

  const showAlert = (title, message, type = 'warning') => {
    setAlertConfig({ isOpen: true, title, message, type })
  }

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCourseForm(prev => ({ ...prev, [name]: value }))
  }

  const handleAddCourse = () => {
    setEditingCourse(null)
    setCourseForm({
      courseCode: '',
      courseName: '',
      department: 'BCA',
      credits: '3',
      description: ''
    })
    setShowAddModal(true)
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course)
    setCourseForm(course)
    setShowAddModal(true)
  }

  const handleSaveCourse = () => {
    // Validation
    if (!courseForm.courseCode || !courseForm.courseName) {
      showAlert('Missing Information', 'Please fill in Course Code and Course Name.', 'warning')
      return
    }

    // Check for duplicate course code
    const duplicateCode = courses.find(c => 
      c.courseCode.toLowerCase() === courseForm.courseCode.toLowerCase() && 
      (!editingCourse || c.courseCode !== editingCourse.courseCode)
    )

    if (duplicateCode) {
      showAlert(
        'Duplicate Course Code',
        `A course with code "${courseForm.courseCode}" already exists in the system.\n\nExisting Course: ${duplicateCode.courseName}\n\nPlease use a different course code.`,
        'error'
      )
      return
    }

    // Check for duplicate course name
    const duplicateName = courses.find(c => 
      c.courseName.toLowerCase() === courseForm.courseName.toLowerCase() && 
      (!editingCourse || c.courseName !== editingCourse.courseName)
    )

    if (duplicateName) {
      showAlert(
        'Duplicate Course Name',
        `A course with the name "${courseForm.courseName}" already exists in the system.\n\nExisting Code: ${duplicateName.courseCode}\n\nPlease use a different course name.`,
        'error'
      )
      return
    }

    let updatedCourses
    if (editingCourse) {
      // Update existing course
      updatedCourses = courses.map(c => 
        c.courseCode === editingCourse.courseCode ? { ...courseForm, id: c.id } : c
      )
      showAlert(
        'Course Updated',
        `${courseForm.courseCode} - ${courseForm.courseName} has been updated successfully!`,
        'success'
      )
    } else {
      // Add new course
      const newCourse = {
        ...courseForm,
        id: Date.now()
      }
      updatedCourses = [...courses, newCourse]
      showAlert(
        'Course Added',
        `${courseForm.courseCode} - ${courseForm.courseName} has been added to the course catalog!`,
        'success'
      )
    }

    localStorage.setItem('courses', JSON.stringify(updatedCourses))
    setCourses(updatedCourses)
    setShowAddModal(false)
  }

  const handleDeleteCourse = (course) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this course?\n\n${course.courseCode} - ${course.courseName}\n\nThis action cannot be undone.`
    )

    if (confirmed) {
      const updatedCourses = courses.filter(c => c.id !== course.id)
      localStorage.setItem('courses', JSON.stringify(updatedCourses))
      setCourses(updatedCourses)
      showAlert(
        'Course Deleted',
        `${course.courseCode} - ${course.courseName} has been removed from the catalog.`,
        'success'
      )
    }
  }

  const handleLogout = () => {
    api.logout()
    navigate('/login')
  }

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = filterDepartment === 'all' || course.department === filterDepartment
    return matchesSearch && matchesDepartment
  })

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
            onClick={() => navigate('/admin/dashboard')}
            className="btn-glass w-10 h-10 rounded-lg flex items-center justify-center"
          >
            <i className="fas fa-arrow-left glass-text"></i>
          </button>
          <h1 className="text-3xl font-display font-bold glass-text">Course Management</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="glass-text-muted font-medium">{user?.full_name}</span>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            <i className="fas fa-user-shield text-xl"></i>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg font-semibold transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Stats Banner */}
      <div className="glass-panel p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <i className="fas fa-book text-3xl text-primary"></i>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold glass-text">Course Catalog</h2>
              <p className="glass-text-muted">Manage all courses and curriculum</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-5xl font-display font-bold glass-text">{courses.length}</p>
            <p className="glass-text-muted">Total Courses</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Search courses by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-12 pr-4 py-3"
            />
          </div>
        </div>
        
        <CustomSelect
          name="filterDepartment"
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          options={[{ value: 'all', label: 'All Departments' }, ...departments]}
          placeholder="Filter by Department"
        />

        <button
          onClick={handleAddCourse}
          className="btn-primary px-6 py-3 whitespace-nowrap"
        >
          <i className="fas fa-plus mr-2"></i>
          Add New Course
        </button>
      </div>

      {/* Courses Table */}
      <div className="glass-panel overflow-hidden">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <i className="fas fa-book-open text-6xl text-slate-400 mb-4"></i>
            <p className="glass-text-muted text-lg">
              {searchTerm || filterDepartment !== 'all' 
                ? 'No courses found matching your filters.' 
                : 'No courses in the catalog yet. Click "Add New Course" to get started!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary/10">
                <tr>
                  <th className="px-6 py-4 text-left glass-text-muted font-bold">Course Code</th>
                  <th className="px-6 py-4 text-left glass-text-muted font-bold">Course Name</th>
                  <th className="px-6 py-4 text-left glass-text-muted font-bold">Department</th>
                  <th className="px-6 py-4 text-left glass-text-muted font-bold">Credits</th>
                  <th className="px-6 py-4 text-center glass-text-muted font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course, index) => (
                  <motion.tr
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-primary/5 transition-all"
                  >
                    <td className="px-6 py-4 glass-text font-mono font-bold">{course.courseCode}</td>
                    <td className="px-6 py-4 glass-text font-semibold">{course.courseName}</td>
                    <td className="px-6 py-4 glass-text">{course.department}</td>
                    <td className="px-6 py-4 glass-text">{course.credits}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="btn-primary px-3 py-2"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="px-3 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg font-semibold transition-all"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Course Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div 
            className="fixed inset-0 glass-backdrop flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-modal max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              {/* Modal Header */}
              <div className="bg-primary/10 p-6 sticky top-0 z-10 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                      <i className="fas fa-book text-2xl text-primary"></i>
                    </div>
                    <h2 className="text-2xl font-display font-bold glass-text">
                      {editingCourse ? 'Edit Course' : 'Add New Course'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn-glass w-10 h-10 rounded-full flex items-center justify-center"
                  >
                    <i className="fas fa-times text-xl glass-text"></i>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Course Code and Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block glass-text-muted font-semibold mb-2">
                      Course Code <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="courseCode"
                      value={courseForm.courseCode}
                      onChange={handleInputChange}
                      placeholder="e.g., CS101"
                      className="glass-input w-full px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="block glass-text-muted font-semibold mb-2">
                      Course Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="courseName"
                      value={courseForm.courseName}
                      onChange={handleInputChange}
                      placeholder="e.g., Introduction to Computer Science"
                      className="glass-input w-full px-4 py-3"
                    />
                  </div>
                </div>

                {/* Department and Credits */}
                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect
                    name="department"
                    value={courseForm.department}
                    onChange={handleInputChange}
                    options={departments}
                    label={<>Department <span className="text-danger">*</span></>}
                    placeholder="Select Department"
                  />

                  <CustomSelect
                    name="credits"
                    value={courseForm.credits}
                    onChange={handleInputChange}
                    options={creditOptions}
                    label={<>Credits <span className="text-danger">*</span></>}
                    placeholder="Select Credits"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block glass-text-muted font-semibold mb-2">
                    Course Description
                  </label>
                  <textarea
                    name="description"
                    value={courseForm.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Brief description of the course content and objectives..."
                    className="glass-input w-full px-4 py-3 resize-none"
                  ></textarea>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="btn-glass flex-1 py-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCourse}
                    className="btn-primary flex-1 py-3"
                  >
                    <i className="fas fa-save mr-2"></i>
                    {editingCourse ? 'Update Course' : 'Save Course'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </motion.div>
  )
}

