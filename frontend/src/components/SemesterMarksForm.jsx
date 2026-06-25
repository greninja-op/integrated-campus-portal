import { useState } from 'react'
import { getGradeAndGP, calculateCP, calculateTotal, getResult, calculateSemesterTotals } from '../utils/gradeCalculator'

export default function SemesterMarksForm({ student, onSubmit, onBack }) {
  const [subjects, setSubjects] = useState([
    { 
      courseCode: '', 
      courseName: '', 
      credit: 4, 
      esaMarks: '', 
      esaMax: 80, 
      isaMarks: '', 
      isaMax: 20,
      total: 0,
      grade: '',
      gp: 0,
      cp: 0,
      result: ''
    }
  ])

  const addSubject = () => {
    setSubjects([...subjects, {
      courseCode: '',
      courseName: '',
      credit: 4,
      esaMarks: '',
      esaMax: 80,
      isaMarks: '',
      isaMax: 20,
      total: 0,
      grade: '',
      gp: 0,
      cp: 0,
      result: ''
    }])
  }

  const removeSubject = (index) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index))
    }
  }

  const updateSubject = (index, field, value) => {
    const updated = [...subjects]
    updated[index][field] = value
    
    // Auto-calculate when marks change
    if (field === 'esaMarks' || field === 'isaMarks' || field === 'credit') {
      const esa = parseInt(updated[index].esaMarks) || 0
      const isa = parseInt(updated[index].isaMarks) || 0
      const total = esa + isa
      
      updated[index].total = total
      
      const { grade, gp } = getGradeAndGP(total)
      updated[index].grade = grade
      updated[index].gp = gp
      updated[index].cp = calculateCP(parseInt(updated[index].credit) || 0, gp)
      updated[index].result = getResult(total)
    }
    
    setSubjects(updated)
  }

  const handleSubmit = () => {
    const totals = calculateSemesterTotals(subjects)
    
    const semesterData = {
      student: student,
      subjects: subjects,
      totals: totals,
      submittedAt: new Date().toISOString()
    }
    
    onSubmit(semesterData)
  }

  const totals = calculateSemesterTotals(subjects)

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-primary hover:opacity-80 mb-4"
      >
        <i className="fas fa-arrow-left mr-2"></i>
        Back
      </button>

      <div className="glass-panel p-4">
        <h3 className="font-bold glass-text text-lg">
          Semester Marks Entry
        </h3>
        <p className="glass-text-muted text-sm">
          Student: {student.name} ({student.rollNo})
        </p>
      </div>

      {/* Subjects Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/5 dark:bg-white/5 glass-text">
              <th className="p-2 text-left">Course Code</th>
              <th className="p-2 text-left">Course</th>
              <th className="p-2 text-center">Credit</th>
              <th className="p-2 text-center" colSpan="2">External (ESA)</th>
              <th className="p-2 text-center" colSpan="2">Internal (ISA)</th>
              <th className="p-2 text-center">Total</th>
              <th className="p-2 text-center">MAX</th>
              <th className="p-2 text-center">Grade</th>
              <th className="p-2 text-center">GP</th>
              <th className="p-2 text-center">CP</th>
              <th className="p-2 text-center">Result</th>
              <th className="p-2"></th>
            </tr>
            <tr className="bg-black/5 dark:bg-white/5 text-xs glass-text-muted">
              <th className="p-1"></th>
              <th className="p-1"></th>
              <th className="p-1"></th>
              <th className="p-1">ESA</th>
              <th className="p-1">MAX</th>
              <th className="p-1">ISA</th>
              <th className="p-1">MAX</th>
              <th className="p-1"></th>
              <th className="p-1"></th>
              <th className="p-1"></th>
              <th className="p-1"></th>
              <th className="p-1"></th>
              <th className="p-1"></th>
              <th className="p-1"></th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => (
              <tr key={index} className="border-b border-white/10 dark:border-white/5">
                <td className="p-2">
                  <input
                    type="text"
                    value={subject.courseCode}
                    onChange={(e) => updateSubject(index, 'courseCode', e.target.value)}
                    placeholder="Code"
                    className="w-full px-2 py-1 glass-input text-sm"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={subject.courseName}
                    onChange={(e) => updateSubject(index, 'courseName', e.target.value)}
                    placeholder="Course Name"
                    className="w-full px-2 py-1 glass-input text-sm"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={subject.credit}
                    onChange={(e) => updateSubject(index, 'credit', e.target.value)}
                    className="w-16 px-2 py-1 glass-input text-sm text-center"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={subject.esaMarks}
                    onChange={(e) => updateSubject(index, 'esaMarks', e.target.value)}
                    max={subject.esaMax}
                    placeholder="0"
                    className="w-16 px-2 py-1 glass-input text-sm text-center"
                  />
                </td>
                <td className="p-2 text-center glass-text-muted">{subject.esaMax}</td>
                <td className="p-2">
                  <input
                    type="number"
                    value={subject.isaMarks}
                    onChange={(e) => updateSubject(index, 'isaMarks', e.target.value)}
                    max={subject.isaMax}
                    placeholder="0"
                    className="w-16 px-2 py-1 glass-input text-sm text-center"
                  />
                </td>
                <td className="p-2 text-center glass-text-muted">{subject.isaMax}</td>
                <td className="p-2 text-center font-bold glass-text">{subject.total}</td>
                <td className="p-2 text-center glass-text-muted">100</td>
                <td className="p-2 text-center font-bold text-primary">{subject.grade}</td>
                <td className="p-2 text-center font-bold glass-text">{subject.gp}</td>
                <td className="p-2 text-center font-bold glass-text">{subject.cp}</td>
                <td className={`p-2 text-center font-bold ${subject.result === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
                  {subject.result}
                </td>
                <td className="p-2">
                  {subjects.length > 1 && (
                    <button
                      onClick={() => removeSubject(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-black/5 dark:bg-white/5 font-bold glass-text">
              <td className="p-2" colSpan="2">SEMESTER RESULT</td>
              <td className="p-2 text-center">{totals.totalCredits}</td>
              <td className="p-2 text-center" colSpan="4">SCPA: {totals.scpa}</td>
              <td className="p-2 text-center">{totals.totalMarks}</td>
              <td className="p-2 text-center">{totals.totalMaxMarks}</td>
              <td className="p-2 text-center text-primary">{totals.overallGrade}</td>
              <td className="p-2"></td>
              <td className="p-2 text-center">{totals.totalCP}</td>
              <td className={`p-2 text-center ${totals.overallResult === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
                {totals.overallResult}
              </td>
              <td className="p-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-4">
        <button
          onClick={addSubject}
          className="btn-glass px-6 py-3"
        >
          <i className="fas fa-plus mr-2"></i>
          Add Subject
        </button>

        <button
          onClick={handleSubmit}
          disabled={subjects.some(s => !s.courseCode || !s.courseName)}
          className="btn-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-check mr-2"></i>
          Submit Semester Marks
        </button>
      </div>
    </div>
  )
}

