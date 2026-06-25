import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Navigation from '../components/Navigation'
import ThemeToggle from '../components/ThemeToggle'
import CustomAlert from '../components/CustomAlert'
import CustomSelect from '../components/CustomSelect'
import api from '../services/api'

export default function StudentAttendance() {
  const navigate = useNavigate()
  const user = api.getCurrentUser()
  
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('daily') // 'daily' or 'summary'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState(null)
  const [currentSemester, setCurrentSemester] = useState(1)
  const [dailyRecords, setDailyRecords] = useState([])
  const [summaryData, setSummaryData] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0
  })
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' })

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/login')
      return
    }
    fetchAttendance()
  }, [viewMode, selectedMonth, selectedYear, selectedSemester])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const params = {
        view_type: viewMode,
        semester: selectedSemester || undefined
      }
      
      if (viewMode === 'daily') {
        params.month = selectedMonth
        params.year = selectedYear
      }
      
      const result = await api.getStudentAttendance(params)
      
      if (result.success) {
        if (viewMode === 'daily') {
          setDailyRecords(result.data.records || [])
          setStats(result.data.stats || { total: 0, present: 0, absent: 0, percentage: 0 })
        } else {
          setSummaryData(result.data.subjects || [])
        }
        setCurrentSemester(result.data.current_semester)
        if (!selectedSemester) {
          setSelectedSemester(result.data.current_semester)
        }
      } else {
        setAlert({ show: true, message: result.message || 'Failed to load attendance', type: 'error' })
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      setAlert({ show: true, message: 'Failed to load attendance', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
      case 'absent': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
      case 'late': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'excused': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return 'fa-check-circle'
      case 'absent': return 'fa-times-circle'
      case 'late': return 'fa-clock'
      case 'excused': return 'fa-info-circle'
      default: return 'fa-question-circle'
    }
  }

  const getAvailableMonths = () => {
    const current = new Date()
    const currentMonth = current.getMonth() + 1
    const currentYear = current.getFullYear()
    
    const months = [
      { value: currentMonth, label: current.toLocaleString('default', { month: 'long' }), year: currentYear }
    ]
    
    // Add previous month
    const prevDate = new Date(current)
    prevDate.setMonth(prevDate.getMonth() - 1)
    months.push({
      value: prevDate.getMonth() + 1,
      label: prevDate.toLocaleString('default', { month: 'long' }),
      year: prevDate.getFullYear()
    })
    
    return months
  }

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

  const pieData = [
    { name: 'Present', value: stats.present, color: '#10b981' },
    { name: 'Absent', value: stats.absent, color: '#ef4444' },
    { name: 'Late', value: stats.late, color: '#f59e0b' },
    { name: 'Excused', value: stats.excused, color: '#3b82f6' }
  ].filter(item => item.value > 0)

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex flex-wrap gap-3 justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold glass-text">My Attendance</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
          </div>
        </header>

        {/* View Mode Toggle & Filters */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 glass-input rounded-lg p-1">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'daily'
                    ? 'bg-primary text-white shadow-lg'
                    : 'glass-text-muted hover:bg-white/10'
                }`}
              >
                <i className="fas fa-calendar-day mr-2"></i>
                Daily View
              </button>
              <button
                onClick={() => setViewMode('summary')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  viewMode === 'summary'
                    ? 'bg-primary text-white shadow-lg'
                    : 'glass-text-muted hover:bg-white/10'
                }`}
              >
                <i className="fas fa-chart-bar mr-2"></i>
                Summary View
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:flex sm:items-center gap-3 w-full sm:w-auto">
              {/* Semester Filter */}
              <CustomSelect
                name="semester"
                value={selectedSemester?.toString() || currentSemester.toString()}
                onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
                options={[
                  { value: currentSemester.toString(), label: `Current Semester (${currentSemester})` },
                  ...[1, 2, 3, 4, 5, 6].filter(s => s !== currentSemester).map(sem => ({
                    value: sem.toString(),
                    label: `Semester ${sem}`
                  }))
                ]}
                placeholder="Select Semester"
              />

              {/* Month Filter (only for daily view) */}
              {viewMode === 'daily' && (
                <CustomSelect
                  name="month"
                  value={`${selectedMonth}-${selectedYear}`}
                  onChange={(e) => {
                    const [month, year] = e.target.value.split('-')
                    setSelectedMonth(parseInt(month))
                    setSelectedYear(parseInt(year))
                  }}
                  options={getAvailableMonths().map(month => ({
                    value: `${month.value}-${month.year}`,
                    label: `${month.label} ${month.year}`
                  }))}
                  placeholder="Select Month"
                />
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <i className="fas fa-spinner fa-spin text-6xl text-primary mb-4"></i>
              <p className="glass-text-muted text-lg">Loading attendance...</p>
            </div>
          </div>
        ) : viewMode === 'daily' ? (
          /* Daily View */
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6"
              >
                <p className="glass-text-muted text-sm font-medium mb-1">Total</p>
                <p className="text-3xl font-bold glass-text">{stats.total}</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel p-6"
              >
                <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Present</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-6"
              >
                <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">Absent</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel p-6"
              >
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium mb-1">Late</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.late}</p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-primary p-6 rounded-2xl shadow-glass text-white"
              >
                <p className="text-white/80 text-sm font-medium mb-1">Percentage</p>
                <p className="text-3xl font-bold">{stats.percentage}%</p>
              </motion.div>
            </div>

            {/* Pie Chart */}
            {stats.total > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-panel p-6"
              >
                <h2 className="text-xl font-display font-bold glass-text mb-6">Attendance Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Daily Records */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-panel overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-display font-bold glass-text">Daily Attendance Records</h2>
                <p className="text-sm glass-text-muted mt-1">
                  Showing records for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              
              {dailyRecords.length === 0 ? (
                <div className="p-12 text-center glass-text-muted">
                  <i className="fas fa-calendar-times text-4xl mb-4 opacity-50"></i>
                  <p>No attendance records found for this period</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {dailyRecords.map((record, index) => (
                    <div key={index} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(record.status)}`}>
                          <i className={`fas ${getStatusIcon(record.status)}`}></i>
                        </div>
                        <div>
                          <h3 className="font-semibold glass-text">{record.subject_name}</h3>
                          <p className="text-sm glass-text-muted">{record.subject_code}</p>
                          {record.remarks && (
                            <p className="text-xs glass-text-muted mt-1">{record.remarks}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium glass-text">
                          {new Date(record.attendance_date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          /* Summary View */
          <div className="space-y-6">
            {summaryData.length === 0 ? (
              <div className="glass-panel p-12 text-center glass-text-muted">
                <i className="fas fa-chart-bar text-4xl mb-4 opacity-50"></i>
                <p>No historical data available</p>
                <p className="text-sm mt-2">Summary view shows data from months before the current and previous month</p>
              </div>
            ) : (
              summaryData.map((subject, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-panel p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-display font-bold glass-text">{subject.subject_name}</h3>
                      <p className="text-sm glass-text-muted">{subject.subject_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{subject.overall_percentage}%</p>
                      <p className="text-sm glass-text-muted">Overall</p>
                    </div>
                  </div>

                  {/* Bar Chart for Monthly Breakdown */}
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={subject.months}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month_name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="percentage" fill="#6366f1" name="Attendance %" />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Monthly Details */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subject.months.map((month, mIndex) => (
                      <div key={mIndex} className="glass rounded-lg p-4">
                        <p className="font-semibold glass-text mb-2">{month.month_name} {month.year}</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="glass-text-muted">Total Classes:</span>
                            <span className="font-medium glass-text">{month.total_classes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-600 dark:text-green-400">Present:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{month.present_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600 dark:text-red-400">Absent:</span>
                            <span className="font-medium text-red-600 dark:text-red-400">{month.absent_count}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-white/10">
                            <span className="glass-text-muted">Percentage:</span>
                            <span className="font-bold text-primary">{month.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <Navigation />

      <CustomAlert
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
      />
    </div>
  )
}

