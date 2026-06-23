import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import PropertyManager from './components/PropertyManager';
import CorporateLedger from './components/CorporateLedger';
import ExpenseManager from './components/ExpenseManager';
import CashFlowCalendar from './components/CashFlowCalendar';
import InvestorSettlement from './components/InvestorSettlement';
import ERPApproval from './components/ERPApproval';
import DocOCRHub from './components/DocOCRHub';

import { 
  LayoutDashboard,
  Building2,
  Calendar,
  CreditCard,
  Users,
  FileCheck,
  CloudLightning,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Landmark,
  LogOut
} from 'lucide-react';

export const App: React.FC = () => {
  const { currentUser, setCurrentUser, users } = useApp();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'properties' | 'corporations' | 'expenses' | 'calendar' | 'investors' | 'approvals' | 'ocr'>('dashboard');

  const navigationItems = [
    { id: 'dashboard', label: '종합 대시보드', icon: <LayoutDashboard size={18} /> },
    { id: 'properties', label: '부동산 자산목록', icon: <Building2 size={18} /> },
    { id: 'corporations', label: '법인 대장 관리', icon: <Landmark size={18} /> },
    { id: 'calendar', label: '자금수지 캘린더', icon: <Calendar size={18} /> },
    { id: 'expenses', label: '비용 및 지출관리', icon: <CreditCard size={18} /> },
    { id: 'investors', label: '투자자 수익정산', icon: <Users size={18} /> },
    { id: 'approvals', label: 'ERP 전자결재함', icon: <FileCheck size={18} /> },
    { id: 'ocr', label: '드라이브 & OCR', icon: <CloudLightning size={18} /> },
  ] as const;

  // Render view based on activeTab
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'properties':
        return <PropertyManager />;
      case 'corporations':
        return <CorporateLedger />;
      case 'expenses':
        return <ExpenseManager />;
      case 'calendar':
        return <CashFlowCalendar />;
      case 'investors':
        return <InvestorSettlement />;
      case 'approvals':
        return <ERPApproval />;
      case 'ocr':
        return <DocOCRHub />;
      default:
        return <Dashboard />;
    }
  };

  const getTabLabel = () => {
    const item = navigationItems.find(n => n.id === activeTab);
    return item ? item.label : '대시보드';
  };

  return (
    <div className="app-container">
      {/* 1. Sidebar Panel */}
      <aside className="sidebar">
        {/* Brand/Company details */}
        <div style={{ padding: '1.75rem 1.5rem', borderBottom: '1px solid hsl(var(--border-color))' }}>
          <h1 className="brand-font" style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              background: 'linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-secondary)))',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 800
            }}>
              P
            </span>
            태평양 자산관리
          </h1>
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.65rem' }}>
            <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '0.15rem 0.45rem' }}>
              회생계획 인가안 수행중
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navigationItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  border: '1px solid transparent',
                  borderColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'white' : 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ color: isActive ? 'hsl(var(--brand-primary))' : 'inherit' }}>
                  {item.icon}
                </div>
                {item.label}
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'hsl(var(--brand-primary))' }} />}
              </button>
            );
          })}
        </nav>

        {/* Active Role status block */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid hsl(var(--border-color))',
          backgroundColor: 'rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'hsl(var(--success))', fontWeight: 600 }}>
            <ShieldCheck size={14} /> 보안 접속 세션 활성화
          </div>
          <p style={{ color: 'hsl(var(--text-muted))', lineHeight: '1.3' }}>
            내부 관계자 전용 ERP망입니다. 모든 승인 로그는 법원 회생감독 대장에 기록됩니다.
          </p>
        </div>
      </aside>

      {/* 2. Main content container */}
      <main className="main-content">
        {/* Top Header bar */}
        <header className="header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>{getTabLabel()}</h2>

          {/* User selector + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <UserCheck size={14} /> ERP 계정 전환:
            </span>

            <select
              className="form-select"
              style={{
                padding: '0.35rem 1.75rem 0.35rem 0.75rem',
                fontSize: '0.75rem',
                width: 'auto',
                backgroundColor: 'hsl(var(--bg-tertiary))',
                borderRadius: '4px',
                border: '1px solid hsl(var(--border-color))'
              }}
              value={currentUser.id}
              onChange={(e) => {
                const found = users.find(u => u.id === e.target.value);
                if (found) setCurrentUser(found);
              }}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.position})</option>
              ))}
            </select>

            <button
              onClick={signOut}
              title="로그아웃"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                backgroundColor: 'transparent',
                border: '1px solid hsl(var(--border-color))',
                borderRadius: '4px',
                color: 'hsl(var(--text-secondary))',
                cursor: 'pointer',
                fontSize: '0.75rem',
                transition: 'all 0.15s',
              }}
            >
              <LogOut size={13} /> 로그아웃
            </button>
          </div>
        </header>

        {/* View container */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
