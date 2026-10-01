import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Course, CourseGradebook, StudentGradeHistory, Assessment } from '../types';
import { api } from '../services/api';
import {
  Award,
  BookOpen,
  PlusCircle,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  TrendingUp,
  HelpCircle,
  Users,
  Calendar,
  X,
  Trash2,
  Edit3,
  Save,
  Search
} from 'lucide-react';

export const GradebookPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [gradebook, setGradebook] = useState<CourseGradebook | null>(null);
  const [studentHistory, setStudentHistory] = useState<StudentGradeHistory | null>(null);
  const [loading, setLoading] = useState(true);

  // Create assessment modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'ASSIGNMENT' | 'QUIZ' | 'MID_TERM' | 'FINAL_EXAM' | 'LAB_VIVA' | 'PROJECT'>('QUIZ');
  const [newMaxMarks, setNewMaxMarks] = useState(50);
  const [newWeightage, setNewWeightage] = useState(20);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Grade Edit Modal
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [gradeInputs, setGradeInputs] = useState<Record<number, { marks: string; feedback: string }>>({});
  const [savingGrades, setSavingGrades] = useState(false);

  // Student Filter in Gradebook
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      if (role === 'student') {
        const history = await api.getMyGradeHistory();
        setStudentHistory(history);
      } else {
        const courseList = await api.getGradebookCourses();
        setCourses(courseList);
        if (courseList.length > 0) {
          const initialCourseId = courseList[0].id;
          setSelectedCourseId(initialCourseId);
          const gb = await api.getCourseGradebook(initialCourseId);
          setGradebook(gb);
        }
      }
    } catch (err) {
      console.error('Failed to load gradebook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [role]);

  const handleSelectCourse = async (courseId: number) => {
    setSelectedCourseId(courseId);
    try {
      setLoading(true);
      const gb = await api.getCourseGradebook(courseId);
      setGradebook(gb);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    try {
      setCreating(true);
      await api.createAssessment({
        course_id: selectedCourseId,
        title: newTitle,
        assessment_type: newType,
        max_marks: Number(newMaxMarks),
        weightage_percent: Number(newWeightage),
        date: newDate,
        description: newDesc,
      });
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      showToast('Assessment successfully published to Course Gradebook!');
      // Reload gradebook
      const gb = await api.getCourseGradebook(selectedCourseId);
      setGradebook(gb);
    } catch (err: any) {
      alert(err.message || 'Failed to create assessment');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssessment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assessment and all recorded grades?')) return;
    try {
      await api.deleteAssessment(id);
      showToast('Assessment deleted.');
      if (selectedCourseId) {
        const gb = await api.getCourseGradebook(selectedCourseId);
        setGradebook(gb);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const openGradingModal = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    if (!gradebook) return;

    const initialInputs: Record<number, { marks: string; feedback: string }> = {};
    gradebook.students.forEach((row) => {
      const g = row.grades[String(assessment.id)];
      initialInputs[row.student.id] = {
        marks: g?.marks_obtained !== null && g?.marks_obtained !== undefined ? String(g.marks_obtained) : '',
        feedback: g?.feedback || '',
      };
    });
    setGradeInputs(initialInputs);
    setGradingModalOpen(true);
  };

  const handleSaveBatchGrades = async () => {
    if (!selectedAssessment || !selectedCourseId) return;
    try {
      setSavingGrades(true);
      const payload = Object.entries(gradeInputs).map(([studentIdStr, val]) => ({
        student_id: Number(studentIdStr),
        marks_obtained: val.marks.trim() !== '' ? Number(val.marks) : null,
        feedback: val.feedback.trim() || undefined,
        status: val.marks.trim() !== '' ? 'GRADED' : 'PENDING',
      }));

      await api.recordGrades(selectedAssessment.id, payload);
      setGradingModalOpen(false);
      showToast('Student grades and feedbacks recorded successfully!');
      const gb = await api.getCourseGradebook(selectedCourseId);
      setGradebook(gb);
    } catch (err: any) {
      alert(err.message || 'Failed to save grades');
    } finally {
      setSavingGrades(false);
    }
  };

  const filteredStudents = gradebook?.students.filter((row) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      row.student.name.toLowerCase().includes(term) ||
      row.student.identifier.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#1B2A4A] text-white px-4 py-3 rounded shadow-lg border border-[#C59B27] flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Title & Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 rounded border border-amber-400/30 text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {role === 'student' ? 'My Academic Gradebook & Transcript' : 'Course Gradebook & Assessment Control'}
              </h2>
              <p className="text-xs text-slate-300">
                {role === 'student'
                  ? 'Consolidated evaluation records, grading history, and professor feedback'
                  : 'Manage evaluations across quizzes, mid-terms, projects, and final examinations'}
              </p>
            </div>
          </div>

          {role !== 'student' && courses.length > 0 && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCourseId || ''}
                onChange={(e) => handleSelectCourse(Number(e.target.value))}
                className="bg-[#121C33] text-white text-xs border border-slate-600 rounded px-3 py-2 font-medium focus:outline-none focus:border-amber-400"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name} ({c.section || 'Sec-A'})
                  </option>
                ))}
              </select>

              {role === 'faculty' && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-3.5 py-2 bg-[#C59B27] hover:bg-[#b0881f] text-slate-900 font-bold text-xs rounded shadow transition flex items-center gap-1.5 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Assessment</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* STUDENT VIEW */}
      {role === 'student' && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white p-12 text-center text-slate-500 text-xs rounded border border-slate-200">
              <div className="w-7 h-7 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading academic gradebook transcript...
            </div>
          ) : !studentHistory ? (
            <div className="bg-white p-8 text-center text-slate-500 text-xs rounded border border-slate-200">
              No evaluation records found.
            </div>
          ) : (
            <>
              {/* Transcript Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-300 rounded p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-purple-50 text-purple-700 rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Cumulative GPA (CGPA)
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono">
                      {studentHistory.cumulative_gpa.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ 10.0</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-300 rounded p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-700 rounded-lg">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Registered Credits
                    </div>
                    <div className="text-2xl font-bold text-slate-900 font-mono">
                      {studentHistory.total_credits} <span className="text-xs text-slate-400 font-normal">Credits</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-300 rounded p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Academic Standing
                    </div>
                    <div className="text-sm font-bold text-emerald-700 mt-1">
                      Dean's List Eligible • Good Standing
                    </div>
                  </div>
                </div>
              </div>

              {/* Course-by-Course Grade Cards */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#1B2A4A]" />
                  <span>Enrolled Courses & Assessment Breakdown</span>
                </h3>

                {studentHistory.courses.map((c) => (
                  <div
                    key={c.course_id}
                    className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-[#1B2A4A] text-white px-2 py-0.5 rounded">
                            {c.course_code}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{c.course_name}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Faculty: <strong>{c.faculty_name}</strong> • Credits: {c.credits}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Weighted Score</span>
                          <span className="font-mono text-sm font-bold text-slate-800">{c.weighted_percentage}%</span>
                        </div>
                        <div className="px-3 py-1 bg-[#1B2A4A] text-amber-300 rounded text-center border border-amber-400/40">
                          <span className="text-[9px] uppercase font-bold text-slate-300 block">Grade</span>
                          <span className="text-base font-extrabold">{c.overall_letter_grade}</span>
                        </div>
                      </div>
                    </div>

                    {/* Assessments Table */}
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="pb-2">Assessment Title</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Marks Awarded</th>
                            <th className="pb-2">Weight</th>
                            <th className="pb-2">Grade</th>
                            <th className="pb-2">Faculty Feedback</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {c.assessments.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-4 text-center text-slate-400">
                                No evaluations published yet for this course.
                              </td>
                            </tr>
                          ) : (
                            c.assessments.map((a) => (
                              <tr key={a.assessment_id} className="hover:bg-slate-50">
                                <td className="py-2.5 font-semibold text-slate-800">{a.title}</td>
                                <td className="py-2.5">
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                                    {a.assessment_type}
                                  </span>
                                </td>
                                <td className="py-2.5 text-slate-500 font-mono text-[11px]">{a.date}</td>
                                <td className="py-2.5 font-mono font-bold text-slate-900">
                                  {a.marks_obtained !== null && a.marks_obtained !== undefined ? (
                                    `${a.marks_obtained} / ${a.max_marks}`
                                  ) : (
                                    <span className="text-slate-400 font-normal">Pending</span>
                                  )}
                                </td>
                                <td className="py-2.5 text-slate-500 font-mono">{a.weightage_percent}%</td>
                                <td className="py-2.5">
                                  {a.letter_grade ? (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-extrabold rounded font-mono text-[11px]">
                                      {a.letter_grade}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 text-slate-600 max-w-xs truncate">
                                  {a.feedback || <span className="text-slate-400 italic">No notes</span>}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* FACULTY / ADMIN GRADEBOOK MATRIX */}
      {role !== 'student' && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white p-12 text-center text-slate-500 text-xs rounded border border-slate-200">
              <div className="w-7 h-7 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading course gradebook...
            </div>
          ) : !gradebook ? (
            <div className="bg-white p-8 text-center text-slate-500 text-xs rounded border border-slate-200">
              No courses or gradebook data available.
            </div>
          ) : (
            <>
              {/* Analytics Header Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 border border-slate-200 rounded shadow-sm">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Class Average</div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{gradebook.class_average}%</div>
                  <div className="text-[10px] text-slate-400 mt-1">Across all published assessments</div>
                </div>

                <div className="bg-white p-3.5 border border-slate-200 rounded shadow-sm">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Highest Score</div>
                  <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">{gradebook.highest_percentage}%</div>
                  <div className="text-[10px] text-slate-400 mt-1">Top performing student</div>
                </div>

                <div className="bg-white p-3.5 border border-slate-200 rounded shadow-sm">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assessments Active</div>
                  <div className="text-xl font-bold text-blue-700 font-mono mt-0.5">{gradebook.assessments.length}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Weighted course evaluations</div>
                </div>

                <div className="bg-white p-3.5 border border-slate-200 rounded shadow-sm">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grade Breakdown</div>
                  <div className="flex items-center gap-1.5 mt-1 font-mono text-xs">
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                      A+: {gradebook.grade_distribution['A+'] || 0}
                    </span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                      A: {gradebook.grade_distribution['A'] || 0}
                    </span>
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">
                      B+: {gradebook.grade_distribution['B+'] || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assessments Overview Bar */}
              <div className="bg-white border border-slate-300 rounded shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#1B2A4A]" />
                    <span>Course Evaluations & Weights ({gradebook.course.code})</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    Click <strong>"Grade & Feedback"</strong> on any assessment to input marks
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {gradebook.assessments.map((ass) => (
                    <div
                      key={ass.id}
                      className="border border-slate-200 rounded p-3 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="px-1.5 py-0.5 bg-[#1B2A4A] text-white text-[9px] font-bold rounded uppercase">
                            {ass.assessment_type}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{ass.date}</span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">{ass.title}</h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                          <span>Max Marks: <strong>{ass.max_marks}</strong></span>
                          <span>Weight: <strong>{ass.weightage_percent}%</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
                        {role === 'faculty' && (
                          <>
                            <button
                              onClick={() => openGradingModal(ass)}
                              className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white text-[11px] font-bold rounded flex items-center gap-1 transition"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Grade & Feedback</span>
                            </button>
                            <button
                              onClick={() => handleDeleteAssessment(ass.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete assessment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {role === 'admin' && (
                          <span className="text-[11px] text-slate-500">
                            Evaluated: <strong>{ass.grades_count} students</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student Gradebook Matrix Table */}
              <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Enrolled Students Grade Ledger ({filteredStudents.length} Students)
                    </span>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Roll No or Student..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        {gradebook.assessments.map((a) => (
                          <th key={a.id} className="py-2.5 px-3 text-center">
                            {a.title.split(' ')[0]} ({a.max_marks}m)
                          </th>
                        ))}
                        <th className="py-2.5 px-3 text-center">Total Score</th>
                        <th className="py-2.5 px-3 text-center">Final Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={gradebook.assessments.length + 4} className="py-8 text-center text-slate-400">
                            No matching students found in this course.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((row) => (
                          <tr key={row.student.id} className="hover:bg-slate-50">
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">
                              {row.student.identifier}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-800">
                              {row.student.name}
                            </td>
                            {gradebook.assessments.map((a) => {
                              const g = row.grades[String(a.id)];
                              return (
                                <td key={a.id} className="py-3 px-3 text-center font-mono">
                                  {g && g.marks_obtained !== null && g.marks_obtained !== undefined ? (
                                    <span className="font-bold text-slate-800">
                                      {g.marks_obtained}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-normal">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                              {row.percentage}%
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 bg-[#1B2A4A] text-amber-300 rounded font-mono font-extrabold text-[11px]">
                                {row.final_grade}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* CREATE ASSESSMENT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-md w-full overflow-hidden">
            <div className="bg-[#1B2A4A] text-white p-4 flex items-center justify-between border-b-2 border-[#C59B27]">
              <h3 className="font-bold text-sm">Create New Course Assessment</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAssessment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-Term Theory Exam or Unit 2 Quiz"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evaluation Type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                  >
                    <option value="QUIZ">Quiz / Class Test</option>
                    <option value="MID_TERM">Mid-Term Exam</option>
                    <option value="FINAL_EXAM">Final Examination</option>
                    <option value="PROJECT">Project / Capstone</option>
                    <option value="LAB_VIVA">Lab Practical Viva</option>
                    <option value="ASSIGNMENT">Assignment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Weight (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newWeightage}
                    onChange={(e) => setNewWeightage(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Syllabus / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Topics covered and format..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-[#1B2A4A] text-white font-bold rounded hover:bg-[#2A3E66] transition disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADE & FEEDBACK ENTRY MODAL */}
      {gradingModalOpen && selectedAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-[#1B2A4A] text-white p-4 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div>
                <h3 className="font-bold text-sm">
                  Record Marks: {selectedAssessment.title}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Maximum Marks: {selectedAssessment.max_marks} • Weight: {selectedAssessment.weightage_percent}%
                </p>
              </div>
              <button onClick={() => setGradingModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <p className="text-xs text-slate-500">
                Enter student scores and optional personalized comments. Grades (A+, A, B, etc.) are computed automatically.
              </p>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                {gradebook?.students.map((stRow) => {
                  const student = stRow.student;
                  const cur = gradeInputs[student.id] || { marks: '', feedback: '' };

                  return (
                    <div key={student.id} className="p-3 bg-white hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="w-48 shrink-0">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{student.identifier}</div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-24">
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Marks (/ {selectedAssessment.max_marks})</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={selectedAssessment.max_marks}
                            placeholder="Score"
                            value={cur.marks}
                            onChange={(e) =>
                              setGradeInputs((prev) => ({
                                ...prev,
                                [student.id]: { ...cur, marks: e.target.value },
                              }))
                            }
                            className="w-full p-1.5 border border-slate-300 rounded font-mono font-bold text-center focus:border-amber-400 focus:outline-none"
                          />
                        </div>

                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Faculty Feedback</label>
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={cur.feedback}
                            onChange={(e) =>
                              setGradeInputs((prev) => ({
                                ...prev,
                                [student.id]: { ...cur, feedback: e.target.value },
                              }))
                            }
                            className="w-full p-1.5 border border-slate-300 rounded text-xs focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGradingModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBatchGrades}
                disabled={savingGrades}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow transition flex items-center gap-1.5 text-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingGrades ? 'Saving...' : 'Save & Publish All Grades'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
