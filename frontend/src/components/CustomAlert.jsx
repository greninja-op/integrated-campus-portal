import { motion, AnimatePresence } from 'motion/react'

export default function CustomAlert({ show, message, type = 'success', onClose }) {
  if (!show) return null

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  }

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
        >
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${colors[type]}/20 mb-4`}>
              <i className={`fas ${icons[type]} text-3xl ${colors[type].replace('bg-', 'text-')}`}></i>
            </div>
            <p className="text-lg text-slate-800 dark:text-white mb-6">
              {message}
            </p>
            <button
              onClick={onClose}
              className={`w-full px-6 py-3 ${colors[type]} hover:opacity-90 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all`}
            >
              OK
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
