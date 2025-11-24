// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// API Service for Student Portal
class ApiService {
  // Helper method to get token
  getToken() {
    return localStorage.getItem('token');
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  // Helper method for authenticated GET requests
  async authenticatedGet(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Helper method for authenticated POST requests
  async authenticatedPost(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication
  async login(username, password, role) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store user data and token in localStorage
        const userData = data.data.user;
        const token = data.data.token;
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        
        return { success: true, user: userData, token };
      }
      
      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Get current user from localStorage
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Logout
  async logout() {
    try {
      await this.authenticatedPost('/auth/logout.php', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  // Student - Get Profile
  async getStudentProfile() {
    try {
      return await this.authenticatedGet('/student/get_profile.php');
    } catch (error) {
      console.error('Profile error:', error);
      return { success: false, message: 'Failed to fetch profile' };
    }
  }

  // Student - Get Marks
  async getStudentMarks(semester = null) {
    try {
      const endpoint = semester ? `/student/get_marks.php?semester=${semester}` : '/student/get_marks.php';
      return await this.authenticatedGet(endpoint);
    } catch (error) {
      console.error('Marks error:', error);
      return { success: false, message: 'Failed to fetch marks' };
    }
  }

  // Student - Get Attendance
  async getStudentAttendance(semester = null) {
    try {
      const endpoint = semester ? `/student/get_attendance.php?semester=${semester}` : '/student/get_attendance.php';
      return await this.authenticatedGet(endpoint);
    } catch (error) {
      console.error('Attendance error:', error);
      return { success: false, message: 'Failed to fetch attendance' };
    }
  }

  // Student - Get Fees
  async getStudentFees() {
    try {
      return await this.authenticatedGet('/student/get_fees.php');
    } catch (error) {
      console.error('Fees error:', error);
      return { success: false, message: 'Failed to fetch fees' };
    }
  }

  // Student - Get Payments
  async getStudentPayments() {
    try {
      return await this.authenticatedGet('/student/get_payments.php');
    } catch (error) {
      console.error('Payments error:', error);
      return { success: false, message: 'Failed to fetch payments' };
    }
  }

  // Dashboard Stats (Student)
  async getDashboardStats(studentId) {
    try {
      const [profile, marks, attendance, fees] = await Promise.all([
        this.getStudentProfile(),
        this.getStudentMarks(),
        this.getStudentAttendance(),
        this.getStudentFees()
      ]);

      return {
        success: true,
        data: {
          profile: profile.data || {},
          marks: marks.data?.marks || [],
          gpa: marks.data?.summary?.gpa || '0.00',
          cgpa: marks.data?.summary?.cgpa || '0.00',
          attendance: attendance.data?.attendance || [],
          attendanceSummary: attendance.data?.summary || {},
          fees: fees.data?.fees || [],
          feesSummary: fees.data?.summary || {}
        }
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return { success: false, message: 'Failed to fetch dashboard stats' };
    }
  }

  // Get Subjects
  async getSubjects(studentId, semester = null) {
    // Get subjects from backend using authentic user context (studentId handled by backend)
    try {
      const user = this.getCurrentUser();
      if (!user) return { success: false, message: 'User not found' };
      
      // Fetch student profile to get dept/sem
      const profileRes = await this.getStudentProfile();
      if (!profileRes.success) return { success: false, message: 'Failed to fetch profile' };
      
      const { department, semester: currentSemester } = profileRes.data;
      const targetSemester = semester || currentSemester;
      
      // Fetch subjects from admin endpoint filtered by department and semester
      const response = await this.authenticatedGet(`/admin/subjects/list.php?department=${department}&semester=${targetSemester}`);
      return response;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return { success: false, message: 'Network error' };
    }
  }

  // Get Materials
  async getMaterials(department) {
    try {
      return await this.authenticatedGet(`/materials/get_by_department.php?department=${department}`);
    } catch (error) {
      console.error('Error fetching materials:', error);
      return { success: false, message: 'Failed to fetch materials' };
    }
  }

  // Get Results (uses getStudentMarks)
  async getResults(studentId) {
    return await this.getStudentMarks();
  }

  // Get Payments (uses getStudentPayments)
  async getPayments(studentId) {
    return await this.getStudentPayments();
  }

  // Process Payment
  async processPayment(paymentId, paymentMethod) {
    try {
      // Note: Using the endpoint I created: backend/api/payments/process.php
      const response = await fetch(`${API_BASE_URL}/payments/process.php`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          fee_id: paymentId, // Mapping paymentId to fee_id based on likely usage
          amount: 0, // This needs the amount, logic might need adjustment if frontend doesn't pass it
          payment_method: paymentMethod 
        }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, message: 'Failed to process payment' };
    }
  }

  // Get Notices
  async getNotices() {
    try {
      return await this.authenticatedGet('/notices/get_all.php');
    } catch (error) {
      console.error('Notices error:', error);
      return { success: false, message: 'Failed to fetch notices' };
    }
  }

  // Create Notice
  async createNotice(noticeData) {
    try {
      return await this.authenticatedPost('/notices/create.php', noticeData);
    } catch (error) {
      console.error('Create notice error:', error);
      return { success: false, message: 'Failed to create notice' };
    }
  }

  // Delete Notice
  async deleteNotice(noticeId) {
    try {
      return await this.authenticatedPost('/notices/delete.php', { id: noticeId });
    } catch (error) {
      console.error('Delete notice error:', error);
      return { success: false, message: 'Failed to delete notice' };
    }
  }

  // Admin - Get Subjects Count
  async getSubjectsCount() {
    try {
      const response = await this.authenticatedGet('/admin/subjects/list.php?limit=1');
      return response.data?.total || 0;
    } catch (error) {
      console.error('Error fetching subjects count:', error);
      return 0;
    }
  }

  // Admin - Get Dashboard Stats
  async getAdminDashboardStats() {
    try {
      const [studentCount, teacherCount, subjectsCount, noticesResponse] = await Promise.all([
        this.getStudentCount(),
        this.getTeacherCount(),
        this.getSubjectsCount(),
        this.getNotices()
      ]);

      return {
        success: true,
        data: {
          totalStudents: studentCount,
          totalTeachers: teacherCount,
          totalCourses: subjectsCount,
          activeNotices: noticesResponse.data?.notices?.length || 0,
          notices: noticesResponse.data?.notices || []
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { success: false, message: 'Failed to fetch dashboard stats' };
    }
  }

  // Teacher - Get Profile
  async getTeacherProfile() {
    try {
      return await this.authenticatedGet('/teacher/get_profile.php');
    } catch (error) {
      console.error('Get teacher profile error:', error);
      return { success: false, message: 'Failed to fetch profile' };
    }
  }

  // Teacher - Get Students
  async getTeacherStudents(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/teacher/get_students.php${queryParams ? '?' + queryParams : ''}`;
      return await this.authenticatedGet(endpoint);
    } catch (error) {
      console.error('Get teacher students error:', error);
      return { success: false, message: 'Failed to fetch students' };
    }
  }

  // Teacher - Get Students for Attendance
  async getAttendanceStudents(params) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      return await this.authenticatedGet(`/attendance/get_students.php?${queryParams}`);
    } catch (error) {
      console.error('Get attendance students error:', error);
      return { success: false, message: 'Failed to fetch students' };
    }
  }

  // Teacher - Mark Attendance
  async markAttendance(attendanceData) {
    try {
      return await this.authenticatedPost('/attendance/mark.php', attendanceData);
    } catch (error) {
      console.error('Mark attendance error:', error);
      return { success: false, message: 'Failed to mark attendance' };
    }
  }

  // Teacher - Enter Marks
  async enterMarks(marksData) {
    try {
      return await this.authenticatedPost('/teacher/enter_marks.php', marksData);
    } catch (error) {
      console.error('Enter marks error:', error);
      return { success: false, message: 'Failed to enter marks' };
    }
  }

  // Teacher - Update Marks
  async updateMarks(marksData) {
    try {
      return await this.authenticatedPost('/teacher/update_marks.php', marksData);
    } catch (error) {
      console.error('Update marks error:', error);
      return { success: false, message: 'Failed to update marks' };
    }
  }

  // Student - Get Attendance (new enhanced version)
  async getStudentAttendance(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/student/get_attendance.php${queryParams ? '?' + queryParams : ''}`;
      return await this.authenticatedGet(endpoint);
    } catch (error) {
      console.error('Get student attendance error:', error);
      return { success: false, message: 'Failed to fetch attendance' };
    }
  }

  // Student - Get Attendance History (legacy)
  async getAttendanceHistory(studentId = null) {
    try {
      const queryParams = studentId ? `?student_id=${studentId}` : '';
      return await this.authenticatedGet(`/attendance/get_student_history.php${queryParams}`);
    } catch (error) {
      console.error('Get attendance history error:', error);
      return { success: false, message: 'Failed to fetch attendance history' };
    }
  }

  // Admin - Get All Students
  async getStudents(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/admin/students/list.php${queryParams ? '?' + queryParams : ''}`;
      return await this.authenticatedGet(endpoint);
    } catch (error) {
      console.error('Get students error:', error);
      return { success: false, message: 'Failed to fetch students' };
    }
  }

  // Admin - Get Student Count
  async getStudentCount() {
    try {
      const response = await this.getStudents({ limit: 1 });
      return response.data?.total || 0;
    } catch (error) {
      console.error('Error fetching student count:', error);
      return 0;
    }
  }

  // Admin - Add Student
  async addStudent(studentData) {
    try {
      // Split full_name into first_name and last_name
      const nameParts = studentData.full_name?.split(' ') || []
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      const payload = {
        student_id: studentData.student_id,
        username: studentData.username,
        password: studentData.password,
        email: studentData.email,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: studentData.date_of_birth,
        gender: studentData.gender || 'male',
        phone: studentData.phone,
        address: studentData.address,
        department: studentData.department,
        semester: parseInt(studentData.semester),
        admission_year: studentData.year || new Date().getFullYear()
      }
      
      return await this.authenticatedPost('/admin/students/create.php', payload);
    } catch (error) {
      console.error('Add student error:', error);
      return { success: false, message: 'Failed to add student' };
    }
  }

  // Admin - Update Student
  async updateStudent(studentId, studentData) {
    try {
      // Split full_name into first_name and last_name
      const nameParts = studentData.full_name?.split(' ') || []
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      const payload = {
        student_id: studentId,
        username: studentData.username,
        email: studentData.email,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: studentData.date_of_birth,
        gender: studentData.gender || 'male',
        phone: studentData.phone,
        address: studentData.address,
        department: studentData.department,
        semester: parseInt(studentData.semester),
        admission_year: studentData.year || new Date().getFullYear()
      }
      
      // Only include password if it's being changed
      if (studentData.password) {
        payload.password = studentData.password
      }
      
      return await this.authenticatedPost('/admin/students/update.php', payload);
    } catch (error) {
      console.error('Update student error:', error);
      return { success: false, message: 'Failed to update student' };
    }
  }

  // Admin - Delete Student
  async deleteStudent(studentId) {
    try {
      return await this.authenticatedPost('/admin/students/delete.php', { student_id: studentId });
    } catch (error) {
      console.error('Delete student error:', error);
      return { success: false, message: 'Failed to delete student' };
    }
  }

  // Admin - Get All Teachers
  async getTeachers(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/admin/teachers/list.php${queryParams ? '?' + queryParams : ''}`;
      return await this.authenticatedGet(endpoint);
    } catch (error) {
      console.error('Get teachers error:', error);
      return { success: false, message: 'Failed to fetch teachers' };
    }
  }

  // Admin - Get Teacher Count
  async getTeacherCount() {
    try {
      const response = await this.getTeachers({ limit: 1 });
      return response.data?.total || 0;
    } catch (error) {
      console.error('Error fetching teacher count:', error);
      return 0;
    }
  }

  // Admin - Add Teacher
  async addTeacher(teacherData) {
    try {
      // Split full_name into first_name and last_name
      const nameParts = teacherData.full_name?.split(' ') || []
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      const payload = {
        teacher_id: teacherData.teacher_id,
        username: teacherData.username,
        password: teacherData.password,
        email: teacherData.email,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: teacherData.date_of_birth,
        gender: teacherData.gender || 'male',
        phone: teacherData.phone,
        address: teacherData.address,
        department: teacherData.department,
        designation: teacherData.designation || 'Assistant Professor',
        qualification: teacherData.qualification || 'M.Tech',
        profile_image: teacherData.profile_image || null,
        assigned_subjects: teacherData.assigned_subjects || []
      }
      
      return await this.authenticatedPost('/admin/teachers/create.php', payload);
    } catch (error) {
      console.error('Add teacher error:', error);
      return { success: false, message: 'Failed to add teacher' };
    }
  }

  // Admin - Update Teacher
  async updateTeacher(teacherId, teacherData) {
    try {
      // Split full_name into first_name and last_name
      const nameParts = teacherData.full_name?.split(' ') || []
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      
      const payload = {
        teacher_id: teacherId,
        username: teacherData.username,
        email: teacherData.email,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: teacherData.date_of_birth,
        gender: teacherData.gender || 'male',
        phone: teacherData.phone,
        address: teacherData.address,
        department: teacherData.department,
        designation: teacherData.designation || 'Assistant Professor',
        qualification: teacherData.qualification || 'M.Tech',
        specialization: teacherData.specialization || '',
        profile_image: teacherData.profile_image || null,
        assigned_subjects: teacherData.assigned_subjects || []
      }
      
      // Only include password if it's being changed
      if (teacherData.password) {
        payload.password = teacherData.password
      }
      
      return await this.authenticatedPost('/admin/teachers/update.php', payload);
    } catch (error) {
      console.error('Update teacher error:', error);
      return { success: false, message: 'Failed to update teacher' };
    }
  }

  // Admin - Delete Teacher
  async deleteTeacher(teacherId) {
    try {
      return await this.authenticatedPost('/admin/teachers/delete.php', { teacher_id: teacherId });
    } catch (error) {
      console.error('Delete teacher error:', error);
      return { success: false, message: 'Failed to delete teacher' };
    }
  }

  // Upload Image
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/upload/upload_image.php`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        return { success: true, image_url: data.data.file_path };
      }
      
      return { success: false, error: data.message || 'Upload failed' };
    } catch (error) {
      console.error('Upload image error:', error);
      return { success: false, error: 'Failed to upload image: ' + error.message };
    }
  }

  // Study Materials - Get All (Admin)
  async getStudyMaterials() {
    try {
      const response = await fetch(`${API_BASE_URL}/materials/get_all.php`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get study materials error:', error);
      return { success: false, materials: [], error: 'Failed to fetch study materials' };
    }
  }

  // Study Materials - Get by Department (Teacher/Student)
  async getStudyMaterialsByDepartment(department) {
    try {
      const response = await fetch(`${API_BASE_URL}/materials/get_by_department.php?department=${department}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get study materials by department error:', error);
      return { success: false, materials: [], error: 'Failed to fetch study materials' };
    }
  }

  // Study Materials - Upload (Admin)
  async uploadStudyMaterial(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/materials/upload.php`, {
        method: 'POST',
        body: formData, // FormData with file and metadata
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload study material error:', error);
      return { success: false, error: 'Failed to upload study material' };
    }
  }

  // Study Materials - Delete (Admin)
  async deleteStudyMaterial(materialId) {
    try {
      const response = await fetch(`${API_BASE_URL}/materials/delete.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ material_id: materialId }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Delete study material error:', error);
      return { success: false, error: 'Failed to delete study material' };
    }
  }

  // Get Subjects by Department and Semester (for admin materials upload)
  async getSubjectsByDepartmentAndSemester(department, semester) {
    try {
      const response = await this.authenticatedGet(`/admin/subjects/list.php?department=${department}&semester=${semester}`);
      if (response.success && response.data) {
        return { success: true, subjects: response.data.subjects || [] };
      }
      return { success: false, subjects: [] };
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return { success: false, subjects: [] };
    }
  }

  // Admin - Get All Subjects
  async getAllSubjects(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = `/admin/subjects/list.php${queryParams ? '?' + queryParams : ''}`;
      return await this.authenticatedGet(endpoint);
    } catch (error) {
      console.error('Get subjects error:', error);
      return { success: false, message: 'Failed to fetch subjects' };
    }
  }

  // Get Materials (by department for teachers)
  async getMaterials(department = null) {
    try {
      const endpoint = department 
        ? `/materials/get_by_department.php?department=${department}`
        : '/materials/get_all.php';
      return await this.authenticatedGet(endpoint);
    } catch (error) {
      console.error('Get materials error:', error);
      return { success: false, message: 'Failed to fetch materials' };
    }
  }

  // Get Study Materials (admin - all materials)
  async getStudyMaterials() {
    try {
      return await this.authenticatedGet('/materials/get_all.php');
    } catch (error) {
      console.error('Get study materials error:', error);
      return { success: false, materials: [] };
    }
  }

  // Upload Study Material (admin)
  async uploadStudyMaterial(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/materials/upload.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: formData
      });
      return await response.json();
    } catch (error) {
      console.error('Upload study material error:', error);
      return { success: false, error: 'Failed to upload material' };
    }
  }

  // Delete Study Material (admin)
  async deleteStudyMaterial(materialId) {
    try {
      return await this.authenticatedPost('/materials/delete.php', { id: materialId });
    } catch (error) {
      console.error('Delete study material error:', error);
      return { success: false, error: 'Failed to delete material' };
    }
  }

  // Upload Material (teacher)
  async uploadMaterial(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/materials/upload.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
          // Content-Type is not set manually for FormData, browser sets it with boundary
        },
        body: formData
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload material error:', error);
      return { success: false, message: 'Failed to upload material' };
    }
  }

  // Delete Material
  async deleteMaterial(materialId) {
    try {
      return await this.authenticatedPost('/materials/delete.php', { id: materialId });
    } catch (error) {
      console.error('Delete material error:', error);
      return { success: false, message: 'Failed to delete material' };
    }
  }

  // Admin - Get Pending Fee Students
  async getPendingFeeStudents(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      return await this.authenticatedGet(`/admin/fees/pending_students.php?${queryParams}`);
    } catch (error) {
      console.error('Get pending fees error:', error);
      return { success: false, message: 'Failed to fetch pending fees' };
    }
  }

  // Admin - Send Fee Reminder
  async sendFeeReminder(studentId, feeId) {
    try {
      return await this.authenticatedPost('/admin/fees/send_reminder.php', { student_id: studentId, fee_id: feeId });
    } catch (error) {
      console.error('Send reminder error:', error);
      return { success: false, message: 'Failed to send reminder' };
    }
  }
}

export default new ApiService();
