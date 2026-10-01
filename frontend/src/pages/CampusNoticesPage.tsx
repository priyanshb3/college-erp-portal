import React, { useState, useEffect } from 'react';
import { Notice } from '../types';
import { api } from '../services/api';
import {
  Bell,
  Pin,
  Calendar,
  Building2,
  AlertCircle,
  FileText,
  Search
} from 'lucide-react';

export const CampusNoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadNotices = async () => {
    try {
      setLoading(true);
      const data = await api.getNotices();
      setNotices(data);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const filteredNotices = notices.filter((n) => {
    const matchesCat = categoryFilter === 'ALL' || n.category === categoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.posted_by.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
        <div className="bg-[#1B2A4A] text-white p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#C59B27]">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-[#C59B27]" />
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-tight">
                Official Campus Notices, Circulars & Academic Orders
              </h2>
              <p className="text-xs text-slate-300">
                Official announcements from Office of the Dean (Academics) & Department Chairs
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars by subject, keyword, or authority..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B2A4A] focus:outline-hidden font-semibold"
            >
              <option value="ALL">All Categories</option>
              <option value="ACADEMIC">Academic Directives</option>
              <option value="EXAM">Examination & Reviews</option>
              <option value="FACULTY">Faculty Guidelines</option>
              <option value="URGENT">Urgent Alerts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading circulars...</div>
      ) : filteredNotices.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border rounded">
          No notices found matching the selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((n) => (
            <div
              key={n.id}
              className={`bg-white border rounded-lg shadow-2xs overflow-hidden transition-all hover:shadow-md ${
                n.is_pinned ? 'border-[#C59B27] ring-1 ring-[#C59B27]/40' : 'border-slate-300'
              }`}
            >
              {/* Header */}
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {n.is_pinned && (
                    <span className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
                      <Pin className="w-3 h-3 text-[#C59B27]" /> PINNED
                    </span>
                  )}
                  <span className="bg-red-50 text-[#6B1D2F] border border-red-200 text-[10px] font-bold px-2 py-0.2 rounded uppercase font-mono">
                    {n.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{n.date}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{n.title}</h3>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded border border-slate-100">
                  {n.content}
                </p>
                <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
                  <span className="font-semibold text-slate-700">Issued by: {n.posted_by}</span>
                  <span className="text-[10px] text-slate-400">Authenticated via ERP Registry</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
