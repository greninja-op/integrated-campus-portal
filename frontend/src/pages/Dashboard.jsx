import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

// Time-aware greeting — small touch that makes the page feel human, not generated.
function getGreeting(d = new Date()) {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Relative, human date for notices ("Today", "Yesterday", "Mar 3").
function relativeDate(value) {
  if (!value) return ''
  const then = new Date(value)
  if (isNaN(then)) return ''
  const today = new Date()
  const days = Math.floor((today.setHours(0, 0, 0, 0) - new Date(then).setHours(0, 0, 0, 0)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days > 1 && days < 7) return `${days} days ago`
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const NOTICE_ACCENT = {
  general: { dot: 'bg-primary', icon: 'fa-circle-info' },
  academic: { dot: 'bg-blue-500', icon: 'fa-graduation-cap' },
  event: { dot: 'bg-emerald-500', icon: 'fa-calendar-day' },
  exam: { dot: 'bg-amber-500', icon: 'fa-file-pen' },
  holiday: { dot: 'bg-teal-500', icon: 'fa-umbrella-beach' },
  sports: { dot: 'bg-rose-500', icon: 'fa-futbol' },
}

const QUICK_LINKS = [
  { to: '/subjects', icon: 'fa-book-open', label: 'My subjects', desc: 'Courses this semester' },
  { to: '/materials', icon: 'fa-folder-open', label: 'Study materials', desc: 'Notes & question papers' },
  { to: '/analysis', icon: 'fa-chart-line', label: 'Performance', desc: 'GPA trend & insights' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState({ percentage: 0, present: 0, total: 0, hasData: false })
  const user = api.getCurrentUser()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchStats = async () => {
      try {
        const result = await api.getDashboardStats(user.student_id)
        if (result.success) setStats(result.data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchAttendance = async () => {
      try {
        const result = await api.getAttendance(user.student_id)
        const subjects = result?.data?.subjects || []
        if (result.success && subjects.length > 0) {
          const present = subjects.reduce((s, x) => s + (x.present || 0), 0)
          const total = subjects.reduce((s, x) => s + (x.total || 0), 0)
          const percentage = total > 0 ? Math.round((present / total) * 100) : 0
          setAttendance({ percentage, present, total, hasData: total > 0 })
        }
      } catch (error) {
        console.error('Error fetching attendance:', error)
      }
    }

    const loadNotices = async () => {
      try {
        const result = await api.getNotices()
        if (result.success && result.data) setNotices(result.data.notices?.slice(0, 4) || [])
      } catch (error) {
        console.error('Error fetching notices:', error)
      }
    }

    fetchStats()
    fetchAttendance()
    loadNotices()
  }, [])

  // ---- Derive real values (no fabricated data) ----
  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const cgpaRaw = stats?.cgpa
  const cgpa = cgpaRaw && cgpaRaw !== '0.00' ? cgpaRaw : null
  const gpa = stats?.gpa && stats.gpa !== '0.00' ? stats.gpa : null

  const fees = stats?.fees || []
  const pendingFees = fees.filter((f) => {
    const s = (f.status || f.payment_status || '').toLowerCase()
    if (s) return s !== 'paid' && s !== 'completed'
    return Number(f.balance ?? f.amount_due ?? f.due ?? 0) > 0
  }).length

  const att = attendance
  const attTone = !att.hasData
    ? 'muted'
    : att.percentage >= 75 ? 'good' : att.percentage >= 60 ? 'warn' : 'bad'
  const attBar = { good: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-rose-500', muted: 'bg-white/30' }[attTone]
  const attMsg = {
    good: 'On track — keep it up.',
    warn: 'A little low. Aim for 75%.',
    bad: 'Below 75%. Time to show up.',
    muted: 'No attendance recorded yet.',
  }[attTone]

  const dash = (v) => (loading && v == null ? '—' : v)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen pb-28 px-4 sm:px-6 py-8 max-w-6xl mx-auto"
      >
        {/* Greeting band — the single entry point and identity */}
        <header className="flex items-start justify-between gap-4 mb-8">
          <div className="min-w-0">
            <p className="text-sm glass-text-muted">{today}</p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold glass-text mt-1 truncate">
              {getGreeting()}, {firstName}
            </h1>
            <p className="glass-text-muted mt-2">
              {[user?.department, user?.semester && `Semester ${user.semester}`].filter(Boolean).join(' · ') ||
                'Welcome back to your campus portal.'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt=""
                className="w-11 h-11 rounded-full object-cover border border-white/40 shadow-glass"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white font-semibold shadow-glass">
                {user?.full_name?.charAt(0) || 'S'}
              </div>
            )}
          </div>
        </header>

        {/* The three real numbers — each tile is also a doorway to its page */}
        <section aria-label="Your status at a glance" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Attendance */}
          <button
            onClick={() => navigate('/attendance')}
            className="glass-card p-5 text-left flex flex-col gap-3 focus:outline-none"
            aria-label={`Attendance ${att.hasData ? att.percentage + ' percent' : 'no data'}. Open attendance.`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider glass-text-muted">Attendance</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-bold tabular-nums glass-text">
                {att.hasData ? att.percentage : '—'}
              </span>
              {att.hasData && <span className="text-xl font-semibold glass-text-muted">%</span>}
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className={`h-full rounded-full ${attBar} transition-all duration-500`} style={{ width: `${att.hasData ? att.percentage : 0}%` }} />
            </div>
            <span className="text-sm glass-text-muted">{att.hasData ? `${att.present} of ${att.total} classes · ${attMsg}` : attMsg}</span>
          </button>

          {/* CGPA */}
          <button
            onClick={() => navigate('/result')}
            className="glass-card p-5 text-left flex flex-col gap-3 focus:outline-none"
            aria-label={`CGPA ${cgpa || 'not available'}. Open results.`}
          >
            <span className="text-xs font-semibold uppercase tracking-wider glass-text-muted">CGPA</span>
            <span className="text-4xl font-display font-bold tabular-nums glass-text">{cgpa || dash(null)}</span>
            <span className="text-sm glass-text-muted mt-auto">
              {gpa ? `This semester · ${gpa} GPA` : cgpa ? 'Across all semesters' : 'Grades appear once published'}
            </span>
          </button>

          {/* Fees — the one tile that earns the accent when action is needed */}
          <button
            onClick={() => navigate('/payments')}
            className={`glass-card p-5 text-left flex flex-col gap-3 focus:outline-none ${
              pendingFees > 0 ? 'ring-2 ring-primary/60' : ''
            }`}
            aria-label={pendingFees > 0 ? `${pendingFees} fees due. Open payments.` : 'Fees all clear. Open payments.'}
          >
            <span className="text-xs font-semibold uppercase tracking-wider glass-text-muted">Fees</span>
            {pendingFees > 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold tabular-nums text-primary">{pendingFees}</span>
                <span className="text-lg font-semibold glass-text-muted">due</span>
              </div>
            ) : (
              <span className="text-3xl font-display font-bold glass-text">{loading ? '—' : 'All clear'}</span>
            )}
            <span className="text-sm glass-text-muted mt-auto">
              {pendingFees > 0 ? 'Tap to review and pay' : loading ? 'Checking your account…' : 'No outstanding payments'}
            </span>
          </button>
        </section>

        {/* Notice board (primary) + quick access (secondary) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notices */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold glass-text">Notice board</h2>
              {notices.length > 0 && (
                <button onClick={() => navigate('/notice')} className="text-sm font-semibold text-primary hover:underline">
                  View all
                </button>
              )}
            </div>

            {notices.length === 0 ? (
              <div className="glass-panel p-10 text-center">
                <i className="fas fa-inbox text-3xl glass-text-muted mb-3" aria-hidden="true"></i>
                <p className="glass-text font-medium">You're all caught up</p>
                <p className="glass-text-muted text-sm mt-1">New notices from the college will show up here.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {notices.map((notice, i) => {
                  const a = NOTICE_ACCENT[notice.category] || NOTICE_ACCENT.general
                  const preview = notice.content?.length > 120 ? notice.content.slice(0, 120).trimEnd() + '…' : notice.content
                  return (
                    <li key={notice.id ?? i}>
                      <button
                        onClick={() => navigate('/notice')}
                        className="glass-card w-full text-left p-5 flex gap-4 focus:outline-none"
                      >
                        <span className={`mt-1 w-9 h-9 rounded-xl ${a.dot} flex items-center justify-center text-white shrink-0`}>
                          <i className={`fas ${a.icon} text-sm`} aria-hidden="true"></i>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-display font-semibold glass-text truncate">{notice.title}</span>
                            <span className="text-xs glass-text-muted shrink-0">{relativeDate(notice.created_at)}</span>
                          </span>
                          {preview && <span className="block text-sm glass-text-muted mt-1 line-clamp-2">{preview}</span>}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Quick access (secondary, quiet) */}
          <section aria-label="Quick access">
            <h2 className="text-xl font-display font-bold glass-text mb-4">Quick access</h2>
            <div className="glass-panel p-2">
              {QUICK_LINKS.map((link, i) => (
                <button
                  key={link.to}
                  onClick={() => navigate(link.to)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors focus:outline-none ${
                    i !== QUICK_LINKS.length - 1 ? 'border-b border-white/10' : ''
                  }`}
                >
                  <span className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <i className={`fas ${link.icon}`} aria-hidden="true"></i>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold glass-text">{link.label}</span>
                    <span className="block text-xs glass-text-muted">{link.desc}</span>
                  </span>
                  <i className="fas fa-chevron-right text-xs glass-text-muted" aria-hidden="true"></i>
                </button>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
      <Navigation />
    </>
  )
}
