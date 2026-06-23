import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  TrendingUp, 
  FileCheck, 
  Wallet, 
  ArrowUpRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { properties, transactions, approvalItems, expenses } = useApp();

  // Financial Calculations
  const totalValuation = properties.reduce((sum, p) => sum + p.valuation, 0);
  const totalMortgage = properties.reduce((sum, p) => sum + p.mortgageAmount, 0);
  
  // June 2026 Cashflows (Actuals)
  const juneTxs = transactions.filter(t => t.date.startsWith('2026-06'));
  const actualInflow = juneTxs.filter(t => t.type === 'Inflow' && t.isActual).reduce((sum, t) => sum + t.amount, 0);
  const actualOutflow = juneTxs.filter(t => t.type === 'Outflow' && t.isActual).reduce((sum, t) => sum + t.amount, 0);

  // July 2026 Cashflows (Projected)
  const julyTxs = transactions.filter(t => t.date.startsWith('2026-07'));
  const projectedInflow = julyTxs.filter(t => t.type === 'Inflow').reduce((sum, t) => sum + t.amount, 0);
  const projectedOutflow = julyTxs.filter(t => t.type === 'Outflow').reduce((sum, t) => sum + t.amount, 0);

  // Pending Approvals
  const pendingApprovalsCount = approvalItems.filter(a => a.status === 'Pending').length;

  // Rehabilitation Debt stats
  const totalRehabDebt = 850000000; // Original Approved Rehab Debt
  const paidRehabDebt = expenses
    .filter(e => e.category === 'RehabDebt' && e.isApproved)
    .reduce((sum, e) => sum + e.amount, 0);
  const debtRepaymentRatio = totalRehabDebt > 0 ? Math.round((paidRehabDebt / totalRehabDebt) * 100) : 0;

  // Helper for computing responsive SVG bar metrics
  const getBarMetrics = (amount: number) => {
    const maxVal = 150000000; // 1.5억
    const height = maxVal > 0 ? Math.min(140, (amount / maxVal) * 140) : 0;
    const y = 170 - height;
    return { y, height };
  };

  const juneInflowMetrics = getBarMetrics(actualInflow);
  const juneOutflowMetrics = getBarMetrics(actualOutflow);
  const julyInflowMetrics = getBarMetrics(projectedInflow);
  const julyOutflowMetrics = getBarMetrics(projectedOutflow);

  // Formatting helper
  const formatKRW = (value: number) => {
    if (value >= 100000000) {
      const eok = Math.floor(value / 100000000);
      const man = Math.floor((value % 100000000) / 10000);
      return `${eok}억 ${man > 0 ? man + '만' : ''}원`;
    }
    return `${value.toLocaleString()}원`;
  };

  // Timeline Steps for Rehabilitation
  const rehabStages = [
    { title: '회생개시 신청', date: '2025-10-15', desc: '서울회생법원 신청서 접수', status: 'completed' },
    { title: '자산보전/중지명령', date: '2025-10-22', desc: '강제집행 금지 및 임시 보전', status: 'completed' },
    { title: '채권신고 및 조사', date: '2026-01-10', desc: '회생채권 목록 검토 및 확정', status: 'completed' },
    { title: '회생계획안 인가', date: '2026-04-18', desc: '관계인집회 개최 및 법원 인가 결정', status: 'completed' },
    { title: '회생계획 수행 (현재)', date: '진행중', desc: '부동산 자산 매각 및 임대수익 변제', status: 'active' },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title & Introduction */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>종합 모니터링 대시보드</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
          회생계획 인가에 따른 부동산 보유 현황, 자금수지 예측 및 결제 현황을 실시간으로 관리합니다.
        </p>
      </div>

      {/* KPI Section */}
      <div className="grid-cols-4">
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'hsl(var(--brand-primary))' }}>
            <Building2 size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>부동산 자산 총 가치</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{formatKRW(totalValuation)}</h3>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>보유 물건수: {properties.length}개소</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'hsl(var(--danger))' }}>
            <Wallet size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>총 담보대출 (회생담보)</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{formatKRW(totalMortgage)}</h3>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>LTV 평균: {Math.round((totalMortgage / totalValuation) * 100)}%</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'hsl(var(--success))' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>6월 실제 당기 순자금</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{formatKRW(actualInflow - actualOutflow)}</h3>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '0.15rem', marginTop: '0.15rem' }}>
              <ArrowUpRight size={12} /> 수지 흑자 유지중
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'hsl(var(--warning))' }}>
            <FileCheck size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>ERP 미결재 서류</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{pendingApprovalsCount}건</h3>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>검토/결재 대기 중 문서</p>
          </div>
        </div>
      </div>

      {/* Row 2: Rehabilitation Roadmap & Debt Repayment Ratio */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="grid-cols-1-2">
        {/* Left: Rehab Debt repayment status */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>회생 채무 상환 진척도</h4>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem' }}>총 확정 회생채무 중 변제 완료 비중</p>
          </div>

          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem 0' }}>
            <svg width="160" height="160" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--bg-tertiary))" strokeWidth="8" />
              {/* Progress Indicator */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="none" 
                stroke="url(#gradient-success)" 
                strokeWidth="8" 
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - debtRepaymentRatio / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--brand-primary))" />
                  <stop offset="100%" stopColor="hsl(var(--success))" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Outfit' }}>{debtRepaymentRatio}%</span>
              <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))', marginTop: '-0.25rem' }}>상환완료</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>총 인가 채무액:</span>
              <span style={{ fontWeight: 600 }}>{formatKRW(totalRehabDebt)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>누적 상환액:</span>
              <span style={{ fontWeight: 600, color: 'hsl(var(--success))' }}>{formatKRW(paidRehabDebt)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--text-secondary))' }}>잔존 채무액:</span>
              <span style={{ fontWeight: 600, color: 'hsl(var(--danger))' }}>{formatKRW(totalRehabDebt - paidRehabDebt)}</span>
            </div>
          </div>
        </div>

        {/* Right: Timeline Progress */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>회생절차 진행 로드맵</h4>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem' }}>Pacific Asset Management 회생 일정 실시간 트래킹</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem' }}>
            {/* Timeline Line */}
            <div style={{ 
              position: 'absolute', 
              top: '8px', 
              bottom: '8px', 
              left: '5px', 
              width: '2px', 
              backgroundColor: 'hsl(var(--border-color))' 
            }} />

            {rehabStages.map((stage, idx) => (
              <div key={idx} style={{ position: 'relative', display: 'flex', gap: '1.25rem' }}>
                {/* Stage Bullet */}
                <div style={{
                  position: 'absolute',
                  left: '-20px',
                  top: '5px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: stage.status === 'completed' ? 'hsl(var(--success))' : 'hsl(var(--warning))',
                  boxShadow: stage.status === 'active' ? '0 0 10px hsl(var(--warning))' : 'none',
                  border: '2px solid hsl(var(--bg-secondary))',
                  zIndex: 2
                }} />

                {/* Stage Details */}
                <div style={{ flex: 1, paddingBottom: idx === rehabStages.length - 1 ? 0 : '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: '0.9rem',
                      color: stage.status === 'completed' ? 'hsl(var(--text-primary))' : 'hsl(var(--warning))' 
                    }}>
                      {stage.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{stage.date}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Financial Chart & Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="grid-cols-1-2">
        {/* Left: Financial Cashflow Chart (Interactive visual representation) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>월별 수지 현황 및 예측</h4>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem' }}>6월 실제 집행 수지 vs 7월 예상 수지 비교</p>
          </div>

          {/* Premium Visual SVG Chart */}
          <div style={{ flex: 1, minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <svg viewBox="0 0 400 200" width="100%" height="220" style={{ overflow: 'visible' }}>
              {/* Horizontal Gridlines */}
              <line x1="40" y1="30" x2="380" y2="30" stroke="hsl(var(--border-color))" strokeDasharray="3 3" />
              <line x1="40" y1="80" x2="380" y2="80" stroke="hsl(var(--border-color))" strokeDasharray="3 3" />
              <line x1="40" y1="130" x2="380" y2="130" stroke="hsl(var(--border-color))" strokeDasharray="3 3" />
              <line x1="40" y1="170" x2="380" y2="170" stroke="hsl(var(--border-color))" />

              {/* Y Axis Labels */}
              <text x="30" y="35" fill="hsl(var(--text-muted))" fontSize="8" textAnchor="end">1.5억</text>
              <text x="30" y="85" fill="hsl(var(--text-muted))" fontSize="8" textAnchor="end">1.0억</text>
              <text x="30" y="135" fill="hsl(var(--text-muted))" fontSize="8" textAnchor="end">5,000만</text>
              <text x="30" y="175" fill="hsl(var(--text-muted))" fontSize="8" textAnchor="end">0</text>

              {/* 6월 Actual Inflow / Outflow Bars */}
              <rect x="100" y={juneInflowMetrics.y} width="24" height={juneInflowMetrics.height} rx="3" fill="url(#gradient-inflow)" />
              <rect x="130" y={juneOutflowMetrics.y} width="24" height={juneOutflowMetrics.height} rx="3" fill="url(#gradient-outflow)" />

              {/* 7월 Projected Inflow / Outflow Bars */}
              <rect x="250" y={julyInflowMetrics.y} width="24" height={julyInflowMetrics.height} rx="3" fill="url(#gradient-inflow-proj)" opacity="0.6" stroke="hsl(var(--success))" strokeDasharray="2 2" />
              <rect x="280" y={julyOutflowMetrics.y} width="24" height={julyOutflowMetrics.height} rx="3" fill="url(#gradient-outflow-proj)" opacity="0.6" stroke="hsl(var(--danger))" strokeDasharray="2 2" />

              {/* X Axis Labels */}
              <text x="127" y="190" fill="hsl(var(--text-primary))" fontSize="10" fontWeight="600" textAnchor="middle">6월 실적</text>
              <text x="277" y="190" fill="hsl(var(--text-primary))" fontSize="10" fontWeight="600" textAnchor="middle">7월 예측</text>

              {/* Gradients Definitions */}
              <defs>
                <linearGradient id="gradient-inflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" />
                  <stop offset="100%" stopColor="rgba(16, 185, 129, 0.2)" />
                </linearGradient>
                <linearGradient id="gradient-outflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--danger))" />
                  <stop offset="100%" stopColor="rgba(244, 63, 94, 0.2)" />
                </linearGradient>
                <linearGradient id="gradient-inflow-proj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--info))" />
                  <stop offset="100%" stopColor="rgba(59, 130, 246, 0.2)" />
                </linearGradient>
                <linearGradient id="gradient-outflow-proj" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--warning))" />
                  <stop offset="100%" stopColor="rgba(245, 158, 11, 0.2)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Chart Legends */}
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'hsl(var(--success))' }}></span>
              실제 수입 (Inflow)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'hsl(var(--danger))' }}></span>
              실제 지출 (Outflow)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', border: '1px dashed hsl(var(--success))', backgroundColor: 'rgba(59,130,246,0.3)' }}></span>
              예상 수입 (Proj Inflow)
            </span>
          </div>
        </div>

        {/* Right: Recent activity logs */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>최근 수지 입출금 내역</h4>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem' }}>통합 통장 거래 기록</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, maxHeight: '250px' }}>
            {transactions.slice(0, 5).map(tx => (
              <div 
                key={tx.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'hsl(var(--bg-tertiary))',
                  border: '1px solid hsl(var(--border-color))'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tx.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                    <span>{tx.date}</span>
                    <span>•</span>
                    <span>{tx.category}</span>
                    <span>•</span>
                    <span className={tx.isActual ? 'badge badge-success' : 'badge badge-warning'} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                      {tx.isActual ? '집행완료' : '예정'}
                    </span>
                  </div>
                </div>
                <span 
                  style={{ 
                    fontWeight: 700, 
                    fontSize: '0.9rem', 
                    color: tx.type === 'Inflow' ? 'hsl(var(--success))' : 'hsl(var(--danger))' 
                  }}
                >
                  {tx.type === 'Inflow' ? '+' : '-'}{tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
