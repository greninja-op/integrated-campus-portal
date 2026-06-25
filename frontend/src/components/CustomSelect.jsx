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
        <label className="block font-semibold mb-2 glass-text-muted">
          {icon && <i className={`${icon} mr-2`}></i>}
          {label}
        </label>
      )}
      
      <div
        ref={selectRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`glass-input w-full min-w-0 px-4 py-3 cursor-pointer flex items-center justify-between ${
          isOpen ? 'border-primary shadow-glass-lg' : ''
        }`}
      >
        <span className={`flex-1 truncate ${selectedValue ? 'font-medium glass-text' : 'glass-text-muted'}`}>
          {getSelectedLabel()}
        </span>
        <motion.i 
          className="fas fa-chevron-down text-primary ml-2 flex-shrink-0"
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
            className="glass-panel absolute z-[10001] mt-2 w-full rounded-xl overflow-hidden max-h-80 overflow-y-auto"
          >
            {options.length === 0 ? (
              <div className="px-5 py-3.5 glass-text-muted text-center">
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
                  className={`px-5 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary text-white font-semibold'
                      : 'glass-text hover:bg-primary/10'
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

