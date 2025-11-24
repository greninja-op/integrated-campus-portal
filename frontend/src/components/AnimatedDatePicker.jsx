import { useState, useEffect } from 'react'

export default function AnimatedDatePicker({ name, value, onChange, label }) {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')

  // Parse existing value into day/month/year
  useEffect(() => {
    if (value) {
      const date = new Date(value)
      setDay(String(date.getDate()).padStart(2, '0'))
      setMonth(String(date.getMonth() + 1).padStart(2, '0'))
      setYear(String(date.getFullYear()))
    }
  }, [value])

  // Check if year is leap year
  const isLeapYear = (y) => {
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)
  }

  // Get max days for a given month and year
  const getMaxDays = (m, y) => {
    const monthInt = parseInt(m)
    const yearInt = parseInt(y)
    
    if (!monthInt || monthInt < 1 || monthInt > 12) return 31
    
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    let maxDays = daysInMonth[monthInt - 1]
    
    // February in leap year
    if (monthInt === 2 && yearInt && isLeapYear(yearInt)) {
      maxDays = 29
    }
    
    return maxDays
  }

  // Validate and update parent when day/month/year changes
  useEffect(() => {
    if (day && month && year && year.length === 4) {
      const dayInt = parseInt(day)
      const monthInt = parseInt(month)
      const yearInt = parseInt(year)
      const currentYear = new Date().getFullYear()
      
      // Validate year
      if (yearInt > currentYear) {
        setError(`Year cannot exceed ${currentYear}`)
        return
      }
      
      if (yearInt < 1900) {
        setError('Year must be 1900 or later')
        return
      }
      
      // Validate month
      if (monthInt < 1 || monthInt > 12) {
        setError('Month must be between 1 and 12')
        return
      }
      
      // Validate day based on month and year
      const maxDays = getMaxDays(month, year)
      if (dayInt < 1 || dayInt > maxDays) {
        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December']
        setError(`${monthNames[monthInt]} ${yearInt} has only ${maxDays} days`)
        return
      }
      
      // All valid - clear error and update parent
      setError('')
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      onChange({ target: { name, value: dateStr } })
    } else {
      setError('')
    }
  }, [day, month, year, name, onChange])

  const handleDayChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2)
    
    // Always allow empty (for backspace/delete)
    if (val === '') {
      setDay('')
      return
    }
    
    const dayInt = parseInt(val)
    
    // Allow single digit typing (1-9)
    if (val.length === 1) {
      if (dayInt >= 0 && dayInt <= 9) {
        setDay(val)
      }
      return
    }
    
    // For two digits, validate against month/year if available
    if (month && year && year.length === 4) {
      const maxDays = getMaxDays(month, year)
      if (dayInt >= 1 && dayInt <= maxDays) {
        setDay(val)
      }
    } else {
      // No month/year yet, just limit to 31
      if (dayInt >= 1 && dayInt <= 31) {
        setDay(val)
      }
    }
  }

  const handleMonthChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2)
    
    // Always allow empty (for backspace/delete)
    if (val === '') {
      setMonth('')
      return
    }
    
    const monthInt = parseInt(val)
    
    // Allow single digit typing (0-9)
    if (val.length === 1) {
      setMonth(val)
      return
    }
    
    // For two digits, validate 01-12
    if (val.length === 2 && monthInt >= 1 && monthInt <= 12) {
      setMonth(val)
      
      // Re-validate day if it exists
      if (day && year && year.length === 4) {
        const maxDays = getMaxDays(val, year)
        const dayInt = parseInt(day)
        if (dayInt > maxDays) {
          setDay(String(maxDays).padStart(2, '0'))
        }
      }
    }
  }

  const handleYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setYear(val)
    
    // Re-validate day if month is February and day exists
    if (val.length === 4 && month === '02' && day) {
      const maxDays = getMaxDays(month, val)
      const dayInt = parseInt(day)
      if (dayInt > maxDays) {
        setDay(String(maxDays).padStart(2, '0'))
      }
    }
  }

  return (
    <div>
      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            Day
          </label>
          <input
            type="text"
            value={day}
            onChange={handleDayChange}
            placeholder="DD"
            maxLength="2"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all text-center font-semibold text-lg"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            Month
          </label>
          <input
            type="text"
            value={month}
            onChange={handleMonthChange}
            placeholder="MM"
            maxLength="2"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all text-center font-semibold text-lg"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">
            Year
          </label>
          <input
            type="text"
            value={year}
            onChange={handleYearChange}
            placeholder="YYYY"
            maxLength="4"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/70 dark:focus:bg-gray-700/70 transition-all text-center font-semibold text-lg"
          />
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-2 font-medium">
          <i className="fas fa-exclamation-circle mr-1"></i>
          {error}
        </p>
      )}
      {day && month && year && year.length === 4 && !error && (
        <p className="text-green-600 dark:text-green-400 text-sm mt-2 font-medium">
          <i className="fas fa-check-circle mr-1"></i>
          {new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      )}
    </div>
  )
}

