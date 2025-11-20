import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Notice from './pages/Notice'
import Payments from './pages/Payments'
import Subjects from './pages/Subjects'
import Result from './pages/Result'
import Analysis from './pages/Analysis'
import StudentMaterials from './pages/StudentMaterials'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminAddTeacher from './pages/admin/AdminAddTeacher'
import AdminNotices from './pages/admin/AdminNotices'
import AdminFeeManagement from './pages/admin/AdminFeeManagement'
import AdminCourses from './pages/admin/AdminCourses'
import TeacherAttendance from './pages/TeacherAttendance'
import TeacherStudentList from './pages/TeacherStudentList'
import TeacherNotice from './pages/TeacherNotice'
import TeacherMarks from './pages/TeacherMarks'
import TeacherUploadMaterials from './pages/TeacherUploadMaterials'
import TeacherViewMaterials from './pages/TeacherViewMaterials'
import AdminUploadMaterials from './pages/admin/AdminUploadMaterials'
import TeacherViewResults from './pages/TeacherViewResults'
import StudentAttendance from './pages/StudentAttendance'
import api from './services/api'

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles = [] }) {
  const isAuthenticated = api.isAuthenticated()
  const user = api.getCurrentUser()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          
          {/* Student Routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><Dashboard /></ProtectedRoute>} />
          <Route path="/notice" element={<ProtectedRoute allowedRoles={['student']}><Notice /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute allowedRoles={['student']}><Payments /></ProtectedRoute>} />
          <Route path="/subjects" element={<ProtectedRoute allowedRoles={['student']}><Subjects /></ProtectedRoute>} />
          <Route path="/result" element={<ProtectedRoute allowedRoles={['student']}><Result /></ProtectedRoute>} />
          <Route path="/analysis" element={<ProtectedRoute allowedRoles={['student']}><Analysis /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute allowedRoles={['student']}><StudentMaterials /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudents /></ProtectedRoute>} />
          <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin']}><AdminTeachers /></ProtectedRoute>} />
          <Route path="/admin/teachers/add" element={<ProtectedRoute allowedRoles={['admin']}><AdminAddTeacher /></ProtectedRoute>} />
          <Route path="/admin/notices" element={<ProtectedRoute allowedRoles={['admin']}><AdminNotices /></ProtectedRoute>} />
          <Route path="/admin/fee-management" element={<ProtectedRoute allowedRoles={['admin']}><AdminFeeManagement /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin']}><AdminCourses /></ProtectedRoute>} />
          <Route path="/admin/upload-materials" element={<ProtectedRoute allowedRoles={['admin']}><AdminUploadMaterials /></ProtectedRoute>} />
          
          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['staff', 'teacher']}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['staff', 'teacher']}><TeacherAttendance /></ProtectedRoute>} />
          <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['staff', 'teacher']}><TeacherStudentList /></ProtectedRoute>} />
          <Route path="/teacher/notices" element={<ProtectedRoute allowedRoles={['staff', 'teacher']}><TeacherNotice /></ProtectedRoute>} />
          <Route path="/teacher/marks" element={<ProtectedRoute allowedRoles={['staff', 'teacher']}><TeacherMarks /></ProtectedRoute>} />
          <Route path="/teacher/results" element={<ProtectedRoute allowedRoles={['staff', 'teacher']}><TeacherViewResults /></ProtectedRoute>} />
          <Route path="/teacher/upload-materials" element={<ProtectedRoute allowedRoles={['staff', 'teacher']}><TeacherUploadMaterials /></ProtectedRoute>} />
          <Route path="/teacher/view-materials" element={<ProtectedRoute allowedRoles={['staff', 'teacher']}><TeacherViewMaterials /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
    </Router>
  )
}

export default App
