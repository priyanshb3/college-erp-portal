import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CommunicationMessage, Course, ThreadDetail, User } from '../types';
import { api } from '../services/api';
import {
  MessageSquare,
  Send,
  PlusCircle,
  Megaphone,
  HelpCircle,
  UserCheck,
  Search,
  Clock,
  BookOpen,
  CheckCheck,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const CommunicationBridgePage: React.FC = () => {
  const { user, role } = useAuth();
  const [threads, setThreads] = useState<CommunicationMessage[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [activeThreadDetail, setActiveThreadDetail] = useState<ThreadDetail | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Doubt Modal (Student)
  const [isDoubtModalOpen, setIsDoubtModalOpen] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number>(0);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [doubtSubject, setDoubtSubject] = useState('');
  const [doubtContent, setDoubtContent] = useState('');
  const [sendingDoubt, setSendingDoubt] = useState(false);

  // Announcement Modal (Faculty)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [annCourseId, setAnnCourseId] = useState<number>(0);
  const [annSubject, setAnnSubject] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [sendingAnn, setSendingAnn] = useState(false);

  // Reply Input
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const [threadData, courseData, facData] = await Promise.all([
        api.getMessageThreads(filterType),
        api.getAttendanceCourses(),
        api.getFacultyList(),
      ]);
      setThreads(threadData);
      setCourses(courseData);
      setFacultyList(facData);

      if (facData.length > 0 && !selectedFacultyId) {
        setSelectedFacultyId(facData[0].id);
      }
      if (courseData.length > 0 && !selectedCourseId) {
        setSelectedCourseId(courseData[0].id);
        setAnnCourseId(courseData[0].id);
      }

      if (threadData.length > 0 && !selectedThreadId) {
        setSelectedThreadId(threadData[0].id);
      }
    } catch (err) {
      console.error('Failed to load communication threads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [filterType]);

  // Load selected thread detail
  useEffect(() => {
    if (!selectedThreadId) return;
    const fetchDetail = async () => {
      setLoadingThread(true);
      try {
        const detail = await api.getThreadDetail(selectedThreadId);
        setActiveThreadDetail(detail);
      } catch (err) {
        console.error('Failed to load thread detail:', err);
      } finally {
        setLoadingThread(false);
      }
    };
    fetchDetail();
  }, [selectedThreadId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedThreadId || !activeThreadDetail) return;
    setSendingReply(true);

    try {
      const parent = activeThreadDetail.parent;
      // Receiver is the other party in direct queries
      let receiverId = undefined;
      if (parent.sender_id === user?.id) {
        receiverId = parent.receiver_id;
      } else {
        receiverId = parent.sender_id;
      }

      await api.sendMessage({
        receiver_id: receiverId,
        course_id: parent.course_id,
        subject: `Re: ${parent.subject}`,
        content: replyText,
        message_type: parent.message_type,
        parent_id: parent.id,
      });

      setReplyText('');
      // Refresh active thread detail
      const updatedDetail = await api.getThreadDetail(selectedThreadId);
      setActiveThreadDetail(updatedDetail);
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtSubject || !doubtContent || !selectedFacultyId) {
      alert('Please fill in all mandatory fields.');
      return;
    }
    setSendingDoubt(true);
    try {
      const newMsg = await api.sendMessage({
        receiver_id: selectedFacultyId,
        course_id: selectedCourseId || undefined,
        subject: doubtSubject,
        content: doubtContent,
        message_type: 'DOUBT_CLEARANCE',
      });
      setIsDoubtModalOpen(false);
      setDoubtSubject('');
      setDoubtContent('');
      await loadThreads();
      setSelectedThreadId(newMsg.id);
    } catch (err: any) {
      alert(err.message || 'Failed to send doubt');
    } finally {
      setSendingDoubt(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annSubject || !annContent || !annCourseId) {
      alert('Please complete all announcement fields.');
      return;
    }
    setSendingAnn(true);
    try {
      const newMsg = await api.postCourseAnnouncement({
        course_id: annCourseId,
        subject: annSubject,
        content: annContent,
      });
      setIsAnnouncementModalOpen(false);
      setAnnSubject('');
      setAnnContent('');
      await loadThreads();
      setSelectedThreadId(newMsg.id);
    } catch (err: any) {
      alert(err.message || 'Failed to publish announcement');
    } finally {
      setSendingAnn(false);
    }
  };

  const filteredThreads = threads.filter((t) =>
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.course?.code && t.course.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Institutional Top Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#C59B27]" />
              <h1 className="text-lg font-bold tracking-tight">
                Faculty-Student Multi-Purpose Academic Communication Bridge
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Direct academic doubt clearance threads, course circular broadcasts, and guidance consultation channel.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {role === 'student' ? (
              <button
                onClick={() => setIsDoubtModalOpen(true)}
                className="w-full md:w-auto px-4 py-2 bg-[#6B1D2F] hover:bg-[#4F1220] text-white font-bold text-xs rounded shadow flex items-center justify-center gap-2 border border-red-800"
              >
                <HelpCircle className="w-4 h-4 text-[#C59B27]" />
                <span>Ask Faculty Academic Doubt</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAnnouncementModalOpen(true)}
                className="w-full md:w-auto px-4 py-2 bg-[#C59B27] hover:bg-[#D4A936] text-[#0E1726] font-bold text-xs rounded shadow flex items-center justify-center gap-2 border border-amber-400"
              >
                <Megaphone className="w-4 h-4" />
                <span>Post Class Announcement</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Filter:</span>
            {[
              { id: 'ALL', label: 'All Messages' },
              { id: 'DOUBT_CLEARANCE', label: 'Academic Doubts' },
              { id: 'ANNOUNCEMENT', label: 'Announcements' },
              { id: 'DIRECT_QUERY', label: 'Direct Queries' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 rounded font-bold transition whitespace-nowrap ${
                  filterType === f.id
                    ? 'bg-[#1B2A4A] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search subjects or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>
        </div>
      </div>

      {/* Main Bridge Split View: Thread Inbox (Left) & Chat Conversation (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left 5 Cols: Thread List */}
        <div className="lg:col-span-5 bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#121C33] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#C59B27]">
            <h3 className="text-xs font-bold uppercase tracking-wider">Active Academic Threads</h3>
            <span className="text-[11px] text-amber-300 font-mono font-bold">
              {filteredThreads.length} Threads
            </span>
          </div>

          <div className="divide-y divide-slate-200 overflow-y-auto flex-1 max-h-[600px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading communication threads...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No conversation threads found.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = selectedThreadId === thread.id;
                const isAnn = thread.message_type === 'ANNOUNCEMENT';
                const isDoubt = thread.message_type === 'DOUBT_CLEARANCE';

                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-amber-50/70 border-l-4 border-[#C59B27]'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <img
                      src={thread.sender?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                      alt={thread.sender?.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {thread.sender?.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {thread.sender?.role === 'faculty' ? '• Faculty' : `• ${thread.sender?.identifier}`}
                          </span>
                        </div>
                        {thread.course?.code && (
                          <span className="text-[9px] font-mono font-bold bg-[#6B1D2F] text-white px-1.5 py-0.2 rounded shrink-0">
                            {thread.course.code}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-slate-800 line-clamp-1 leading-snug">
                        {thread.subject}
                      </h4>

                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                        {thread.content}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span
                          className={`font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded text-[9px] ${
                            isAnn
                              ? 'bg-purple-100 text-purple-900'
                              : isDoubt
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {thread.message_type.replace('_', ' ')}
                        </span>
                        <span>{thread.replies_count || 0} Replies</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 7 Cols: Thread View & Response Editor */}
        <div className="lg:col-span-7 bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex flex-col justify-between">
          {selectedThreadId && activeThreadDetail ? (
            <div className="flex flex-col h-full">
              {/* Thread Header */}
              <div className="bg-[#1B2A4A] text-white p-4 border-b-2 border-[#C59B27] flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeThreadDetail.parent.course && (
                      <span className="bg-[#6B1D2F] text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                        {activeThreadDetail.parent.course.code}
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-700 text-amber-300 font-bold px-2 py-0.5 rounded uppercase font-mono">
                      {activeThreadDetail.parent.message_type}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm md:text-base mt-1 text-white truncate">
                    {activeThreadDetail.parent.subject}
                  </h3>
                </div>
              </div>

              {/* Message Feed */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 max-h-[440px] bg-slate-50/50">
                {/* Parent Question / Post Bubble */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={activeThreadDetail.parent.sender?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                        alt={activeThreadDetail.parent.sender?.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#C59B27]"
                      />
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {activeThreadDetail.parent.sender?.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {activeThreadDetail.parent.sender?.role.toUpperCase()} • {activeThreadDetail.parent.sender?.identifier}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeThreadDetail.parent.created_at ? new Date(activeThreadDetail.parent.created_at).toLocaleString() : 'Recent'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                    {activeThreadDetail.parent.content}
                  </p>
                </div>

                {/* Replies Thread */}
                {activeThreadDetail.replies.map((reply) => {
                  const isSenderMe = reply.sender_id === user?.id;
                  const isFaculty = reply.sender?.role === 'faculty';

                  return (
                    <div
                      key={reply.id}
                      className={`p-3.5 rounded-lg border shadow-2xs space-y-2 ${
                        isFaculty
                          ? 'bg-amber-50/50 border-amber-200 ml-4'
                          : 'bg-white border-slate-200 ml-4'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={reply.sender?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                            alt={reply.sender?.name}
                            className="w-7 h-7 rounded-full object-cover border"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900">{reply.sender?.name}</span>
                            <span className="text-[9px] font-bold text-[#6B1D2F] ml-2 font-mono">
                              {isFaculty ? '[Faculty In-Charge]' : '[Student Response]'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {reply.created_at ? new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                        {reply.content}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      role === 'faculty'
                        ? 'Provide faculty explanation, feedback, or office guidance...'
                        : 'Reply with follow-up questions or clarifications...'
                    }
                    className="flex-1 text-xs border border-slate-300 rounded p-2.5 focus:outline-none focus:border-[#1B2A4A] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2.5 bg-[#6B1D2F] hover:bg-[#4F1220] text-white font-bold text-xs rounded shadow flex items-center gap-1.5 disabled:opacity-50 transition border border-red-800 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>{sendingReply ? 'Sending...' : 'Reply'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 m-auto space-y-2">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Select a conversation thread from the left pane to view details.</p>
              <p className="text-slate-400">You can also initiate a new academic inquiry or announcement above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Student Ask Academic Doubt Modal */}
      {isDoubtModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-[#C59B27] max-w-lg w-full overflow-hidden">
            <div className="bg-[#6B1D2F] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#C59B27]">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#C59B27]" />
                <span>Submit Academic Doubt / Consultation Request</span>
              </h3>
              <button onClick={() => setIsDoubtModalOpen(false)} className="text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDoubt} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Target Faculty / Professor</label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                >
                  {facultyList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation} - {f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Course / Subject Tag</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                >
                  <option value={0}>General Academic Consultation</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Topic / Subject Line</label>
                <input
                  type="text"
                  value={doubtSubject}
                  onChange={(e) => setDoubtSubject(e.target.value)}
                  placeholder="e.g. Clarification on Virtual Memory Page Replacement proof"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Detailed Doubt / Question</label>
                <textarea
                  rows={4}
                  value={doubtContent}
                  onChange={(e) => setDoubtContent(e.target.value)}
                  placeholder="Explain the specific concept, slide number, equation, or assignment doubt you need help with..."
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDoubtModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingDoubt}
                  className="px-4 py-1.5 bg-[#6B1D2F] text-white font-bold rounded shadow hover:bg-[#4F1220] transition disabled:opacity-50"
                >
                  {sendingDoubt ? 'Submitting...' : 'Send to Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty Post Class Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-[#C59B27] max-w-lg w-full overflow-hidden">
            <div className="bg-[#1B2A4A] text-white px-5 py-3.5 flex items-center justify-between border-b-2 border-[#C59B27]">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#C59B27]" />
                <span>Publish Course-Wide Broadcast Announcement</span>
              </h3>
              <button onClick={() => setIsAnnouncementModalOpen(false)} className="text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Target Course / Class</label>
                <select
                  value={annCourseId}
                  onChange={(e) => setAnnCourseId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.name} ({c.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Announcement Subject</label>
                <input
                  type="text"
                  value={annSubject}
                  onChange={(e) => setAnnSubject(e.target.value)}
                  placeholder="e.g. Extra Hands-on Session Scheduled in Systems Lab 2"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Announcement Notice Content</label>
                <textarea
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Type official notice details, venue instructions, materials to bring..."
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingAnn}
                  className="px-4 py-1.5 bg-[#1B2A4A] text-white font-bold rounded shadow hover:bg-[#2D3F66] transition disabled:opacity-50"
                >
                  {sendingAnn ? 'Broadcasting...' : 'Broadcast to Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
