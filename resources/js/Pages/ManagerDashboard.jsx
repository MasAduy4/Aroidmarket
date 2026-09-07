import { useMemo, useState } from 'react'
import { router } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react'
import Sidebar from '@/Components/ManagerDashboard/Sidebar';
import Header from '@/Components/ManagerDashboard/Header';
import PmsView from '@/Components/ManagerDashboard/PmsView';
import CustomerServiceView from '@/Components/ManagerDashboard/CustomerServiceView';
import GreenhouseView from '@/Components/ManagerDashboard/GreenhouseView';
import FinanceView from '@/Components/ManagerDashboard/FinanceView';

export default function Page(props) {
  const { 
    user, 
    stats, 
    customerServiceData, 
    managerMessages = [],
    jobdeskData,
    jobdeskUsers = [],
    jobdeskSummary = {},
    laporanPanen, 
    laporanAktivitas,
    greenhousePlants,
    greenhouseStats,
    financial,
    financeBreakdown,
    monthlyRevenueData,
    endorseCandidates = [],
    sheets = {} // 1. Destruktur prop sheets dari Controller
  } = props;

  const [active, setActive] = useState('pms')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      router.post('/logout');
    }
  };

  const content = useMemo(() => {
    switch (active) {
      case 'pms':
        return (
          <PmsView 
            stats={stats} 
            customerServiceData={customerServiceData} 
            managerMessages={managerMessages}
            jobdeskData={jobdeskData}
            jobdesksData={jobdeskData}
            jobdeskUsers={jobdeskUsers}
            jobdeskSummary={jobdeskSummary}
            financeBreakdown={financeBreakdown}
            monthlyRevenueData={monthlyRevenueData}
            endorseCandidates={endorseCandidates}
          />
        );
      case 'cs':
        return <CustomerServiceView customerServiceData={customerServiceData} stats={stats} />;
      case 'greenhouse':
        return (
          <GreenhouseView 
            greenhousePlants={greenhousePlants} 
            greenhouseStats={greenhouseStats} 
            laporanPanen={laporanPanen} 
            laporanAktivitas={laporanAktivitas} 
          />
        );
      case 'finance':
        return (
        <FinanceView 
        financial={financial} 
        sheets={sheets} 
        monthlyRevenueData={monthlyRevenueData} 
        stats={stats} 
        endorseCandidates={endorseCandidates} 
      /> 
      );
      default:
        return (
          <PmsView 
            stats={stats} 
            customerServiceData={customerServiceData} 
            managerMessages={managerMessages}
            jobdeskData={jobdeskData}
            jobdesksData={jobdeskData}
            jobdeskUsers={jobdeskUsers}
            jobdeskSummary={jobdeskSummary}
            financeBreakdown={financeBreakdown}
            monthlyRevenueData={monthlyRevenueData}
            endorseCandidates={endorseCandidates}
          />
        );
    }
  }, [active, stats, customerServiceData, managerMessages, jobdeskData, jobdeskUsers, jobdeskSummary, laporanPanen, laporanAktivitas, greenhousePlants, greenhouseStats, financial, financeBreakdown, monthlyRevenueData, endorseCandidates, sheets]); // 3. Tambahkan sheets ke dependency array

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={setActive}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        user={user}
        handleLogout={handleLogout}
      />
      <div className="main-shell">
        <Header
          active={active}
          setOpen={setSidebarOpen}
          user={user}
        />
        <main className="dashboard-main">
          <div className="welcome-row">
            <div>
              <p className="welcome-kicker">SELAMAT DATANG KEMBALI, {user?.name?.toUpperCase() || 'MANAGER'}</p>
              <h2>Good morning, let&apos;s grow.</h2>
            </div>
            <div className="date-chip">
              <CalendarDays size={16} />
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          {content}
        </main>
      </div>
      {sidebarOpen && <button className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Tutup sidebar" />}
    </div>
  )
}