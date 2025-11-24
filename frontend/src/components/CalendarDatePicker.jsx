import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export default function CalendarDatePicker({ label, name, value, onChange, minDate, required = false }) {
  const [showCalendar, setShowCalendar] = useState(false)
  
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0]
    onChange({ target: { name, value: today } })
    setShowCalendar(false)
  }

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
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:border-purple-500 transition-all"
        />
        <i className="fas fa-calendar-alt absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
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
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
            >
              <input
                type="date"
                name={name}
                value={value}
                onChange={(e) => {
                  onChange(e)
                  setShowCalendar(false)
                }}
                min={minDate}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:border-purple-500"
              />
              
              <button
                type="button"
                onClick={setToday}
                className="w-full mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
              >
                Today
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
