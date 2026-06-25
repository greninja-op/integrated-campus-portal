import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

function getGreeting(d = new Date()) {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function relativeDate(value) {
  if (!value) return ''
  const then = new Date(value)
  if (isNaN(then)) return ''
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(then).setHours(0, 0, 0, 0)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days > 1 && days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// The signature detail: a hand-drawn underline under the student's name.
function Underline({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 240 14" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <path
        d="M3 9.5C40 4 78 3.5 119 6.5C156 9 196 9.5 237 4.5"
        stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
      />
    </svg>
  )
}

const gradeTone = (pct) =>
  pct >= 80 ? { ring: 'text-emerald-500', chip: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' }
  : pct >= 60 ? { ring: 'text-amber-500', chip: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' }
  : { ring: 'text-rose-500', chip: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' }

const NOTICE_ACCENT = {
  general: 'bg-primary', academic: 'bg-blue-500', event: 'bg-emerald-500',
  exam: 'bg-amber-500', holiday: 'bg-teal-500', sports: 'bg-rose-500',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [notices, setNotices] = useState([])
  const [results, setResults] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState({ percentage: 0, present: 0, total: 0, hasData: false })
  const user = api.getCurrentUser()

  useEffect(() => {
    if (!user) { navigate('/login'); return }

    ;(async () => {
      try {
        const r = await api.getDashboardStats(user.student_id)
        if (r.success) setStats(r.data)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    })()

    ;(async () => {
      try {
        const r = await api.getAttendance(user.student_id)
        const subj = r?.data?.subjects || []
        if (r.success && subj.length) {
          const present = subj.reduce((s, x) => s + (x.present || 0), 0)
          const total = subj.reduce((s, x) => s + (x.total || 0), 0)
          setAttendance({ percentage: total ? Math.round((present / total) * 100) : 0, present, total, hasData: total > 0 })
        }
      } catch (e) { console.error(e) }
    })()

    ;(async () => {
      try {
        const r = await api.authenticatedGet('/student/get_current_results.php')
        const res = r?.data?.results || {}
        const order = [['internal_2', 'Internal 2'], ['internal_1', 'Internal 1'], ['class_test', 'Class test']]
        const flat = []
        for (const [key, label] of order) (res[key] || []).forEach((row) => flat.push({ ...row, examLabel: label }))
        setResults(flat.slice(0, 5))
      } catch (e) { console.error(e) }
    })()

    ;(async () => {
      try {
        const r = await api.getNotices()
        if (r.success && r.data) setNotices(r.data.notices?.slice(0, 3) || [])
      } catch (e) { console.error(e) }
    })()

    ;(async () => {
      try {
        const r = await api.getSubjects()
        if (r.success) setSubjects((r.data?.subjects || []).slice(0, 8))
      } catch (e) { console.error(e) }
    })()
  }, [])

  // ---- Real derived values ----
  const firstName = user?.full_name?.split(' ')[0] || 'there'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const cgpa = stats?.cgpa && stats.cgpa !== '0.00' ? stats.cgpa : null
  const gpa = stats?.gpa && stats.gpa !== '0.00' ? stats.gpa : null
  const fees = stats?.fees || []
  const pendingFees = fees.filter((f) => {
    const s = (f.status || f.payment_status || '').toLowerCase()
    if (s) return s !== 'paid' && s !== 'completed'
    return Number(f.balance ?? f.amount_due ?? f.due ?? 0) > 0
  }).length

  const att = attendance
  const attTone = !att.hasData ? 'muted' : att.percentage >= 75 ? 'good' : att.percentage >= 60 ? 'warn' : 'bad'
  const attBar = { good: 'bg-emerald-500', warn: 'bg-amber-500', bad: 'bg-rose-500', muted: 'bg-white/30' }[attTone]

  // Hero number — CGPA leads; falls back to attendance, then a friendly first-run state.
  const hero = cgpa
    ? { value: cgpa, unit: '/ 10', label: 'CGPA', sub: gpa ? `${gpa} GPA this semester` : 'across all semesters' }
    : att.hasData
    ? { value: `${att.percentage}`, unit: '%', label: 'Attendance', sub: `${att.present} of ${att.total} classes` }
    : { value: '—', unit: '', label: 'Your semester', sub: 'Stats appear once records are in' }

  // One human sentence built from real data.
  const bits = []
  if (att.hasData) bits.push(`${att.percentage}% attendance`)
  if (cgpa) bits.push(`an ${cgpa} CGPA`)
  let line
  if (bits.length === 2) line = `${att.percentage >= 75 && Number(cgpa) >= 7 ? "You're having a strong run" : "You're finding your stride"} — ${bits.join(' and ')} so far.`
  else if (bits.length === 1) line = `So far this semester: ${bits[0]}.`
  else line = loading ? 'Pulling your semester together…' : 'Welcome back — your semester snapshot will build as records come in.'

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen pb-28 px-4 sm:px-6 py-7 max-w-6xl mx-auto"
      >
        {/* Top utility row — kept minimal so the hero owns the page */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] glass-text-muted">
            {today}
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user?.profile_image ? (
              <img src={user.profile_image} alt="" className="w-9 h-9 rounded-full object-cover border border-white/40" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                {user?.full_name?.charAt(0) || 'S'}
              </div>
            )}
          </div>
        </div>

        {/* ============ HERO — the single focal element ============ */}
        <section className="glass-panel relative overflow-hidden p-7 sm:p-10 mb-6">
          {/* characterful accent moment: a soft iris glow bleeding in from the corner */}
          <div
            className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full opacity-70"
            style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 45%, transparent), transparent 70%)' }}
            aria-hidden="true"
          />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            {/* Greeting block */}
            <div className="min-w-0">
              <p className="glass-text-muted font-medium mb-1">{getGreeting()},</p>
              <h1 className="font-display font-extrabold glass-text leading-[0.95] text-5xl sm:text-6xl">
                <span className="relative inline-block">
                  {firstName}
                  <Underline className="absolute left-0 -bottom-2 w-full h-3" />
                </span>
              </h1>
              <p className="glass-text-muted mt-5 max-w-md text-[0.95rem] leading-relaxed">{line}</p>

              <div className="flex flex-wrap items-center gap-2 mt-5">
                {(user?.department || user?.semester) && (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 glass-text-muted">
                    {[user?.department, user?.semester && `Semester ${user.semester}`].filter(Boolean).join(' · ')}
                  </span>
                )}
                {pendingFees > 0 && (
                  <button
                    onClick={() => navigate('/payments')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                  >
                    {pendingFees} {pendingFees === 1 ? 'fee' : 'fees'} due · pay now
                  </button>
                )}
              </div>
            </div>

            {/* Hero number */}
            <button
              onClick={() => navigate('/result')}
              className="text-left shrink-0 focus:outline-none group"
              aria-label={`${hero.label} ${hero.value}. Open results.`}
            >
              <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.22em] glass-text-muted mb-1">
                {hero.label}
              </span>
              <span className="flex items-baseline gap-2">
                <span className="font-display font-extrabold tabular-nums glass-text leading-none text-7xl sm:text-8xl group-hover:text-primary transition-colors">
                  {loading && hero.value === '—' ? '—' : hero.value}
                </span>
                {hero.unit && <span className="text-2xl font-display font-bold glass-text-muted">{hero.unit}</span>}
              </span>
              <span className="block text-sm glass-text-muted mt-2">{hero.sub}</span>
            </button>
          </div>
        </section>

        {/* ============ Asymmetric 7 / 5 body ============ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PRIMARY — recent results (real grades) */}
          <section className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold glass-text">Recent marks</h2>
              <button onClick={() => navigate('/result')} className="text-sm font-semibold text-primary hover:underline">
                All results
              </button>
            </div>

            {results.length === 0 ? (
              <div className="glass-panel p-8 text-center">
                <p className="glass-text font-medium">No marks published yet</p>
                <p className="glass-text-muted text-sm mt-1">Scores will appear here as your teachers post them.</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {results.map((m, i) => {
                  const pct = m.max_marks ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0
                  const tone = gradeTone(pct)
                  return (
                    <li key={i}>
                      <div className="glass-card p-4 flex items-center gap-4">
                        <span className={`font-display font-bold tabular-nums text-2xl ${tone.ring} w-14 shrink-0`}>{pct}%</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold glass-text truncate">{m.subject_name}</span>
                          <span className="block text-xs glass-text-muted">
                            {m.subject_code} · {m.examLabel}
                          </span>
                        </span>
                        <span className={`text-sm font-semibold px-2.5 py-1 rounded-lg tabular-nums shrink-0 ${tone.chip}`}>
                          {m.marks_obtained}/{m.max_marks}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Courses this semester — quiet strip (real subjects, not a fake timetable) */}
            {subjects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] glass-text-muted mb-3">
                  This semester · {subjects.length} courses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <button
                      key={s.id || s.subject_code}
                      onClick={() => navigate('/subjects')}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 hover:bg-primary/15 hover:text-primary glass-text-muted transition-colors"
                      title={s.subject_name}
                    >
                      {s.subject_code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* SECONDARY rail — small stats + notices */}
          <aside className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Attendance mini-stat */}
              <button onClick={() => navigate('/attendance')} className="glass-card p-4 text-left focus:outline-none" aria-label="Open attendance">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider glass-text-muted">Attendance</span>
                <span className="flex items-baseline gap-0.5 mt-1.5">
                  <span className="text-3xl font-display font-bold tabular-nums glass-text">{att.hasData ? att.percentage : '—'}</span>
                  {att.hasData && <span className="text-base font-semibold glass-text-muted">%</span>}
                </span>
                <span className="block h-1.5 rounded-full bg-white/20 mt-3 overflow-hidden">
                  <span className={`block h-full rounded-full ${attBar} transition-all duration-500`} style={{ width: `${att.hasData ? att.percentage : 0}%` }} />
                </span>
              </button>

              {/* Fees mini-stat */}
              <button
                onClick={() => navigate('/payments')}
                className={`glass-card p-4 text-left focus:outline-none ${pendingFees > 0 ? 'ring-2 ring-primary/50' : ''}`}
                aria-label="Open payments"
              >
                <span className="text-[0.7rem] font-semibold uppercase tracking-wider glass-text-muted">Fees</span>
                {pendingFees > 0 ? (
                  <span className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-3xl font-display font-bold tabular-nums text-primary">{pendingFees}</span>
                    <span className="text-base font-semibold glass-text-muted">due</span>
                  </span>
                ) : (
                  <span className="block text-2xl font-display font-bold glass-text mt-1.5">{loading ? '—' : 'Clear'}</span>
                )}
                <span className="block text-xs glass-text-muted mt-2">{pendingFees > 0 ? 'Tap to pay' : loading ? 'Checking…' : 'All settled'}</span>
              </button>
            </div>

            {/* Notices */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-display font-bold glass-text">Notices</h2>
                {notices.length > 0 && (
                  <button onClick={() => navigate('/notice')} className="text-sm font-semibold text-primary hover:underline">View all</button>
                )}
              </div>
              {notices.length === 0 ? (
                <div className="glass-panel p-6 text-center">
                  <p className="glass-text-muted text-sm">You're all caught up — new notices show up here.</p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {notices.map((n, i) => (
                    <li key={n.id ?? i}>
                      <button onClick={() => navigate('/notice')} className="glass-card w-full text-left p-4 flex items-start gap-3 focus:outline-none">
                        <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${NOTICE_ACCENT[n.category] || NOTICE_ACCENT.general}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="font-semibold glass-text truncate">{n.title}</span>
                            <span className="text-xs glass-text-muted shrink-0">{relativeDate(n.created_at)}</span>
                          </span>
                          {n.content && <span className="block text-sm glass-text-muted mt-0.5 line-clamp-1">{n.content}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </motion.div>
      <Navigation />
    </>
  )
}
