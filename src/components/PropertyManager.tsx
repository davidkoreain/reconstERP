import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, MapPin, Users, Trash2, Plus, X, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

export const PropertyManager: React.FC = () => {
  const { properties, addProperty, deleteProperty, investors, corporations } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRegistries, setExpandedRegistries] = useState<Record<string, boolean>>({});

  const toggleRegistryExpand = (id: string) => {
    setExpandedRegistries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // New property form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [valuation, setValuation] = useState('');
  const [mortgageAmount, setMortgageAmount] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [monthlyMaintenance, setMonthlyMaintenance] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [ownerCorpId, setOwnerCorpId] = useState(corporations.length > 0 ? corporations[0].id : '');

  // New Registry form states
  const [purpose, setPurpose] = useState('');
  const [area, setArea] = useState('');
  const [structure, setStructure] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState('');
  const [acquisitionReason, setAcquisitionReason] = useState('');
  const [ownershipShare, setOwnershipShare] = useState('');
  const [ownershipRestrictions, setOwnershipRestrictions] = useState('');
  const [creditorName, setCreditorName] = useState('');
  const [maxDebtLimit, setMaxDebtLimit] = useState('');
  const [debtorName, setDebtorName] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !monthlyRent) {
      alert('필수 정보를 기입해주세요.');
      return;
    }

    addProperty({
      name,
      address,
      acquisitionCost: Number(acquisitionCost) || 0,
      valuation: Number(valuation) || 0,
      mortgageAmount: Number(mortgageAmount) || 0,
      monthlyRent: Number(monthlyRent) || 0,
      monthlyMaintenance: Number(monthlyMaintenance) || 0,
      tenantName,
      imageUrl: 'https://images.unsplash.com/photo-1464938050744-137471560611?auto=format&fit=crop&w=800&q=80',
      investorIds: [],
      ownerCorpId: ownerCorpId || undefined,
      purpose: purpose || undefined,
      area: Number(area) || undefined,
      structure: structure || undefined,
      acquisitionDate: acquisitionDate || undefined,
      acquisitionReason: acquisitionReason || undefined,
      ownershipShare: ownershipShare || undefined,
      ownershipRestrictions: ownershipRestrictions || undefined,
      creditorName: creditorName || undefined,
      maxDebtLimit: Number(maxDebtLimit) || undefined,
      debtorName: debtorName || undefined
    });

    // Reset Form
    setName('');
    setAddress('');
    setAcquisitionCost('');
    setValuation('');
    setMortgageAmount('');
    setMonthlyRent('');
    setMonthlyMaintenance('');
    setTenantName('');
    setOwnerCorpId(corporations.length > 0 ? corporations[0].id : '');
    setPurpose('');
    setArea('');
    setStructure('');
    setAcquisitionDate('');
    setAcquisitionReason('');
    setOwnershipShare('');
    setOwnershipRestrictions('');
    setCreditorName('');
    setMaxDebtLimit('');
    setDebtorName('');
    setShowAddModal(false);
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>부동산 자산 포트폴리오</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            보유 부동산의 가치 평가, 임대인 현황 및 설정된 담보권 목록을 실시간 관리합니다.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> 신규 자산 등록
        </button>
      </div>

      {/* Grid List */}
      <div className="grid-cols-3">
        {properties.map(property => {
          const ltv = Math.round((property.mortgageAmount / property.valuation) * 100);
          
          // Map investors tied to this property
          const propertyInvestors = investors.filter(inv => property.investorIds?.includes(inv.id) || inv.properties.includes(property.id));

          return (
            <div key={property.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              {/* Card Image banner */}
              <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
                <img 
                  src={property.imageUrl || 'https://images.unsplash.com/photo-1464938050744-137471560611?auto=format&fit=crop&w=800&q=80'} 
                  alt={property.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                {/* Real-time Risk Alert Monitoring for Ownership Restrictions (갑구 권리제한) */}
                {property.ownershipRestrictions && property.ownershipRestrictions !== '없음' && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.95)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                    zIndex: 2
                  }}>
                    <ShieldAlert size={12} />
                    <span>권리 제한 (가압류 등)</span>
                  </div>
                )}

                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <ShieldAlert size={12} style={{ color: ltv > 60 ? 'hsl(var(--danger))' : 'hsl(var(--success))' }} />
                  <span>LTV {ltv}%</span>
                </div>
              </div>

              {/* Card Contents */}
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>{property.name}</h4>
                    {property.ownerCorpId && (
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'hsl(var(--brand-primary))', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        {corporations.find(c => c.id === property.ownerCorpId)?.name.replace('주식회사 ', '') || '기타 법인'}
                      </span>
                    )}
                  </div>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'hsl(var(--text-secondary))', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    <MapPin size={12} /> {property.address}
                  </p>
                </div>

                {/* Properties Financial Specs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: 'hsl(var(--bg-tertiary))', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))' }}>감정 평가액</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{(property.valuation / 100000000).toFixed(1)}억원</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))' }}>회생 담보대출</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--danger))' }}>{(property.mortgageAmount / 100000000).toFixed(1)}억원</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))' }}>월세 임대수입</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--success))' }}>{(property.monthlyRent / 10000).toLocaleString()}만원</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))' }}>임차인 (운영현황)</span>
                    <p style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.tenantName}</p>
                  </div>
                </div>

                {/* Connected Investors list */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={12} /> 참여 투자자 ({propertyInvestors.length}명)
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                    {propertyInvestors.length > 0 ? (
                      propertyInvestors.map(inv => (
                        <span key={inv.id} className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                          {inv.name.split(' ')[0]} ({inv.ownershipRatio}%)
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>매칭된 투자자 없음</span>
                    )}
                  </div>
                </div>

                {/* Collapsible Registry Info Accordion */}
                <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <button 
                    type="button"
                    onClick={() => toggleRegistryExpand(property.id)}
                    style={{ 
                      width: '100%', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--brand-primary))',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0.25rem 0'
                    }}
                  >
                    <span>등기부 기재사항 요약 (표제부/갑구/을구)</span>
                    {expandedRegistries[property.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  
                  {expandedRegistries[property.id] && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.75rem',
                      fontSize: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border-color))'
                    }}>
                      {/* 표제부 */}
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--info))', display: 'block', marginBottom: '0.25rem' }}>[표제부] 건물 개요</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', color: 'hsl(var(--text-secondary))' }}>
                          <div>용도: <span style={{ color: 'white', fontWeight: 500 }}>{property.purpose || '-'}</span></div>
                          <div>전용면적: <span style={{ color: 'white', fontWeight: 500 }}>{property.area ? `${property.area} ㎡` : '-'}</span></div>
                          <div style={{ gridColumn: 'span 2' }}>구조: <span style={{ color: 'white', fontWeight: 500 }}>{property.structure || '-'}</span></div>
                        </div>
                      </div>
                      
                      {/* 갑구 */}
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--warning))', display: 'block', marginBottom: '0.25rem' }}>[갑구] 소유권 및 소유권 제한</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'hsl(var(--text-secondary))' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                            <div>취득일: <span style={{ color: 'white', fontWeight: 500 }}>{property.acquisitionDate || '-'}</span></div>
                            <div>원인: <span style={{ color: 'white', fontWeight: 500 }}>{property.acquisitionReason || '-'}</span></div>
                          </div>
                          <div>소유 지분: <span style={{ color: 'white', fontWeight: 500 }}>{property.ownershipShare || '-'}</span></div>
                          <div>
                            소유 제한: {' '}
                            {property.ownershipRestrictions && property.ownershipRestrictions !== '없음' ? (
                              <span style={{ color: 'hsl(var(--danger))', fontWeight: 700 }}>
                                {property.ownershipRestrictions}
                              </span>
                            ) : (
                              <span style={{ color: 'white', fontWeight: 500 }}>없음</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* 을구 */}
                      <div>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--success))', display: 'block', marginBottom: '0.25rem' }}>[을구] 근저당권 설정</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'hsl(var(--text-secondary))' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                            <div>근저당권자: <span style={{ color: 'white', fontWeight: 500 }}>{property.creditorName || '-'}</span></div>
                            <div>채무자: <span style={{ color: 'white', fontWeight: 500 }}>{property.debtorName || '-'}</span></div>
                          </div>
                          <div>
                            채권최고액:{' '}
                            <span style={{ color: 'hsl(var(--danger))', fontWeight: 600 }}>
                              {property.maxDebtLimit ? `${(property.maxDebtLimit / 10000).toLocaleString()}만원` : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action footer */}
                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid hsl(var(--border-color))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>ID: {property.id}</span>
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => deleteProperty(property.id)} 
                    style={{ padding: '0.35rem', color: 'hsl(var(--danger))' }}
                    title="자산 삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Asset Modal overlay */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ 
            width: '100%', 
            maxWidth: '650px', 
            padding: '2rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} /> 신규 자산 대장 등록
              </h3>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* 기본 임대 및 회계 정보 */}
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>1. 기본 정보 및 임대 현황</h4>
              </div>

              <div className="form-group">
                <label className="form-label">부동산 자산명 *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: 역삼 IT스퀘어" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">상세 주소 *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="예: 서울시 강남구 역삼로 10" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">소유 법인 *</label>
                <select 
                  className="form-input" 
                  value={ownerCorpId} 
                  onChange={e => setOwnerCorpId(e.target.value)}
                  style={{
                    backgroundColor: 'hsl(var(--bg-tertiary))',
                    color: 'white',
                    border: '1px solid hsl(var(--border-color))',
                    width: '100%'
                  }}
                  required
                >
                  <option value="" disabled>소유 법인을 선택하세요</option>
                  {corporations.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">취득 가격 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 4500000000" 
                    value={acquisitionCost} 
                    onChange={e => setAcquisitionCost(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">감정 평가액 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 4800000000" 
                    value={valuation} 
                    onChange={e => setValuation(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">설정된 담보금액 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 2000000000" 
                    value={mortgageAmount} 
                    onChange={e => setMortgageAmount(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">월세 임대수익 *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 15000000" 
                    value={monthlyRent} 
                    onChange={e => setMonthlyRent(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">월 관리비 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 3000000" 
                    value={monthlyMaintenance} 
                    onChange={e => setMonthlyMaintenance(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">주요 임차인 정보</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 삼각의료의원" 
                    value={tenantName} 
                    onChange={e => setTenantName(e.target.value)} 
                  />
                </div>
              </div>

              {/* 등기부 표제부 */}
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--info))', fontWeight: 600 }}>2. 부동산 등기부 [표제부] (건물 표시)</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>건물 용도</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 근린생활시설" 
                    value={purpose} 
                    onChange={e => setPurpose(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>전용면적 (㎡)</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-input" 
                    placeholder="예: 120.8" 
                    value={area} 
                    onChange={e => setArea(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>건물 구조</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 철근콘크리트조" 
                    value={structure} 
                    onChange={e => setStructure(e.target.value)} 
                  />
                </div>
              </div>

              {/* 등기부 갑구 */}
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--warning))', fontWeight: 600 }}>3. 부동산 등기부 [갑구] (소유권 및 소유권 제한)</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>소유권 취득일자</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={acquisitionDate} 
                    onChange={e => setAcquisitionDate(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>소유권 취득원인</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 매매" 
                    value={acquisitionReason} 
                    onChange={e => setAcquisitionReason(e.target.value)} 
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>소유 지분</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 1/1 (단독소유)" 
                    value={ownershipShare} 
                    onChange={e => setOwnershipShare(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>권리 제한 사항 (가압류 등)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 가압류 (서울중앙지방법원)" 
                    value={ownershipRestrictions} 
                    onChange={e => setOwnershipRestrictions(e.target.value)} 
                  />
                </div>
              </div>

              {/* 등기부 을구 */}
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--success))', fontWeight: 600 }}>4. 부동산 등기부 [을구] (근저당권 설정)</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>근저당권자 (채권자)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 신한은행" 
                    value={creditorName} 
                    onChange={e => setCreditorName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>채권최고액 (원)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="예: 1680000000" 
                    value={maxDebtLimit} 
                    onChange={e => setMaxDebtLimit(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>채무자</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="예: 주식회사 이조원" 
                    value={debtorName} 
                    onChange={e => setDebtorName(e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>등록 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PropertyManager;
