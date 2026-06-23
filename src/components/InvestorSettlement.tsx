import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, DollarSign, ArrowUpRight, Percent, Award, AlertCircle } from 'lucide-react';

export const InvestorSettlement: React.FC = () => {
  const { investors, properties, runSettlement } = useApp();
  
  // Settlement calculation states
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [distributionAmount, setDistributionAmount] = useState('');

  const activeProperty = properties.find(p => p.id === selectedPropertyId);
  
  // Investors participating in the selected asset
  const participatingInvestors = investors.filter(inv => {
    if (!selectedPropertyId) return false;
    return inv.properties.includes(selectedPropertyId);
  });

  const totalCapitalForProperty = participatingInvestors.reduce((sum, inv) => sum + inv.capitalInvested, 0);

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId || !distributionAmount) {
      alert('정산 자산과 분배 대상 금액을 입력해 주세요.');
      return;
    }

    const amount = Number(distributionAmount);
    if (amount <= 0) {
      alert('분배 금액은 0보다 커야 합니다.');
      return;
    }

    runSettlement(selectedPropertyId, amount);
    alert(`${activeProperty?.name}의 수익 분배금 ${amount.toLocaleString()}원이 각 투자자 비율에 맞춰 성공적으로 정산 및 장부에 기록되었습니다.`);
    setDistributionAmount('');
    setSelectedPropertyId('');
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>투자자 정산 및 수익분배 시스템</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
          자산별 지분 투자 내역과 월 임대 순이익에 기반한 프로라타(Pro-rata) 수익 정산 및 배당을 실행합니다.
        </p>
      </div>

      {/* Top Level Stats */}
      <div className="grid-cols-3">
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'hsl(var(--info))' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>총 등록 투자자</span>
            <h4 style={{ fontSize: '1.25rem', marginTop: '0.15rem' }}>{investors.length}명</h4>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'hsl(var(--brand-primary))' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>총 누적 조달자본</span>
            <h4 style={{ fontSize: '1.25rem', marginTop: '0.15rem' }}>{(investors.reduce((sum, i) => sum + i.capitalInvested, 0) / 100000000).toFixed(1)}억원</h4>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'hsl(var(--success))' }}>
            <ArrowUpRight size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>총 배당금 지급액</span>
            <h4 style={{ fontSize: '1.25rem', marginTop: '0.15rem' }}>{(investors.reduce((sum, i) => sum + i.totalDividendsPaid, 0) / 100000000).toFixed(2)}억원</h4>
          </div>
        </div>
      </div>

      <div className="grid-cols-1-2">
        {/* Left: Settlement Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.75rem' }}>
            <Award size={18} /> 수익 분배 계산기
          </h3>

          <form onSubmit={handleSettle} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">정산 대상 자산 선택 *</label>
              <select 
                className="form-select" 
                value={selectedPropertyId} 
                onChange={e => setSelectedPropertyId(e.target.value)}
                required
              >
                <option value="">자산을 선택해 주세요</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (수익: {p.monthlyRent.toLocaleString()}원)</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">분배 대상 금액 (원) *</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="예: 25000000" 
                value={distributionAmount} 
                onChange={e => setDistributionAmount(e.target.value)}
                required 
              />
              {activeProperty && (
                <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem', display: 'block' }}>
                  * 월 권장 임대수입(순이익): {(activeProperty.monthlyRent - activeProperty.monthlyMaintenance).toLocaleString()}원
                </span>
              )}
            </div>

            {/* Calculations review */}
            {selectedPropertyId && participatingInvestors.length > 0 && (
              <div style={{ backgroundColor: 'hsl(var(--bg-tertiary))', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Percent size={14} /> 자본비율별 정산 시뮬레이션
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                  {participatingInvestors.map(inv => {
                    const weight = inv.capitalInvested / totalCapitalForProperty;
                    const calculatedPayout = Number(distributionAmount) ? Math.floor(Number(distributionAmount) * weight) : 0;

                    return (
                      <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'hsl(var(--text-secondary))' }}>{inv.name.split(' ')[0]} ({Math.round(weight * 100)}%)</span>
                        <span style={{ fontWeight: 600 }}>{calculatedPayout.toLocaleString()}원</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedPropertyId && participatingInvestors.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--danger))', fontSize: '0.75rem' }}>
                <AlertCircle size={16} />
                <span>이 자산에 지정 매칭된 투자자가 존재하지 않습니다.</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={participatingInvestors.length === 0}>
              수익분배금 정산 실행
            </button>
          </form>
        </div>

        {/* Right: Investor Ledger */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.75rem' }}>
            등록 투자자 목록 및 지급 현황
          </h3>

          <div className="custom-table-wrapper" style={{ flex: 1 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>투자자명</th>
                  <th>총 투자원금</th>
                  <th>계좌 정보</th>
                  <th>누적 배당금</th>
                </tr>
              </thead>
              <tbody>
                {investors.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.name}</td>
                    <td style={{ fontWeight: 500 }}>{inv.capitalInvested.toLocaleString()}원</td>
                    <td style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>{inv.bankAccount}</td>
                    <td style={{ fontWeight: 600, color: 'hsl(var(--success))' }}>{inv.totalDividendsPaid.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InvestorSettlement;
