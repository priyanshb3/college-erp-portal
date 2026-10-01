import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { FacultyDirectoryPage } from './pages/FacultyDirectoryPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { ManageSlotsPage } from './pages/ManageSlotsPage';
import { CampusNoticesPage } from './pages/CampusNoticesPage';
import { StudentRosterPage } from './pages/StudentRosterPage';
import { DailySchedulePage } from './pages/DailySchedulePage';
import { FacultyAttendancePage } from './pages/FacultyAttendancePage';
import { StudentAttendancePage } from './pages/StudentAttendancePage';
import { SubmissionsPage } from './pages/SubmissionsPage';
import { CommunicationBridgePage } from './pages/CommunicationBridgePage';
import { FacultyHRPortalPage } from './pages/FacultyHRPortalPage';
import { GradebookPage } from './pages/GradebookPage';
import { AcademicCalendarPage } from './pages/AcademicCalendarPage';
import { StudentProfilePage } from './pages/StudentProfilePage';

const MainLayout: React.FC = () => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center space-y-3 text-slate-700">
        <div className="w-10 h-10 border-4 border-[#1B2A4A] border-t-[#C59B27] rounded-full animate-spin"></div>
        <div className="font-bold text-xs uppercase tracking-widest text-[#1B2A4A]">
          Loading College ERP Gateway...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        if (role === 'student') return <StudentDashboard onNavigate={setCurrentTab} />;
        if (role === 'faculty') return <FacultyDashboard onNavigate={setCurrentTab} />;
        return <AdminDashboard onNavigate={setCurrentTab} />;

      case 'student-profile':
        return <StudentProfilePage onNavigate={setCurrentTab} />;

      case 'calendar':
        return <AcademicCalendarPage onNavigate={setCurrentTab} />;

      case 'gradebook':
        return <GradebookPage onNavigate={setCurrentTab} />;

      case 'daily-schedule':
        return <DailySchedulePage onNavigate={setCurrentTab} />;

      case 'attendance':
        if (role === 'faculty' || role === 'admin') {
          return <FacultyAttendancePage onNavigate={setCurrentTab} />;
        }
        return <StudentAttendancePage onNavigate={setCurrentTab} />;

      case 'submissions':
        return <SubmissionsPage />;

      case 'communication':
        return <CommunicationBridgePage />;

      case 'book':
      case 'faculty-directory':
        return <FacultyDirectoryPage />;

      case 'my-appointments':
        return <MyAppointmentsPage />;

      case 'manage-slots':
        // Strict RBAC: faculty and admin only
        if (role === 'faculty' || role === 'admin') {
          return <ManageSlotsPage />;
        }
        return <StudentDashboard onNavigate={setCurrentTab} />;

      case 'faculty-hr':
        // Strict RBAC: faculty and admin only
        if (role === 'faculty' || role === 'admin') {
          return <FacultyHRPortalPage onNavigate={setCurrentTab} />;
        }
        return <StudentDashboard onNavigate={setCurrentTab} />;

      case 'student-roster':
        // Strict RBAC: admin only
        if (role === 'admin') {
          return <StudentRosterPage />;
        }
        return role === 'faculty' ? <FacultyDashboard onNavigate={setCurrentTab} /> : <StudentDashboard onNavigate={setCurrentTab} />;

      case 'notices':
        return <CampusNoticesPage />;

      default:
        if (role === 'student') return <StudentDashboard onNavigate={setCurrentTab} />;
        if (role === 'faculty') return <FacultyDashboard onNavigate={setCurrentTab} />;
        return <AdminDashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F2F5]">
      {/* Institutional Top Header Banner */}
      <Header
        onOpenNotices={() => setCurrentTab('notices')}
        onNavigateTab={setCurrentTab}
      />

      {/* Body Area with Sidebar and Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingCount={role === 'faculty' ? 2 : 1}
        />

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto overflow-x-hidden">
          {renderContent()}
        </main>
      </div>

      {/* Global Academic ERP Footer */}
      <footer className="bg-[#0E1726] text-slate-400 text-[11px] py-3 px-6 border-t-2 border-[#C59B27] text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-serif-erp">
            Government Institute of Technology & Science — Central Academic ERP System
          </div>
          <div className="font-mono text-slate-400 text-[10px]">
            Academic Session: 2026-27 (Odd Sem) • Status: Active & Secured
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
