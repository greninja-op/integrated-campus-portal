import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark)
    
    setIsDark(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    
    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-[72px] h-9 rounded-full bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md transition-all duration-300 focus:outline-none hover:shadow-lg"
      aria-label="Toggle theme"
    >
      {/* Sliding Blue Pill with Icon */}
      <div
        className="absolute top-1 h-7 w-7 rounded-full bg-[#4169E1] shadow-lg transition-all duration-300 ease-in-out flex items-center justify-center z-10"
        style={{
          left: isDark ? 'calc(100% - 2rem)' : '0.25rem'
        }}
      >
        {isDark ? (
          <i className="fas fa-moon text-white text-sm"></i>
        ) : (
          <i className="fas fa-sun text-white text-sm"></i>
        )}
      </div>
    </button>
  )
}

