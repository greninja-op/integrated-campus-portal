import { motion, AnimatePresence } from 'motion/react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'OK', cancelText = 'Cancel', type = 'info' }) {
  if (!isOpen) return null

  const colors = {
    info: 'from-blue-500 to-cyan-500',
    warning: 'from-amber-500 to-orange-500',
    success: 'from-emerald-500 to-teal-500',
    error: 'from-rose-500 to-red-500'
  }

  const iconColors = {
    info: 'text-blue-500',
    warning: 'text-amber-500',
    success: 'text-emerald-500',
    error: 'text-rose-500'
  }

  const icons = {
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
    success: 'fa-check-circle',
    error: 'fa-times-circle'
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header with gradient */}
          <div className={`h-2 bg-gradient-to-r ${colors[type]}`}></div>

          <div className="p-6">
            {/* Icon and Title */}
            <div className="flex items-start gap-4 mb-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${colors[type]} flex items-center justify-center`}
              >
                <i className={`fas ${icons[type]} text-white text-xl`}></i>
              </motion.div>

              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              {cancelText && (
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-800 dark:text-white rounded-xl font-semibold transition-all"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  onClose()
                  setTimeout(() => onConfirm(), 100)
                }}
                className={`flex-1 px-6 py-3 bg-gradient-to-r ${colors[type]} hover:opacity-90 text-white rounded-xl font-semibold transition-all shadow-lg`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
