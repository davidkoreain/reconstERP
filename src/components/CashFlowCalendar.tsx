import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { Transaction } from '../types';

export const CashFlowCalendar: React.FC = () => {
  const { transactions, toggleTransactionActual } = useApp();
  
  // State to manage calendar date (Active Year & Month)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // Default to June (Active Actuals month)
  const [selectedDay, setSelectedDay] = useState<number | null>(23); // Default to current day
  const [filterType, setFilterType] = useState<'All' | 'Expected' | 'Actual'>('All');

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // Get starting day of week
  const getStartDayOfWeek = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const daysCount = getDaysInMonth(currentYear, currentMonth);
  const startDayOfWeek = getStartDayOfWeek(currentYear, currentMonth);

  // Month format string
  const getMonthStr = () => `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  // Filter transactions for current month
  const monthStr = getMonthStr();
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(monthStr));

  // Calendar Days generator
  const calendarCells = [];
  // Empty slots for start offset
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysCount; d++) {
    calendarCells.push(d);
  }

  // Get transactions for a specific day
  const getDayTransactions = (day: number) => {
    const dayStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    return currentMonthTransactions.filter(t => {
      if (t.date !== dayStr) return false;
      if (filterType === 'Expected') return !t.isActual;
      if (filterType === 'Actual') return t.isActual;
      return true;
    });
  };

  // Selected Day transactions
  const activeDayTransactions = selectedDay ? getDayTransactions(selectedDay) : [];

  // Monthly stats
  const monthlyInflowExpected = currentMonthTransactions.filter(t => t.type === 'Inflow').reduce((sum, t) => sum + t.amount, 0);
  const monthlyInflowActual = currentMonthTransactions.filter(t => t.type === 'Inflow' && t.isActual).reduce((sum, t) => sum + t.amount, 0);
  const monthlyOutflowExpected = currentMonthTransactions.filter(t => t.type === 'Outflow').reduce((sum, t) => sum + t.amount, 0);
  const monthlyOutflowActual = currentMonthTransactions.filter(t => t.type === 'Outflow' && t.isActual).reduce((sum, t) => sum + t.amount, 0);

  // Format Helper
  const formatShortAmt = (val: number) => {
    if (val >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
    if (val >= 10000) return `${(val / 10000).toLocaleString()}만`;
    return val.toLocaleString();
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>자금수지 캘린더</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            일자별 자금 입출금 예정 및 집행 내역을 매칭하여 유동성 리스크를 점검합니다.
          </p>
        </div>

        {/* Month controller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'hsl(var(--bg-secondary))', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
          <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={prevMonth}><ArrowLeft size={16} /></button>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', minWidth: '80px', textAlign: 'center', fontFamily: 'Outfit' }}>
            {currentYear}년 {currentMonth}월
          </span>
          <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={nextMonth}><ArrowRight size={16} /></button>
        </div>
      </div>

      {/* Monthly Summary Statistics cards */}
      <div className="grid-cols-4" style={{ gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>총 수입 예정액</span>
          <h4 style={{ fontSize: '1.25rem', marginTop: '0.25rem', color: 'hsl(var(--text-primary))' }}>{formatShortAmt(monthlyInflowExpected)}원</h4>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>실제 수입 집행</span>
          <h4 style={{ fontSize: '1.25rem', marginTop: '0.25rem', color: 'hsl(var(--success))' }}>{formatShortAmt(monthlyInflowActual)}원</h4>
          <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>진척도: {monthlyInflowExpected ? Math.round((monthlyInflowActual / monthlyInflowExpected) * 100) : 0}%</span>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>총 지출 예정액</span>
          <h4 style={{ fontSize: '1.25rem', marginTop: '0.25rem', color: 'hsl(var(--text-primary))' }}>{formatShortAmt(monthlyOutflowExpected)}원</h4>
        </div>
        <div className="glass-panel" style={{ padding: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>실제 지출 집행</span>
          <h4 style={{ fontSize: '1.25rem', marginTop: '0.25rem', color: 'hsl(var(--danger))' }}>{formatShortAmt(monthlyOutflowActual)}원</h4>
          <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>진척도: {monthlyOutflowExpected ? Math.round((monthlyOutflowActual / monthlyOutflowExpected) * 100) : 0}%</span>
        </div>
      </div>

      {/* Main Grid: Calendar left, day details right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="grid-cols-1-2">
        {/* Left: Monthly calendar grid */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>입출금 타임라인</span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {(['All', 'Expected', 'Actual'] as const).map(type => (
                <button 
                  key={type}
                  className={`btn ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={() => setFilterType(type)}
                >
                  {type === 'All' ? '전체' : type === 'Expected' ? '집행예정' : '집행완료'}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Weekdays */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', fontWeight: 600, borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem' }}>
              <div style={{ color: 'hsl(var(--danger))' }}>일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div style={{ color: 'hsl(var(--info))' }}>토</div>
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', minHeight: '300px' }}>
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-sm)' }}></div>;
                }

                const dayTxs = getDayTransactions(day);
                const isSelected = selectedDay === day;
                const inflows = dayTxs.filter(t => t.type === 'Inflow');
                const outflows = dayTxs.filter(t => t.type === 'Outflow');

                return (
                  <div 
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'hsl(var(--bg-tertiary))',
                      border: isSelected ? '1px solid hsl(var(--brand-primary))' : '1px solid hsl(var(--border-color))',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '60px',
                      transition: 'border-color var(--transition-fast)'
                    }}
                  >
                    {/* Day number */}
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'hsl(var(--brand-primary))' : 'hsl(var(--text-primary))'
                    }}>
                      {day}
                    </span>

                    {/* Day Indicators */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.25rem' }}>
                      {inflows.length > 0 && (
                        <div style={{ 
                          fontSize: '0.55rem', 
                          padding: '0.05rem 0.2rem', 
                          borderRadius: '2px', 
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: 'hsl(var(--success))',
                          fontWeight: 600,
                          textAlign: 'right'
                        }}>
                          +{formatShortAmt(inflows.reduce((s,t) => s + t.amount, 0))}
                        </div>
                      )}
                      {outflows.length > 0 && (
                        <div style={{ 
                          fontSize: '0.55rem', 
                          padding: '0.05rem 0.2rem', 
                          borderRadius: '2px', 
                          backgroundColor: 'rgba(244, 63, 94, 0.15)',
                          color: 'hsl(var(--danger))',
                          fontWeight: 600,
                          textAlign: 'right'
                        }}>
                          -{formatShortAmt(outflows.reduce((s,t) => s + t.amount, 0))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected day details & Action panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CalendarIcon size={14} /> 상세 내역
            </span>
            <h4 style={{ fontSize: '1.15rem', marginTop: '0.15rem' }}>
              {currentYear}년 {currentMonth}월 {selectedDay}일 거래
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, overflowY: 'auto', maxHeight: '320px' }}>
            {activeDayTransactions.length > 0 ? (
              activeDayTransactions.map((tx: Transaction) => (
                <div 
                  key={tx.id}
                  style={{
                    backgroundColor: 'hsl(var(--bg-tertiary))',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tx.title}</span>
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>분류: {tx.category}</span>
                    </div>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '0.95rem',
                      color: tx.type === 'Inflow' ? 'hsl(var(--success))' : 'hsl(var(--danger))'
                    }}>
                      {tx.type === 'Inflow' ? '+' : '-'}{tx.amount.toLocaleString()}원
                    </span>
                  </div>

                  {/* Status Toggle Switcher */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    paddingTop: '0.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '0.75rem'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: tx.isActual ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>
                      {tx.isActual ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {tx.isActual ? '실제 입출금 완료' : '입출금 집행 예정'}
                    </span>
                    
                    <button 
                      className={`btn ${tx.isActual ? 'btn-secondary' : 'btn-success'}`}
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                      onClick={() => toggleTransactionActual(tx.id)}
                    >
                      <RefreshCw size={10} /> {tx.isActual ? '예정상태로 전환' : '집행완료 처리'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px', color: 'hsl(var(--text-muted))', gap: '0.5rem' }}>
                <CalendarIcon size={32} strokeWidth={1} />
                <span style={{ fontSize: '0.8rem' }}>이날 등록된 입출금 일정이 없습니다.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CashFlowCalendar;
