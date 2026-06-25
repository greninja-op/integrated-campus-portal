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
      <label className="block glass-text-muted font-semibold mb-2">
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
          className="w-full px-4 py-3 glass-input cursor-pointer"
        />
        <i className="fas fa-calendar-alt absolute right-4 top-1/2 -translate-y-1/2 glass-text-muted pointer-events-none"></i>
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
              className="glass-panel absolute z-50 mt-2 p-4"
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
                className="w-full px-4 py-2 glass-input"
              />
              
              <button
                type="button"
                onClick={setToday}
                className="btn-primary w-full mt-2 px-4 py-2"
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
