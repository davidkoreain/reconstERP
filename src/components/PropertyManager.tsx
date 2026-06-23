import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { extractTextFromPdf, parsePropertyLedger, countFilledFields } from '../lib/pdfParser';
import type { ParsedLedgerData } from '../lib/pdfParser';
import {
  Building2, MapPin, Users, Trash2, Plus, X, ShieldAlert,
  ChevronDown, ChevronUp, FileText, Upload, CheckCircle2,
  Loader2, AlertTriangle, Sparkles,
} from 'lucide-react';

// ─── OCR 업로드 존 ─────────────────────────────────────────────────────────────

type OcrState = 'idle' | 'reading' | 'parsing' | 'done' | 'error';

interface PdfUploaderProps {
  onParsed: (data: ParsedLedgerData, fileName: string, fileObj: File) => void;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onParsed }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [dragging, setDragging] = useState(false);
  const [filledCount, setFilledCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const processPdf = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMsg('PDF 파일만 업로드할 수 있습니다.');
      setOcrState('error');
      return;
    }
    setErrorMsg('');
    setOcrState('reading');

    try {
      const text = await extractTextFromPdf(file);
      setOcrState('parsing');

      if (text.trim().length < 50) {
        setErrorMsg('텍스트를 추출할 수 없습니다. 스캔 PDF는 지원되지 않습니다.');
        setOcrState('error');
        return;
      }

      const parsed = parsePropertyLedger(text);
      const count = countFilledFields(parsed);
      setFilledCount(count);
      setOcrState('done');
      onParsed(parsed, file.name, file);
    } catch (err) {
      console.error(err);
      setErrorMsg('PDF 처리 중 오류가 발생했습니다.');
      setOcrState('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processPdf(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPdf(file);
  };

  const zoneColor = ocrState === 'done'
    ? 'hsl(142 60% 12%)'
    : ocrState === 'error'
    ? 'hsl(0 60% 10%)'
    : dragging
    ? 'rgba(99,102,241,0.12)'
    : 'hsl(220 25% 10%)';

  const borderColor = ocrState === 'done'
    ? 'hsl(142 60% 30%)'
    : ocrState === 'error'
    ? 'hsl(0 60% 30%)'
    : dragging
    ? 'hsl(239 84% 67%)'
    : 'hsl(220 20% 25%)';

  return (
    <div>
      <div
        onClick={() => ocrState === 'idle' || ocrState === 'error' ? inputRef.current?.click() : undefined}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: '10px',
          backgroundColor: zoneColor,
          padding: '1.5rem',
          textAlign: 'center',
          cursor: ocrState === 'idle' || ocrState === 'error' ? 'pointer' : 'default',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {ocrState === 'idle' && (
          <>
            <Upload size={28} color="hsl(239 84% 67%)" />
            <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
              등기부등본 PDF 드래그 or 클릭하여 업로드
            </p>
            <p style={{ color: 'hsl(220 15% 50%)', fontSize: '0.75rem', margin: 0 }}>
              인터넷등기소에서 발급한 텍스트 기반 PDF · 최대 50MB
            </p>
          </>
        )}
        {(ocrState === 'reading' || ocrState === 'parsing') && (
          <>
            <Loader2 size={28} color="hsl(239 84% 67%)" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
              {ocrState === 'reading' ? 'PDF 텍스트 추출 중...' : '등기부 필드 분석 중...'}
            </p>
          </>
        )}
        {ocrState === 'done' && (
          <>
            <CheckCircle2 size={28} color="hsl(142 71% 45%)" />
            <p style={{ color: 'hsl(142 71% 55%)', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
              분석 완료 — {filledCount}개 항목 자동 입력됨
            </p>
            <p style={{ color: 'hsl(220 15% 55%)', fontSize: '0.75rem', margin: 0 }}>
              아래 폼에서 내용을 확인하고 수정한 뒤 등록하세요
            </p>
          </>
        )}
        {ocrState === 'error' && (
          <>
            <AlertTriangle size={28} color="hsl(38 92% 50%)" />
            <p style={{ color: 'hsl(38 92% 60%)', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
              {errorMsg}
            </p>
            <p style={{ color: 'hsl(220 15% 55%)', fontSize: '0.75rem', margin: 0 }}>
              클릭하여 다시 시도하거나 아래 폼에 직접 입력하세요
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};

// ─── 자동 채워진 필드 강조 스타일 ──────────────────────────────────────────────

const autoFilledStyle: React.CSSProperties = {
  borderColor: 'hsl(142 60% 35%)',
  backgroundColor: 'hsl(142 60% 6%)',
};

// ─── PropertyManager 메인 ──────────────────────────────────────────────────────

export const PropertyManager: React.FC = () => {
  const { properties, addProperty, deleteProperty, investors, corporations } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRegistries, setExpandedRegistries] = useState<Record<string, boolean>>({});

  const toggleRegistryExpand = (id: string) => {
    setExpandedRegistries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── 폼 상태 ──────────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [valuation, setValuation] = useState('');
  const [mortgageAmount, setMortgageAmount] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [monthlyMaintenance, setMonthlyMaintenance] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [ownerCorpId, setOwnerCorpId] = useState(corporations.length > 0 ? corporations[0].id : '');
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

  // OCR로 자동 채워진 필드 추적
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setName(''); setAddress(''); setAcquisitionCost(''); setValuation('');
    setMortgageAmount(''); setMonthlyRent(''); setMonthlyMaintenance('');
    setTenantName(''); setOwnerCorpId(corporations.length > 0 ? corporations[0].id : '');
    setPurpose(''); setArea(''); setStructure(''); setAcquisitionDate('');
    setAcquisitionReason(''); setOwnershipShare(''); setOwnershipRestrictions('');
    setCreditorName(''); setMaxDebtLimit(''); setDebtorName('');
    setAutoFilled(new Set());
    setPdfFile(null);
  };

  // ── PDF 파싱 완료 콜백 ─────────────────────────────────────────────────────
  const handleParsed = (data: ParsedLedgerData, _fileName: string, fileObj: File) => {
    const filled = new Set<string>();
    const fill = (setter: React.Dispatch<React.SetStateAction<string>>, value: string | undefined, key: string) => {
      if (value !== undefined && value !== '') {
        setter(value);
        filled.add(key);
      }
    };

    fill(setAddress, data.address, 'address');
    fill(setPurpose, data.purpose, 'purpose');
    fill(setArea, data.area !== undefined ? String(data.area) : undefined, 'area');
    fill(setStructure, data.structure, 'structure');
    fill(setAcquisitionDate, data.acquisitionDate, 'acquisitionDate');
    fill(setAcquisitionReason, data.acquisitionReason, 'acquisitionReason');
    fill(setOwnershipShare, data.ownershipShare, 'ownershipShare');
    fill(setOwnershipRestrictions, data.ownershipRestrictions, 'ownershipRestrictions');
    fill(setCreditorName, data.creditorName, 'creditorName');
    fill(setMaxDebtLimit, data.maxDebtLimit !== undefined ? String(data.maxDebtLimit) : undefined, 'maxDebtLimit');
    fill(setDebtorName, data.debtorName, 'debtorName');

    setAutoFilled(filled);
    setPdfFile(fileObj);
  };

  // ── PDF를 Supabase Storage에 업로드 ──────────────────────────────────────────
  const uploadPdfToStorage = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage
      .from('property-docs')
      .upload(fileName, file, { contentType: 'application/pdf', upsert: false });

    if (error) { console.error('Storage upload error:', error); return null; }

    const { data } = supabase.storage.from('property-docs').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // ── 폼 제출 ───────────────────────────────────────────────────────────────
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !monthlyRent) {
      alert('필수 정보(자산명, 주소, 월세)를 입력해주세요.');
      return;
    }

    setUploading(true);
    let documentUrl: string | undefined;
    if (pdfFile) {
      const url = await uploadPdfToStorage(pdfFile);
      if (url) documentUrl = url;
    }
    setUploading(false);

    await addProperty({
      name,
      address,
      acquisitionCost: Number(acquisitionCost) || 0,
      valuation: Number(valuation) || 0,
      mortgageAmount: Number(mortgageAmount) || 0,
      monthlyRent: Number(monthlyRent) || 0,
      monthlyMaintenance: Number(monthlyMaintenance) || 0,
      tenantName,
      imageUrl: documentUrl ||
        'https://images.unsplash.com/photo-1464938050744-137471560611?auto=format&fit=crop&w=800&q=80',
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
      debtorName: debtorName || undefined,
    });

    resetForm();
    setShowAddModal(false);
  };

  // ── 자동채우기 인풋 스타일 ────────────────────────────────────────────────────
  const inputStyle = (key: string): React.CSSProperties =>
    autoFilled.has(key)
      ? { ...autoFilledStyle }
      : {};

  const labelBadge = (key: string) =>
    autoFilled.has(key)
      ? <span style={{ marginLeft: '0.35rem', fontSize: '0.65rem', color: 'hsl(142 71% 55%)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
          <Sparkles size={10} /> OCR
        </span>
      : null;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>부동산 자산 포트폴리오</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            보유 부동산의 가치 평가, 임대인 현황 및 설정된 담보권 목록을 실시간 관리합니다.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus size={18} /> 신규 자산 등록
        </button>
      </div>

      {/* 자산 카드 그리드 */}
      <div className="grid-cols-3">
        {properties.map(property => {
          const ltv = property.valuation > 0
            ? Math.round((property.mortgageAmount / property.valuation) * 100)
            : 0;
          const propertyInvestors = investors.filter(
            inv => property.investorIds?.includes(inv.id) || inv.properties.includes(property.id)
          );

          return (
            <div key={property.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={property.imageUrl || 'https://images.unsplash.com/photo-1464938050744-137471560611?auto=format&fit=crop&w=800&q=80'}
                  alt={property.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {property.ownershipRestrictions && property.ownershipRestrictions !== '없음' && (
                  <div style={{
                    position: 'absolute', top: '10px', left: '10px',
                    backgroundColor: 'rgba(239,68,68,0.95)', color: 'white',
                    padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: '0.25rem', zIndex: 2,
                  }}>
                    <ShieldAlert size={12} /> 권리 제한 (가압류 등)
                  </div>
                )}
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  backgroundColor: 'rgba(15,23,42,0.85)',
                  padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <ShieldAlert size={12} style={{ color: ltv > 60 ? 'hsl(var(--danger))' : 'hsl(var(--success))' }} />
                  LTV {ltv}%
                </div>
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>{property.name}</h4>
                    {property.ownerCorpId && (
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(99,102,241,0.15)', color: 'hsl(var(--brand-primary))', border: '1px solid rgba(99,102,241,0.3)' }}>
                        {corporations.find(c => c.id === property.ownerCorpId)?.name.replace('주식회사 ', '') || '기타 법인'}
                      </span>
                    )}
                  </div>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'hsl(var(--text-secondary))', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    <MapPin size={12} /> {property.address}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: 'hsl(var(--bg-tertiary))', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
                  <div><span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))' }}>감정 평가액</span><p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{(property.valuation / 100000000).toFixed(1)}억원</p></div>
                  <div><span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))' }}>회생 담보대출</span><p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--danger))' }}>{(property.mortgageAmount / 100000000).toFixed(1)}억원</p></div>
                  <div><span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))' }}>월세 임대수입</span><p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--success))' }}>{(property.monthlyRent / 10000).toLocaleString()}만원</p></div>
                  <div><span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))' }}>임차인</span><p style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.tenantName}</p></div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={12} /> 참여 투자자 ({propertyInvestors.length}명)
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                    {propertyInvestors.length > 0 ? propertyInvestors.map(inv => (
                      <span key={inv.id} className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                        {inv.name.split(' ')[0]} ({inv.ownershipRatio}%)
                      </span>
                    )) : (
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>매칭된 투자자 없음</span>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => toggleRegistryExpand(property.id)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: 'hsl(var(--brand-primary))', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '0.25rem 0' }}
                  >
                    <span>등기부 기재사항 요약 (표제부/갑구/을구)</span>
                    {expandedRegistries[property.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {expandedRegistries[property.id] && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--info))', display: 'block', marginBottom: '0.25rem' }}>[표제부] 건물 개요</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', color: 'hsl(var(--text-secondary))' }}>
                          <div>용도: <span style={{ color: 'white', fontWeight: 500 }}>{property.purpose || '-'}</span></div>
                          <div>전용면적: <span style={{ color: 'white', fontWeight: 500 }}>{property.area ? `${property.area} ㎡` : '-'}</span></div>
                          <div style={{ gridColumn: 'span 2' }}>구조: <span style={{ color: 'white', fontWeight: 500 }}>{property.structure || '-'}</span></div>
                        </div>
                      </div>
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--warning))', display: 'block', marginBottom: '0.25rem' }}>[갑구] 소유권 및 소유권 제한</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'hsl(var(--text-secondary))' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                            <div>취득일: <span style={{ color: 'white', fontWeight: 500 }}>{property.acquisitionDate || '-'}</span></div>
                            <div>원인: <span style={{ color: 'white', fontWeight: 500 }}>{property.acquisitionReason || '-'}</span></div>
                          </div>
                          <div>소유 지분: <span style={{ color: 'white', fontWeight: 500 }}>{property.ownershipShare || '-'}</span></div>
                          <div>소유 제한: {property.ownershipRestrictions && property.ownershipRestrictions !== '없음' ? (
                            <span style={{ color: 'hsl(var(--danger))', fontWeight: 700 }}>{property.ownershipRestrictions}</span>
                          ) : <span style={{ color: 'white', fontWeight: 500 }}>없음</span>}</div>
                        </div>
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--success))', display: 'block', marginBottom: '0.25rem' }}>[을구] 근저당권 설정</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: 'hsl(var(--text-secondary))' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                            <div>근저당권자: <span style={{ color: 'white', fontWeight: 500 }}>{property.creditorName || '-'}</span></div>
                            <div>채무자: <span style={{ color: 'white', fontWeight: 500 }}>{property.debtorName || '-'}</span></div>
                          </div>
                          <div>채권최고액: <span style={{ color: 'hsl(var(--danger))', fontWeight: 600 }}>{property.maxDebtLimit ? `${(property.maxDebtLimit / 10000).toLocaleString()}만원` : '-'}</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid hsl(var(--border-color))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>ID: {property.id.slice(0, 8)}…</span>
                  <button className="btn btn-ghost" onClick={() => deleteProperty(property.id)} style={{ padding: '0.35rem', color: 'hsl(var(--danger))' }} title="자산 삭제">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 신규 자산 등록 모달 */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '92vh', overflowY: 'auto' }}>

            {/* 모달 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={20} /> 신규 자산 대장 등록
              </h3>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* ── OCR 업로드 존 ── */}
            <div style={{ backgroundColor: 'hsl(220 25% 9%)', border: '1px solid hsl(220 20% 18%)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} color="hsl(239 84% 67%)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>등기부등본 PDF 자동 인식</span>
                <span style={{ fontSize: '0.7rem', color: 'hsl(220 15% 50%)', marginLeft: '0.25rem' }}>
                  업로드하면 아래 필드가 자동으로 채워집니다
                </span>
              </div>
              <PdfUploader onParsed={handleParsed} />
            </div>

            {/* ── 등록 폼 ── */}
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* 1. 기본 정보 */}
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>1. 기본 정보 및 임대 현황</h4>
              </div>

              <div className="form-group">
                <label className="form-label">부동산 자산명 *</label>
                <input type="text" className="form-input" placeholder="예: 역삼 IT스퀘어 3층" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">상세 주소 * {labelBadge('address')}</label>
                <input type="text" className="form-input" placeholder="예: 서울시 강남구 역삼로 10" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle('address')} required />
              </div>

              <div className="form-group">
                <label className="form-label">소유 법인</label>
                <select className="form-input" value={ownerCorpId} onChange={e => setOwnerCorpId(e.target.value)} style={{ backgroundColor: 'hsl(var(--bg-tertiary))', color: 'white', border: '1px solid hsl(var(--border-color))', width: '100%' }}>
                  <option value="">소유 법인 선택 (선택)</option>
                  {corporations.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">취득 가격 (원)</label><input type="number" className="form-input" placeholder="4500000000" value={acquisitionCost} onChange={e => setAcquisitionCost(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">감정 평가액 (원)</label><input type="number" className="form-input" placeholder="4800000000" value={valuation} onChange={e => setValuation(e.target.value)} /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">설정된 담보금액 (원)</label><input type="number" className="form-input" placeholder="2000000000" value={mortgageAmount} onChange={e => setMortgageAmount(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">월세 임대수익 * (원)</label><input type="number" className="form-input" placeholder="15000000" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} required /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">월 관리비 (원)</label><input type="number" className="form-input" placeholder="3000000" value={monthlyMaintenance} onChange={e => setMonthlyMaintenance(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">주요 임차인</label><input type="text" className="form-input" placeholder="예: 삼각의료의원" value={tenantName} onChange={e => setTenantName(e.target.value)} /></div>
              </div>

              {/* 2. 표제부 */}
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--info))', fontWeight: 600 }}>2. 등기부 [표제부] 건물 표시</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>건물 용도 {labelBadge('purpose')}</label>
                  <input type="text" className="form-input" placeholder="근린생활시설" value={purpose} onChange={e => setPurpose(e.target.value)} style={inputStyle('purpose')} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>전용면적 (㎡) {labelBadge('area')}</label>
                  <input type="number" step="any" className="form-input" placeholder="120.8" value={area} onChange={e => setArea(e.target.value)} style={inputStyle('area')} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>건물 구조 {labelBadge('structure')}</label>
                  <input type="text" className="form-input" placeholder="철근콘크리트조" value={structure} onChange={e => setStructure(e.target.value)} style={inputStyle('structure')} />
                </div>
              </div>

              {/* 3. 갑구 */}
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--warning))', fontWeight: 600 }}>3. 등기부 [갑구] 소유권 및 제한</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>소유권 취득일 {labelBadge('acquisitionDate')}</label>
                  <input type="date" className="form-input" value={acquisitionDate} onChange={e => setAcquisitionDate(e.target.value)} style={inputStyle('acquisitionDate')} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>취득 원인 {labelBadge('acquisitionReason')}</label>
                  <input type="text" className="form-input" placeholder="매매" value={acquisitionReason} onChange={e => setAcquisitionReason(e.target.value)} style={inputStyle('acquisitionReason')} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>소유 지분 {labelBadge('ownershipShare')}</label>
                  <input type="text" className="form-input" placeholder="1/1 (단독소유)" value={ownershipShare} onChange={e => setOwnershipShare(e.target.value)} style={inputStyle('ownershipShare')} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>권리 제한 사항 {labelBadge('ownershipRestrictions')}</label>
                  <input type="text" className="form-input" placeholder="없음" value={ownershipRestrictions} onChange={e => setOwnershipRestrictions(e.target.value)} style={inputStyle('ownershipRestrictions')} />
                </div>
              </div>

              {/* 4. 을구 */}
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--success))', fontWeight: 600 }}>4. 등기부 [을구] 근저당권 설정</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>근저당권자 {labelBadge('creditorName')}</label>
                  <input type="text" className="form-input" placeholder="신한은행" value={creditorName} onChange={e => setCreditorName(e.target.value)} style={inputStyle('creditorName')} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>채권최고액 (원) {labelBadge('maxDebtLimit')}</label>
                  <input type="number" className="form-input" placeholder="1680000000" value={maxDebtLimit} onChange={e => setMaxDebtLimit(e.target.value)} style={inputStyle('maxDebtLimit')} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>채무자 {labelBadge('debtorName')}</label>
                  <input type="text" className="form-input" placeholder="주식회사 이조원" value={debtorName} onChange={e => setDebtorName(e.target.value)} style={inputStyle('debtorName')} />
                </div>
              </div>

              {/* 버튼 */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                  {uploading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> PDF 저장 중...</> : <><CheckCircle2 size={16} /> 등록 완료</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 스핀 애니메이션 */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PropertyManager;
