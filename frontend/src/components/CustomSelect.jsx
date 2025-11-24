import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

export default function CustomSelect({ name, value, onChange, options, label, icon, placeholder = 'Select...' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || '')
  const selectRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    setSelectedValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target) && 
          dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue) => {
    setSelectedValue(optionValue)
    onChange({ target: { name, value: optionValue } })
    setIsOpen(false)
  }

  const getSelectedLabel = () => {
    const selected = options.find(opt => opt.value === selectedValue)
    return selected ? selected.label : placeholder
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2">
          {icon && <i className={`${icon} mr-2`}></i>}
          {label}
        </label>
      )}
      
      <div
        ref={selectRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-w-[200px] px-4 py-3 rounded-lg border bg-white dark:bg-slate-700 text-slate-800 dark:text-white cursor-pointer transition-all flex items-center justify-between ${
          isOpen ? 'border-teal-500 shadow-lg' : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <span className={`flex-1 truncate ${selectedValue ? 'font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
          {getSelectedLabel()}
        </span>
        <motion.i 
          className="fas fa-chevron-down text-teal-500 ml-2 flex-shrink-0"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        ></motion.i>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute z-[10001] mt-2 w-full bg-slate-800 dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-700 overflow-hidden max-h-80 overflow-y-auto"
          >
            {options.length === 0 ? (
              <div className="px-5 py-3.5 text-slate-400 text-center">
                No options available
              </div>
            ) : (
              options.map((option, index) => {
              const isSelected = selectedValue === option.value
              return (
                <motion.div
                  key={option.value}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleSelect(option.value)}
                  className={`px-5 py-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'hover:bg-slate-700 text-white'
                  }`}
                >
                  <span>{option.label}</span>
                </motion.div>
              )
            }))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

