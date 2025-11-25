import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export default function AssignmentDatePicker({ label, name, value, onChange, required = false }) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
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
    
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true, date: new Date(year, month, day) })
    }
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ day, isCurrentMonth: false, date: new Date(year, month + 1, day) })
    }
    return days
  }

  const isDateDisabled = (date) => date < tomorrow

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    onChange({ target: { name, value: `${year}-${month}-${day}` } })
    setShowCalendar(false)
  }


  const changeMonth = (dir) => setCurrentMonth(prev => { const d = new Date(prev); d.setMonth(prev.getMonth() + dir); return d })

  const days = getDaysInMonth(currentMonth)
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const isSelected = (date) => {
    if (!value) return false
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}` === value
  }

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={formatDate(value)}
          onClick={() => setShowCalendar(!showCalendar)}
          placeholder="Select due date"
          readOnly
          required={required}
          className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
        <i className="fas fa-calendar-alt absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none"></i>
      </div>

      <AnimatePresence>
        {showCalendar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute z-50 mt-2 p-4 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-80"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button type="button" onClick={() => changeMonth(-1)}
                  className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                  <i className="fas fa-chevron-left text-slate-300 text-sm"></i>
                </button>
                <h3 className="text-lg font-bold text-white">{monthYear}</h3>
                <button type="button" onClick={() => changeMonth(1)}
                  className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors">
                  <i className="fas fa-chevron-right text-slate-300 text-sm"></i>
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((dayObj, i) => {
                  const disabled = isDateDisabled(dayObj.date)
                  const selected = isSelected(dayObj.date)
                  const isToday = dayObj.date.toDateString() === today.toDateString()

                  return (
                    <button key={i} type="button" onClick={() => handleDateClick(dayObj.date)} disabled={disabled}
                      className={`h-10 rounded-lg text-sm font-semibold transition-all relative
                        ${!dayObj.isCurrentMonth ? 'text-slate-600 bg-slate-800/50' : 'text-slate-200 bg-slate-700'}
                        ${disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-slate-600 cursor-pointer'}
                        ${selected ? 'ring-4 ring-indigo-500 shadow-lg shadow-indigo-500/50 !bg-indigo-600 text-white' : ''}
                        ${isToday && !selected ? 'ring-2 ring-blue-400' : ''}
                      `}>
                      {disabled && dayObj.isCurrentMonth ? (
                        <div className="relative">
                          <span className="text-slate-500">{dayObj.day}</span>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-6 h-0.5 bg-red-500/70 rotate-45"></div>
                          </div>
                        </div>
                      ) : dayObj.day}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
