import { motion, AnimatePresence } from 'motion/react'

export default function CustomAlert({ show, message, type = 'success', onClose }) {
  if (!show) return null

  const config = {
    success: {
      icon: 'fa-circle-check',
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      text: 'text-emerald-700 dark:text-emerald-300'
    },
    error: {
      icon: 'fa-circle-xmark',
      gradient: 'from-rose-500 to-red-600',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      border: 'border-rose-200 dark:border-rose-800',
      iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
      text: 'text-rose-700 dark:text-rose-300'
    },
    warning: {
      icon: 'fa-triangle-exclamation',
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      text: 'text-amber-700 dark:text-amber-300'
    },
    info: {
      icon: 'fa-circle-info',
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      text: 'text-blue-700 dark:text-blue-300'
    }
  }

  const currentConfig = config[type]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
        >
          {/* Decorative top bar */}
          <div className={`h-1.5 bg-gradient-to-r ${currentConfig.gradient}`} />
          
          {/* Content */}
          <div className="p-8">
            {/* Icon with animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', damping: 15 }}
              className="flex justify-center mb-6"
            >
              <div className={`relative h-20 w-20 rounded-full ${currentConfig.iconBg} flex items-center justify-center shadow-lg`}>
                <i className={`fas ${currentConfig.icon} text-4xl text-white`}></i>
                {/* Pulse ring */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute inset-0 rounded-full ${currentConfig.iconBg} opacity-30`}
                />
              </div>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`${currentConfig.bg} ${currentConfig.border} border-2 rounded-2xl p-5 mb-6`}
            >
              <p className={`text-center text-base leading-relaxed ${currentConfig.text} font-medium`}>
                {message}
              </p>
            </motion.div>

            {/* Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={`w-full px-6 py-3.5 bg-gradient-to-r ${currentConfig.gradient} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2`}
            >
              <span>Got it</span>
              <i className="fas fa-arrow-right text-sm"></i>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
