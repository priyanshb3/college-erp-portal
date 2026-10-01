import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Assignment, Course, Submission } from '../types';
import { api } from '../services/api';
import {
  FileCheck,
  Calendar,
  Clock,
  PlusCircle,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  Award,
  MessageSquareQuote,
  Eye,
  BookOpen,
  Filter
} from 'lucide-react';

export const SubmissionsPage: React.FC = () => {
  const { user, role } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Faculty Create Assignment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCourseId, setNewCourseId] = useState<number>(0);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMarks, setNewMarks] = useState(50);
  const [newFormat, setNewFormat] = useState('PDF Report + GitHub Repo URL');
  const [creating, setCreating] = useState(false);

  // Faculty Submissions Review Modal
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState<Assignment | null>(null);
  const [submissionsList, setSubmissionsList] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading Modal
  const [selectedSubForGrade, setSelectedSubForGrade] = useState<Submission | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [grading, setGrading] = useState(false);

  // Student Submit Work Modal
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<Assignment | null>(null);
  const [submitText, setSubmitText] = useState('');
  const [submitFileName, setSubmitFileName] = useState('');
  const [submitRepoUrl, setSubmitRepoUrl] = useState('');
  const [submittingWork, setSubmittingWork] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assigns, courseList] = await Promise.all([
        api.getAssignments(),
        api.getAttendanceCourses(),
      ]);
      setAssignments(assigns);
      setCourses(courseList);
      if (courseList.length > 0 && !newCourseId) {
        setNewCourseId(courseList[0].id);
      }
    } catch (err) {
      console.error('Failed to load submissions page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDueDate || !newCourseId) {
      alert('Please fill in all mandatory fields.');
      return;
    }
    setCreating(true);
    try {
      await api.createAssignment({
        course_id: newCourseId,
        title: newTitle,
        description: newDesc,
        due_date: newDueDate,
        total_marks: newMarks,
        submission_format: newFormat,
      });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const openReviewModal = async (assign: Assignment) => {
    setSelectedAssignmentForReview(assign);
    setLoadingSubmissions(true);
    try {
      const subs = await api.getAssignmentSubmissions(assign.id);
      setSubmissionsList(subs);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubForGrade) return;
    setGrading(true);
    try {
      await api.gradeSubmission(selectedSubForGrade.id, {
        marks_awarded: Number(gradeMarks),
        faculty_feedback: gradeFeedback,
      });
      setSelectedSubForGrade(null);
      // refresh submissions in review modal
      if (selectedAssignmentForReview) {
        const subs = await api.getAssignmentSubmissions(selectedAssignmentForReview.id);
        setSubmissionsList(subs);
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit grade');
    } finally {
      setGrading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForSubmit) return;
    setSubmittingWork(true);
    try {
      await api.submitAssignment(selectedAssignmentForSubmit.id, {
        submission_text: submitText,
        attachment_name: submitFileName || `${user?.identifier}_Solution.pdf`,
        attachment_url: submitRepoUrl || 'https://github.com/priyansh-bansal/course-solution',
      });
      setSelectedAssignmentForSubmit(null);
      setSubmitText('');
      setSubmitFileName('');
      setSubmitRepoUrl('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit assignment');
    } finally {
      setSubmittingWork(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#C59B27]" />
              <h1 className="text-lg font-bold tracking-tight">
                {role === 'faculty' ? 'Assignment Task & Submission Evaluation Portal' : 'Student Assignments & Submission Gateway'}
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Course project submissions, laboratory practical exercises, grading rubrics, and formal feedback.
            </p>
          </div>

          {role === 'faculty' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 bg-[#6B1D2F] hover:bg-[#4F1220] text-white font-bold text-xs rounded shadow flex items-center gap-1.5 transition border border-red-800"
            >
              <PlusCircle className="w-4 h-4 text-[#C59B27]" />
              <span>Create New Assignment</span>
            </button>
          )}
        </div>
      </div>

      {/* Assignment List Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white border rounded">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white border rounded space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No active assignments posted at this time.</p>
          </div>
        ) : (
          assignments.map((assign) => {
            const isStudent = role === 'student';
            const mySub = assign.my_submission;
            const isGraded = mySub?.status === 'GRADED';
            const isSubmitted = mySub?.status === 'SUBMITTED' || isGraded;

            return (
              <div
                key={assign.id}
                className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden hover:border-[#1B2A4A] transition"
              >
                <div className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold bg-[#6B1D2F] text-white px-2 py-0.5 rounded">
                        {assign.course?.code}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {assign.course?.name}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                        Max: {assign.total_marks} Marks
                      </span>
                    </div>

                    <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                      {assign.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {assign.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-mono font-medium">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Deadline: <strong className="text-slate-800">{assign.due_date}</strong></span>
                      </span>
                      <span>•</span>
                      <span>Format: <strong>{assign.submission_format}</strong></span>
                      {assign.faculty && (
                        <>
                          <span>•</span>
                          <span>Assigned by: <strong>{assign.faculty.name}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Status / Action Pillar */}
                  <div className="w-full md:w-auto flex flex-col items-end gap-2 shrink-0">
                    {role === 'faculty' ? (
                      <div className="text-right space-y-2">
                        <div className="text-xs font-mono font-bold text-slate-700">
                          Submissions Received: <strong className="text-emerald-700">{assign.submissions_count}</strong>
                        </div>
                        <button
                          onClick={() => openReviewModal(assign)}
                          className="w-full px-3.5 py-1.5 bg-[#1B2A4A] hover:bg-[#2D3F66] text-white font-bold text-xs rounded shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C59B27]" />
                          <span>Review Submissions & Grade</span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full md:w-auto text-right space-y-2">
                        {isGraded ? (
                          <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded text-right">
                            <div className="flex items-center justify-end gap-1 text-emerald-800 font-extrabold text-xs">
                              <Award className="w-4 h-4 text-emerald-600" />
                              <span>Graded: {mySub.marks_awarded} / {assign.total_marks}</span>
                            </div>
                            {mySub.faculty_feedback && (
                              <p className="text-[11px] text-slate-600 mt-1 italic max-w-xs text-left">
                                "{mySub.faculty_feedback}"
                              </p>
                            )}
                          </div>
                        ) : isSubmitted ? (
                          <div className="bg-amber-50 border border-amber-300 px-3 py-1.5 rounded text-amber-900 font-bold text-xs flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Submitted — Awaiting Faculty Review</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAssignmentForSubmit(assign);
                              setSubmitText('');
                              setSubmitFileName(`${user?.identifier}_${assign.course?.code}_Solution.pdf`);
                            }}
                            className="w-full px-4 py-2 bg-[#6B1D2F] hover:bg-[#4F1220] text-white font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 border border-red-800"
                          >
                            <Upload className="w-4 h-4 text-[#C59B27]" />
                            <span>Submit Solution</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Faculty Create Assignment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-[#C59B27] max-w-lg w-full overflow-hidden">
            <div className="bg-[#1B2A4A] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#C59B27]">
              <h3 className="font-bold text-sm">Post New Course Assignment or Laboratory Task</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-300 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Select Course / Subject</label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Assignment 3: Distributed Hash Table & Chord Protocol"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Description & Problem Statement</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detailed specifications, simulation requirements, and test cases..."
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Submission Deadline</label>
                  <input
                    type="text"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="2026-09-30 23:59"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={newMarks}
                    onChange={(e) => setNewMarks(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Allowed Submission Format</label>
                <input
                  type="text"
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value)}
                  placeholder="PDF / GitHub Repo URL / Zip"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-[#6B1D2F] text-white font-bold rounded shadow hover:bg-[#4F1220] transition disabled:opacity-50"
                >
                  {creating ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Submissions Review Modal */}
      {selectedAssignmentForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-[#1B2A4A] max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-[#1B2A4A] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#C59B27] shrink-0">
              <div>
                <h3 className="font-bold text-sm">Submissions Review: {selectedAssignmentForReview.title}</h3>
                <p className="text-[11px] text-amber-300 mt-0.5">
                  Course: {selectedAssignmentForReview.course?.name} • Max Marks: {selectedAssignmentForReview.total_marks}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignmentForReview(null)}
                className="text-slate-300 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingSubmissions ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading student submissions...</div>
              ) : submissionsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No submissions uploaded yet.</div>
              ) : (
                submissionsList.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded border border-slate-200 bg-slate-50/70 hover:bg-white transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{sub.student?.name}</span>
                        <span className="font-mono text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded border">
                          {sub.student?.identifier}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-1 italic line-clamp-2">
                        "{sub.submission_text || 'No solution remarks attached.'}"
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1 font-mono">
                        <span>File: <strong className="text-slate-700">{sub.attachment_name}</strong></span>
                        {sub.attachment_url && (
                          <a
                            href={sub.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:underline flex items-center gap-0.5"
                          >
                            <span>Open URL</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {sub.status === 'GRADED' ? (
                        <div className="space-y-1">
                          <span className="bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded border border-emerald-300 text-xs">
                            Score: {sub.marks_awarded} / {selectedAssignmentForReview.total_marks}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedSubForGrade(sub);
                              setGradeMarks(sub.marks_awarded || 0);
                              setGradeFeedback(sub.faculty_feedback || '');
                            }}
                            className="block text-[10px] text-blue-700 hover:underline text-right"
                          >
                            Edit Score
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedSubForGrade(sub);
                            setGradeMarks(selectedAssignmentForReview.total_marks);
                            setGradeFeedback('Good work, verified test cases.');
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Grade Work</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {selectedSubForGrade && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-[#C59B27] max-w-sm w-full overflow-hidden">
            <div className="bg-[#1B2A4A] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#C59B27]">
              <h4 className="font-bold text-xs">Grade Submission: {selectedSubForGrade.student?.name}</h4>
              <button onClick={() => setSelectedSubForGrade(null)} className="text-slate-300 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="p-4 space-y-3 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Marks Awarded (Max: {selectedAssignmentForReview?.total_marks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedAssignmentForReview?.total_marks || 100}
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono text-sm font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Faculty Feedback & Remarks</label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Constructive feedback, analysis accuracy, improvements needed..."
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedSubForGrade(null)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grading}
                  className="px-4 py-1.5 bg-emerald-700 text-white font-bold rounded shadow hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  {grading ? 'Saving...' : 'Save & Post Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Submit Work Modal */}
      {selectedAssignmentForSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-[#C59B27] max-w-md w-full overflow-hidden">
            <div className="bg-[#6B1D2F] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#C59B27]">
              <div>
                <h3 className="font-bold text-sm">Submit Solution: {selectedAssignmentForSubmit.title}</h3>
                <p className="text-[11px] text-amber-200 mt-0.5">
                  Max Marks: {selectedAssignmentForSubmit.total_marks} • Due: {selectedAssignmentForSubmit.due_date}
                </p>
              </div>
              <button onClick={() => setSelectedAssignmentForSubmit(null)} className="text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Solution Notes & Implementation Summary
                </label>
                <textarea
                  rows={3}
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  placeholder="Explain algorithm design, architecture decisions, results achieved..."
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Code Repository URL / Live Colab Link
                </label>
                <input
                  type="url"
                  value={submitRepoUrl}
                  onChange={(e) => setSubmitRepoUrl(e.target.value)}
                  placeholder="https://github.com/your-username/assignment-repo"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Document / Report File Name
                </label>
                <input
                  type="text"
                  value={submitFileName}
                  onChange={(e) => setSubmitFileName(e.target.value)}
                  placeholder={`${user?.identifier}_Report.pdf`}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAssignmentForSubmit(null)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWork}
                  className="px-4 py-1.5 bg-[#6B1D2F] text-white font-bold rounded shadow hover:bg-[#4F1220] transition disabled:opacity-50"
                >
                  {submittingWork ? 'Uploading...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
