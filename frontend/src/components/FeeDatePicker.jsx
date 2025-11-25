import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export default function FeeDatePicker({ 
  label, 
  name, 
  value, 
  onChange, 
  required = false,
  type = 'normal', // 'normal' (green), 'fine' (orange), 'superfine' (red)
  disabledDates = [], // Array of dates to disable
  normalDate = null, // For fine picker - shows green
  fineDate = null // For superfine picker - shows orange
}) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    // Parse date string directly to avoid timezone issues
    const [year, month, day] = dateStr.split('-')
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }



  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      })
    }

    // Next month days
    const remainingDays = 42 - days.length // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      })
    }

    return days
  }

  const isDateDisabled = (date) => {
    // Format date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // Can't select today or past dates (must be tomorrow or later)
    if (date < tomorrow) return true
    
    // Can't select dates in disabledDates array
    if (disabledDates.includes(dateStr)) return true
    
    // For fine picker: can't select dates before or equal to normal date
    if (type === 'fine' && normalDate) {
      const normalDateObj = new Date(normalDate)
      normalDateObj.setHours(0, 0, 0, 0)
      if (date <= normalDateObj) return true
    }
    
    // For superfine picker: can't select dates before or equal to fine date
    if (type === 'superfine' && fineDate) {
      const fineDateObj = new Date(fineDate)
      fineDateObj.setHours(0, 0, 0, 0)
      if (date <= fineDateObj) return true
    }
    
    return false
  }

  const getDateColor = (date) => {
    // Format date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    // Selected date - thick border/glow effect
    if (dateStr === value) {
      if (type === 'normal') return 'ring-4 ring-green-500 shadow-lg shadow-green-500/50 !bg-slate-600 text-white'
      if (type === 'fine') return 'ring-4 ring-orange-500 shadow-lg shadow-orange-500/50 !bg-slate-600 text-white'
      if (type === 'superfine') return 'ring-4 ring-red-500 shadow-lg shadow-red-500/50 !bg-slate-600 text-white'
    }
    
    // Show normal date in green border for fine/superfine pickers (reference)
    if (normalDate && dateStr === normalDate && type !== 'normal') {
      return 'ring-4 ring-green-500 !bg-slate-700 text-white'
    }
    
    // Show fine date in orange border for superfine picker (reference)
    if (fineDate && dateStr === fineDate && type === 'superfine') {
      return 'ring-4 ring-orange-500 !bg-slate-700 text-white'
    }
    
    return ''
  }

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return
    
    // Format date as YYYY-MM-DD without timezone conversion
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    onChange({ target: { name, value: dateStr } })
    setShowCalendar(false)
  }

  const changeMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const days = getDaysInMonth(currentMonth)
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Color classes based on type
  const borderColor = type === 'normal' ? 'focus:border-green-500' : type === 'fine' ? 'focus:border-orange-500' : 'focus:border-red-500'
  const iconColor = type === 'normal' ? 'text-green-500' : type === 'fine' ? 'text-orange-500' : 'text-red-500'

  return (
    <div className="relative">
      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={formatDate(value)}
          onClick={() => setShowCalendar(!showCalendar)}
          placeholder="Select date"
          readOnly
          required={required}
          className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white cursor-pointer focus:outline-none ${borderColor} transition-all`}
        />
        <i className={`fas fa-calendar-alt absolute right-4 top-1/2 -translate-y-1/2 ${iconColor} pointer-events-none`}></i>
      </div>

      <AnimatePresence>
        {showCalendar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowCalendar(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute z-50 mt-2 p-4 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-80"
            >
              {/* Month/Year Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-chevron-left text-slate-300 text-sm"></i>
                </button>
                
                <h3 className="text-lg font-bold text-white">
                  {monthYear}
                </h3>
                
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-chevron-right text-slate-300 text-sm"></i>
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-slate-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {days.map((dayObj, index) => {
                  const isDisabled = isDateDisabled(dayObj.date)
                  const colorClass = getDateColor(dayObj.date)
                  const isToday = dayObj.date.toDateString() === today.toDateString()

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateClick(dayObj.date)}
                      disabled={isDisabled}
                      className={`
                        h-10 rounded-lg text-sm font-semibold transition-all relative
                        ${!dayObj.isCurrentMonth ? 'text-slate-600 bg-slate-800/50' : 'text-slate-200 bg-slate-700'}
                        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-600 cursor-pointer'}
                        ${colorClass}
                        ${isToday && !colorClass ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      {isDisabled ? (
                        <div className="relative">
                          <span className="text-slate-500">{dayObj.day}</span>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-0.5 bg-red-500 rotate-45"></div>
                            <div className="absolute w-8 h-0.5 bg-red-500 -rotate-45"></div>
                          </div>
                        </div>
                      ) : (
                        dayObj.day
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Today Display - Only show for normal (without fine) picker */}
              {type === 'normal' && (
                <div className="w-full px-4 py-3 bg-teal-500 text-white rounded-lg font-semibold text-sm text-center cursor-not-allowed opacity-70">
                  <i className="fas fa-calendar-day mr-2"></i>
                  Select Today ({today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
