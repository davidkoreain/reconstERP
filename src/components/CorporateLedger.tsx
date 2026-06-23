import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  MapPin, 
  Plus, 
  X, 
  Edit, 
  Briefcase, 
  FileText, 
  Landmark, 
  TrendingUp 
} from 'lucide-react';
import type { Corporation, Property } from '../types';

export const CorporateLedger: React.FC = () => {
  const { corporations, properties, addCorporation, updateCorporation } = useApp();
  const [selectedCorpId, setSelectedCorpId] = useState<string>(
    corporations.length > 0 ? corporations[0].id : ''
  );
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [bizNumber, setBizNumber] = useState('');
  const [representative, setRepresentative] = useState('');
  const [address, setAddress] = useState('');
  const [capital, setCapital] = useState('');
  const [revenue, setRevenue] = useState('');
  const [netIncome, setNetIncome] = useState('');
  const [totalAssets, setTotalAssets] = useState('');
  const [totalLiabilities, setTotalLiabilities] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');

  const selectedCorp: Corporation = corporations.find(c => c.id === selectedCorpId) || corporations[0];

  const formatKRW = (value?: number) => {
    if (value === undefined || value === null) return '-';
    if (value >= 100000000) {
      const eok = Math.floor(value / 100000000);
      const man = Math.floor((value % 100000000) / 10000);
      return `${eok}억 ${man > 0 ? man + '만' : ''}원`;
    }
    return `${value.toLocaleString()}원`;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bizNumber || !representative) {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    addCorporation({
      name,
      regNumber,
      bizNumber,
      representative,
      address,
      capital: Number(capital) || 0,
      revenue: Number(revenue) || 0,
      netIncome: Number(netIncome) || 0,
      totalAssets: Number(totalAssets) || 0,
      totalLiabilities: Number(totalLiabilities) || 0,
      fiscalYear: fiscalYear || new Date().toISOString().split('T')[0]
    });

    // Reset fields
    setName('');
    setRegNumber('');
    setBizNumber('');
    setRepresentative('');
    setAddress('');
    setCapital('');
    setRevenue('');
    setNetIncome('');
    setTotalAssets('');
    setTotalLiabilities('');
    setFiscalYear('');
    setShowAddModal(false);
  };

  const openEditModal = () => {
    if (!selectedCorp) return;
    setName(selectedCorp.name);
    setRegNumber(selectedCorp.regNumber);
    setBizNumber(selectedCorp.bizNumber);
    setRepresentative(selectedCorp.representative);
    setAddress(selectedCorp.address);
    setCapital(selectedCorp.capital.toString());
    setRevenue(selectedCorp.revenue?.toString() || '');
    setNetIncome(selectedCorp.netIncome?.toString() || '');
    setTotalAssets(selectedCorp.totalAssets?.toString() || '');
    setTotalLiabilities(selectedCorp.totalLiabilities?.toString() || '');
    setFiscalYear(selectedCorp.fiscalYear || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCorp) return;

    updateCorporation({
      id: selectedCorp.id,
      name,
      regNumber,
      bizNumber,
      representative,
      address,
      capital: Number(capital) || 0,
      revenue: Number(revenue) || 0,
      netIncome: Number(netIncome) || 0,
      totalAssets: Number(totalAssets) || 0,
      totalLiabilities: Number(totalLiabilities) || 0,
      fiscalYear: fiscalYear || selectedCorp.fiscalYear
    });

    setShowEditModal(false);
  };

  // Calculations for dashboard summary
  const totalCapital = corporations.reduce((sum, c) => sum + (c.capital || 0), 0);
  const totalCorpAssets = corporations.reduce((sum, c) => sum + (c.totalAssets || 0), 0);
  const totalCorpRevenues = corporations.reduce((sum, c) => sum + (c.revenue || 0), 0);

  // Filter properties owned by selected corporation
  const ownedProperties: Property[] = selectedCorp 
    ? properties.filter(p => p.ownerCorpId === selectedCorp.id) 
    : [];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>법인 대장 및 부동산 관리</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            여러 법인의 법인 등기부 등본 요약 정보와 재무 상태표, 법인 소유 부동산 포트폴리오를 연계하여 관리합니다.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> 신규 법인 등록
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid-cols-3">
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'hsl(var(--brand-primary))' }}>
            <Building2 size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>관리 법인 수</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{corporations.length}개 법인</h3>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>자산대장 실시간 연동</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'hsl(var(--success))' }}>
            <Landmark size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>총 법인 자본금 합계</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{formatKRW(totalCapital)}</h3>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.15rem' }}>설립 등기 기준 총액</p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'hsl(var(--info))' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>총 자산 및 매출 규모</p>
            <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>자산 {formatKRW(totalCorpAssets)}</h3>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--info))', marginTop: '0.15rem' }}>연 매출액: {formatKRW(totalCorpRevenues)}</p>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem' }}>
        {/* Left Column: Corporation List Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem' }}>법인 목록</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {corporations.map(corp => {
              const corpProps = properties.filter(p => p.ownerCorpId === corp.id);
              const isSelected = corp.id === selectedCorpId;

              return (
                <div 
                  key={corp.id} 
                  className="glass-card" 
                  onClick={() => setSelectedCorpId(corp.id)}
                  style={{ 
                    cursor: 'pointer',
                    border: isSelected ? '1px solid hsl(var(--brand-primary))' : '1px solid hsl(var(--border-color))',
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'hsl(var(--bg-secondary))',
                    transition: 'all 0.2s ease',
                    padding: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: isSelected ? 'hsl(var(--brand-primary))' : 'white' }}>
                      {corp.name}
                    </h5>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                      {corpProps.length}개 부동산
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.5rem' }}>
                    대표자: {corp.representative}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>
                    사업자번호: {corp.bizNumber}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Corporate Detail view & Properties owned */}
        {selectedCorp ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Top Area: Profile Description & Action Buttons */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={20} style={{ color: 'hsl(var(--brand-primary))' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{selectedCorp.name}</h3>
                </div>
                <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'hsl(var(--brand-primary))' }} onClick={openEditModal}>
                  <Edit size={16} /> 법인 정보 수정
                </button>
              </div>

              {/* Profile Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>법인 등록 번호</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white' }}>{selectedCorp.regNumber}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>사업자 등록 번호</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white' }}>{selectedCorp.bizNumber}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>대표이사</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white' }}>{selectedCorp.representative}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>설립 자본금</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white' }}>{formatKRW(selectedCorp.capital)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>본점 소재지</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={14} style={{ color: 'hsl(var(--brand-primary))' }} /> {selectedCorp.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial indicators (Balance Sheet Summary) */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FileText size={18} style={{ color: 'hsl(var(--success))' }} /> 재무 제표 요약
                </h4>
                {selectedCorp.fiscalYear && (
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>기준 결산년도: {selectedCorp.fiscalYear}</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '0.25rem' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
                  <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>연 매출액</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--success))', marginTop: '0.15rem' }}>{formatKRW(selectedCorp.revenue)}</p>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
                  <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>당기순이익</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--brand-primary))', marginTop: '0.15rem' }}>{formatKRW(selectedCorp.netIncome)}</p>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
                  <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>자산 총계</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', marginTop: '0.15rem' }}>{formatKRW(selectedCorp.totalAssets)}</p>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
                  <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>부채 총계</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--danger))', marginTop: '0.15rem' }}>{formatKRW(selectedCorp.totalLiabilities)}</p>
                </div>
              </div>

              {/* Visual Asset-Liabilities Ratio bar */}
              {selectedCorp.totalAssets && selectedCorp.totalLiabilities ? (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-secondary))' }}>
                    <span>부채비율 (부채/자산)</span>
                    <span style={{ fontWeight: 600, color: 'white' }}>
                      {Math.round((selectedCorp.totalLiabilities / selectedCorp.totalAssets) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'hsl(var(--bg-tertiary))', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ 
                      width: `${Math.min(100, (selectedCorp.totalLiabilities / selectedCorp.totalAssets) * 100)}%`, 
                      backgroundColor: 'hsl(var(--danger))' 
                    }} />
                    <div style={{ 
                      flex: 1, 
                      backgroundColor: 'hsl(var(--success))' 
                    }} />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Properties Owned List */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Briefcase size={18} style={{ color: 'hsl(var(--info))' }} /> 법인 소유 부동산 자산 목록 ({ownedProperties.length})
                </h4>
              </div>

              {ownedProperties.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {ownedProperties.map(prop => {
                    const ltv = Math.round((prop.mortgageAmount / prop.valuation) * 100);
                    return (
                      <div 
                        key={prop.id} 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.5fr', 
                          alignItems: 'center', 
                          padding: '0.85rem 1rem', 
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(255,255,255,0.01)',
                          border: '1px solid hsl(var(--border-color))',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'white' }}>{prop.name}</p>
                            {prop.ownershipRestrictions && prop.ownershipRestrictions !== '없음' && (
                              <span style={{ 
                                backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                                color: 'hsl(var(--danger))', 
                                border: '1px solid rgba(239, 68, 68, 0.3)', 
                                padding: '0.1rem 0.3rem', 
                                borderRadius: '2px', 
                                fontSize: '0.6rem',
                                fontWeight: 700 
                              }}>
                                권리제한
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))', display: 'flex', gap: '0.4rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                              <MapPin size={10} /> {prop.address.substring(0, 15)}...
                            </span>
                            {prop.purpose && <span>· {prop.purpose}</span>}
                            {prop.area && <span>· {prop.area}㎡</span>}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'block' }}>감정가</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{formatKRW(prop.valuation)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'block' }}>담보채무 (LTV)</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--danger))' }}>
                            {formatKRW(prop.mortgageAmount)} ({ltv}%)
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', display: 'block' }}>월 임대료 수입</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--success))' }}>{formatKRW(prop.monthlyRent)}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>운영중</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'hsl(var(--text-muted))', border: '1px dashed hsl(var(--border-color))', borderRadius: 'var(--radius-sm)' }}>
                  <Building2 size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.85rem' }}>해당 법인 명의로 소유된 부동산이 등록되지 않았습니다.</p>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>부동산 포트폴리오 관리 메뉴에서 자산 등록 시 소유 법인을 지정해 주세요.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ color: 'hsl(var(--text-muted))' }}>법인을 선택하거나 등록해 주세요.</p>
          </div>
        )}
      </div>

      {/* Add Corporation Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} /> 신규 법인 등록
              </h3>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--brand-primary))', fontWeight: 600 }}>1. 법인 기본 등기 정보</h4>
              </div>

              <div className="form-group">
                <label className="form-label">법인명 *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: 주식회사 이조원" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">대표이사 *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 이조원" 
                    value={representative} 
                    onChange={e => setRepresentative(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">자본금 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 500000000" 
                    value={capital} 
                    onChange={e => setCapital(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">법인등록번호</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 110111-2345678" 
                    value={regNumber} 
                    onChange={e => setRegNumber(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">사업자등록번호 *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 104-81-12345" 
                    value={bizNumber} 
                    onChange={e => setBizNumber(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">본점 소재지 주소</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: 서울특별시 중구 을지로 88" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                />
              </div>

              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginBottom: '0.25rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--success))', fontWeight: 600 }}>2. 재무 상태 지표 (재무제표)</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">연 매출액 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 1200000000" 
                    value={revenue} 
                    onChange={e => setRevenue(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">당기순이익 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 180000000" 
                    value={netIncome} 
                    onChange={e => setNetIncome(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">자산 총계 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 5000000000" 
                    value={totalAssets} 
                    onChange={e => setTotalAssets(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">부채 총계 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 2000000000" 
                    value={totalLiabilities} 
                    onChange={e => setTotalLiabilities(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">결산 기준일</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: 2025-12-31" 
                  value={fiscalYear} 
                  onChange={e => setFiscalYear(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>법인 등록 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Corporation Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} /> 법인 정보 수정
              </h3>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--brand-primary))', fontWeight: 600 }}>1. 법인 기본 등기 정보</h4>
              </div>

              <div className="form-group">
                <label className="form-label">법인명 *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: 주식회사 이조원" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">대표이사 *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 이조원" 
                    value={representative} 
                    onChange={e => setRepresentative(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">자본금 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 500000000" 
                    value={capital} 
                    onChange={e => setCapital(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">법인등록번호</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 110111-2345678" 
                    value={regNumber} 
                    onChange={e => setRegNumber(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">사업자등록번호 *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 104-81-12345" 
                    value={bizNumber} 
                    onChange={e => setBizNumber(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">본점 소재지 주소</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: 서울특별시 중구 을지로 88" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                />
              </div>

              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginBottom: '0.25rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--success))', fontWeight: 600 }}>2. 재무 상태 지표 (재무제표)</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">연 매출액 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 1200000000" 
                    value={revenue} 
                    onChange={e => setRevenue(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">당기순이익 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 180000000" 
                    value={netIncome} 
                    onChange={e => setNetIncome(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">자산 총계 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 5000000000" 
                    value={totalAssets} 
                    onChange={e => setTotalAssets(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">부채 총계 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 2000000000" 
                    value={totalLiabilities} 
                    onChange={e => setTotalLiabilities(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">결산 기준일</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: 2025-12-31" 
                  value={fiscalYear} 
                  onChange={e => setFiscalYear(e.target.value)} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>정보 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporateLedger;
