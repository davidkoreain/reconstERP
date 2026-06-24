import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { extractTextFromPdf, parseFinancialStatement } from '../lib/pdfParser';
import {
  Building2,
  MapPin,
  Plus,
  X,
  Edit,
  Briefcase,
  FileText,
  Landmark,
  TrendingUp,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import type { Corporation, Property, FinancialStatement } from '../types';

type FsUploadState = 'idle' | 'reading' | 'parsing' | 'done' | 'error';

export const CorporateLedger: React.FC = () => {
  const { corporations, properties, financialStatements, addCorporation, updateCorporation, addFinancialStatement, deleteFinancialStatement } = useApp();
  const [selectedCorpId, setSelectedCorpId] = useState<string>(
    corporations.length > 0 ? corporations[0].id : ''
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Corp Form State
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

  // FS Upload State
  const [showFsModal, setShowFsModal] = useState(false);
  const [fsFile, setFsFile] = useState<File | null>(null);
  const [fsState, setFsState] = useState<FsUploadState>('idle');
  const [fsError, setFsError] = useState('');
  const [isDraggingFs, setIsDraggingFs] = useState(false);
  const [fsSaving, setFsSaving] = useState(false);
  const [fsAutoFilled, setFsAutoFilled] = useState<Set<string>>(new Set());
  const [fsFiscalYear, setFsFiscalYear] = useState('');
  const [fsRevenue, setFsRevenue] = useState('');
  const [fsOperatingIncome, setFsOperatingIncome] = useState('');
  const [fsNetIncome, setFsNetIncome] = useState('');
  const [fsTotalAssets, setFsTotalAssets] = useState('');
  const [fsTotalLiabilities, setFsTotalLiabilities] = useState('');
  const [fsEquity, setFsEquity] = useState('');
  const fsFileInputRef = useRef<HTMLInputElement>(null);

  const selectedCorp: Corporation = corporations.find(c => c.id === selectedCorpId) || corporations[0];
  const corpStatements: FinancialStatement[] = financialStatements
    .filter(fs => fs.corporationId === selectedCorp?.id)
    .sort((a, b) => b.fiscalYear.localeCompare(a.fiscalYear));

  const formatKRW = (value?: number) => {
    if (value === undefined || value === null) return '-';
    const abs = Math.abs(value);
    let str = '';
    if (abs >= 100000000) {
      const eok = Math.floor(abs / 100000000);
      const man = Math.floor((abs % 100000000) / 10000);
      str = `${eok}억 ${man > 0 ? man + '만' : ''}원`;
    } else {
      str = `${abs.toLocaleString()}원`;
    }
    return value < 0 ? `-${str}` : str;
  };

  // ─── Corp Add/Edit ─────────────────────────────────────────────────────

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bizNumber || !representative) { alert('필수 정보를 입력해주세요.'); return; }
    addCorporation({
      name, regNumber, bizNumber, representative, address, capital: Number(capital) || 0,
      revenue: Number(revenue) || 0, netIncome: Number(netIncome) || 0,
      totalAssets: Number(totalAssets) || 0, totalLiabilities: Number(totalLiabilities) || 0,
      fiscalYear: fiscalYear || new Date().toISOString().split('T')[0]
    });
    setName(''); setRegNumber(''); setBizNumber(''); setRepresentative('');
    setAddress(''); setCapital(''); setRevenue(''); setNetIncome('');
    setTotalAssets(''); setTotalLiabilities(''); setFiscalYear('');
    setShowAddModal(false);
  };

  const openEditModal = () => {
    if (!selectedCorp) return;
    setName(selectedCorp.name); setRegNumber(selectedCorp.regNumber);
    setBizNumber(selectedCorp.bizNumber); setRepresentative(selectedCorp.representative);
    setAddress(selectedCorp.address); setCapital(selectedCorp.capital.toString());
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
      id: selectedCorp.id, name, regNumber, bizNumber, representative, address,
      capital: Number(capital) || 0, revenue: Number(revenue) || 0,
      netIncome: Number(netIncome) || 0, totalAssets: Number(totalAssets) || 0,
      totalLiabilities: Number(totalLiabilities) || 0,
      fiscalYear: fiscalYear || selectedCorp.fiscalYear
    });
    setShowEditModal(false);
  };

  // ─── FS PDF OCR ────────────────────────────────────────────────────────

  const resetFsModal = () => {
    setFsFile(null); setFsState('idle'); setFsError('');
    setFsFiscalYear(''); setFsRevenue(''); setFsOperatingIncome('');
    setFsNetIncome(''); setFsTotalAssets(''); setFsTotalLiabilities(''); setFsEquity('');
    setFsAutoFilled(new Set());
  };

  const processFsFile = useCallback(async (file: File) => {
    if (!file.type.includes('pdf')) {
      setFsError('PDF 파일만 업로드 가능합니다.'); setFsState('error'); return;
    }
    setFsFile(file); setFsState('reading'); setFsError('');
    try {
      const text = await extractTextFromPdf(file);
      setFsState('parsing');
      const parsed = parseFinancialStatement(text);
      const filled = new Set<string>();
      const fill = (setter: React.Dispatch<React.SetStateAction<string>>, val: number | string | undefined, key: string) => {
        if (val !== undefined && val !== '') { setter(String(val)); filled.add(key); }
      };
      fill(setFsFiscalYear, parsed.fiscalYear, 'fiscalYear');
      fill(setFsRevenue, parsed.revenue, 'revenue');
      fill(setFsOperatingIncome, parsed.operatingIncome, 'operatingIncome');
      fill(setFsNetIncome, parsed.netIncome, 'netIncome');
      fill(setFsTotalAssets, parsed.totalAssets, 'totalAssets');
      fill(setFsTotalLiabilities, parsed.totalLiabilities, 'totalLiabilities');
      fill(setFsEquity, parsed.equity, 'equity');
      setFsAutoFilled(filled);
      setFsState('done');
    } catch {
      setFsState('error');
      setFsError('PDF 파싱 중 오류가 발생했습니다. 텍스트 기반 PDF인지 확인해 주세요.');
    }
  }, []);

  const handleFsDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDraggingFs(false);
    const file = e.dataTransfer.files[0];
    if (file) processFsFile(file);
  };

  const handleFsSave = async () => {
    if (!selectedCorp || !fsFiscalYear) { alert('회계연도를 입력해주세요.'); return; }
    setFsSaving(true);
    try {
      let documentUrl: string | undefined;
      if (fsFile) {
        const path = `${selectedCorp.id}/${fsFiscalYear}_${Date.now()}.pdf`;
        const { error: upErr } = await supabase.storage.from('financial-docs').upload(path, fsFile, { upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('financial-docs').getPublicUrl(path);
          documentUrl = urlData?.publicUrl;
        }
      }
      await addFinancialStatement({
        corporationId: selectedCorp.id,
        fiscalYear: fsFiscalYear,
        revenue: Number(fsRevenue) || undefined,
        operatingIncome: Number(fsOperatingIncome) || undefined,
        netIncome: Number(fsNetIncome) || undefined,
        totalAssets: Number(fsTotalAssets) || undefined,
        totalLiabilities: Number(fsTotalLiabilities) || undefined,
        equity: Number(fsEquity) || undefined,
        documentUrl,
      });
      setShowFsModal(false);
      resetFsModal();
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setFsSaving(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────

  const totalCapital = corporations.reduce((sum, c) => sum + (c.capital || 0), 0);
  const totalCorpAssets = corporations.reduce((sum, c) => sum + (c.totalAssets || 0), 0);
  const totalCorpRevenues = corporations.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const ownedProperties: Property[] = selectedCorp
    ? properties.filter(p => p.ownerCorpId === selectedCorp.id)
    : [];

  const autoStyle = (key: string): React.CSSProperties => fsAutoFilled.has(key)
    ? { border: '1px solid hsl(var(--success))', boxShadow: '0 0 0 1px hsl(var(--success) / 0.3)' }
    : {};

  const OcrBadge = () => (
    <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(16,185,129,0.15)', color: 'hsl(var(--success))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '3px', padding: '0.05rem 0.3rem' }}>
      ✦ OCR
    </span>
  );

  const FsField = ({ label, value, setter, fieldKey, placeholder = '' }: {
    label: string; value: string; setter: React.Dispatch<React.SetStateAction<string>>;
    fieldKey: string; placeholder?: string;
  }) => (
    <div className="form-group">
      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        {label} {fsAutoFilled.has(fieldKey) && <OcrBadge />}
      </label>
      <input
        type="number"
        className="form-input"
        style={autoStyle(fieldKey)}
        placeholder={placeholder}
        value={value}
        onChange={e => {
          setter(e.target.value);
          if (fsAutoFilled.has(fieldKey)) { const n = new Set(fsAutoFilled); n.delete(fieldKey); setFsAutoFilled(n); }
        }}
      />
    </div>
  );

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>법인 대장 및 부동산 관리</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            법인 등기부 정보와 연도별 재무제표 PDF 이력, 법인 소유 부동산 포트폴리오를 연계하여 관리합니다.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> 신규 법인 등록
        </button>
      </div>

      {/* KPI */}
      <div className="grid-cols-3">
        {[
          { icon: <Building2 size={24} />, color: 'rgba(99,102,241,0.1)', iconColor: 'hsl(var(--brand-primary))', label: '관리 법인 수', value: `${corporations.length}개 법인`, sub: '자산대장 실시간 연동', subColor: 'hsl(var(--text-muted))' },
          { icon: <Landmark size={24} />, color: 'rgba(16,185,129,0.1)', iconColor: 'hsl(var(--success))', label: '총 법인 자본금 합계', value: formatKRW(totalCapital), sub: '설립 등기 기준 총액', subColor: 'hsl(var(--text-muted))' },
          { icon: <TrendingUp size={24} />, color: 'rgba(59,130,246,0.1)', iconColor: 'hsl(var(--info))', label: '총 자산 및 매출 규모', value: `자산 ${formatKRW(totalCorpAssets)}`, sub: `연 매출액: ${formatKRW(totalCorpRevenues)}`, subColor: 'hsl(var(--info))' },
        ].map(({ icon, color, iconColor, label, value, sub, subColor }) => (
          <div key={label} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: color, color: iconColor }}>{icon}</div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>{label}</p>
              <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{value}</h3>
              <p style={{ fontSize: '0.7rem', color: subColor, marginTop: '0.15rem' }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '1.5rem' }}>

        {/* Left: Corp List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem' }}>법인 목록</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {corporations.map(corp => {
              const corpProps = properties.filter(p => p.ownerCorpId === corp.id);
              const corpFss = financialStatements.filter(fs => fs.corporationId === corp.id);
              const isSelected = corp.id === selectedCorpId;
              return (
                <div key={corp.id} className="glass-card" onClick={() => setSelectedCorpId(corp.id)} style={{ cursor: 'pointer', border: isSelected ? '1px solid hsl(var(--brand-primary))' : '1px solid hsl(var(--border-color))', backgroundColor: isSelected ? 'rgba(99,102,241,0.08)' : 'hsl(var(--bg-secondary))', transition: 'all 0.2s ease', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: isSelected ? 'hsl(var(--brand-primary))' : 'white' }}>{corp.name}</h5>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{corpProps.length}개 부동산</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.5rem' }}>대표자: {corp.representative}</p>
                  <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>사업자번호: {corp.bizNumber}</p>
                  {corpFss.length > 0 && (
                    <p style={{ fontSize: '0.65rem', color: 'hsl(var(--success))', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <BarChart3 size={10} /> 재무제표 {corpFss.length}개 연도 등록
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detail */}
        {selectedCorp ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Corp Profile */}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: '법인 등록 번호', value: selectedCorp.regNumber },
                  { label: '사업자 등록 번호', value: selectedCorp.bizNumber },
                  { label: '대표이사', value: selectedCorp.representative },
                  { label: '설립 자본금', value: formatKRW(selectedCorp.capital) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white' }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>본점 소재지</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={14} style={{ color: 'hsl(var(--brand-primary))' }} /> {selectedCorp.address}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── 연도별 재무제표 이력 ─────────────────────────────────────── */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <BarChart3 size={18} style={{ color: 'hsl(var(--brand-primary))' }} /> 연도별 재무제표 업로드 이력
                </h4>
                <button className="btn btn-secondary" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem' }} onClick={() => { resetFsModal(); setShowFsModal(true); }}>
                  <Upload size={14} /> PDF 업로드
                </button>
              </div>

              {corpStatements.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border-color))' }}>
                        {['회계연도', '매출액', '영업이익', '당기순이익', '자산총계', '부채총계', '자본총계', ''].map(h => (
                          <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {corpStatements.map(fs => (
                        <tr key={fs.id} style={{ borderBottom: '1px solid hsl(var(--border-color) / 0.4)' }}>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'white' }}>{fs.fiscalYear}년</td>
                          <td style={{ padding: '0.6rem 0.75rem', color: 'hsl(var(--success))' }}>{formatKRW(fs.revenue)}</td>
                          <td style={{ padding: '0.6rem 0.75rem', color: (fs.operatingIncome ?? 0) < 0 ? 'hsl(var(--danger))' : 'hsl(var(--info))' }}>{formatKRW(fs.operatingIncome)}</td>
                          <td style={{ padding: '0.6rem 0.75rem', color: (fs.netIncome ?? 0) < 0 ? 'hsl(var(--danger))' : 'hsl(var(--brand-primary))' }}>{formatKRW(fs.netIncome)}</td>
                          <td style={{ padding: '0.6rem 0.75rem', color: 'white' }}>{formatKRW(fs.totalAssets)}</td>
                          <td style={{ padding: '0.6rem 0.75rem', color: 'hsl(var(--danger))' }}>{formatKRW(fs.totalLiabilities)}</td>
                          <td style={{ padding: '0.6rem 0.75rem', color: 'hsl(var(--success))' }}>{formatKRW(fs.equity)}</td>
                          <td style={{ padding: '0.6rem 0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              {fs.documentUrl && (
                                <a href={fs.documentUrl} target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--info))', display: 'flex', alignItems: 'center' }} title="PDF 보기">
                                  <ExternalLink size={13} />
                                </a>
                              )}
                              <button
                                onClick={() => { if (confirm(`${fs.fiscalYear}년 재무제표를 삭제하시겠습니까?`)) deleteFinancialStatement(fs.id); }}
                                style={{ background: 'none', border: 'none', color: 'hsl(var(--danger))', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: 0.7 }}
                                title="삭제"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))', border: '1px dashed hsl(var(--border-color))', borderRadius: 'var(--radius-sm)' }}>
                  <BarChart3 size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.85rem' }}>아직 업로드된 재무제표가 없습니다.</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>위 PDF 업로드 버튼을 눌러 재무제표를 추가해 주세요.</p>
                </div>
              )}
            </div>

            {/* Financial Summary (수기 입력) */}
            {(selectedCorp.revenue || selectedCorp.totalAssets) ? (
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileText size={18} style={{ color: 'hsl(var(--success))' }} /> 재무 제표 요약 (수기입력)
                  </h4>
                  {selectedCorp.fiscalYear && <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>기준: {selectedCorp.fiscalYear}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {[
                    { label: '연 매출액', value: selectedCorp.revenue, color: 'hsl(var(--success))' },
                    { label: '당기순이익', value: selectedCorp.netIncome, color: 'hsl(var(--brand-primary))' },
                    { label: '자산 총계', value: selectedCorp.totalAssets, color: 'white' },
                    { label: '부채 총계', value: selectedCorp.totalLiabilities, color: 'hsl(var(--danger))' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
                      <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>{label}</span>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, color, marginTop: '0.15rem' }}>{formatKRW(value)}</p>
                    </div>
                  ))}
                </div>
                {selectedCorp.totalAssets && selectedCorp.totalLiabilities ? (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'hsl(var(--text-secondary))' }}>
                      <span>부채비율 (부채/자산)</span>
                      <span style={{ fontWeight: 600, color: 'white' }}>{Math.round((selectedCorp.totalLiabilities / selectedCorp.totalAssets) * 100)}%</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'hsl(var(--bg-tertiary))', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${Math.min(100, (selectedCorp.totalLiabilities / selectedCorp.totalAssets) * 100)}%`, backgroundColor: 'hsl(var(--danger))' }} />
                      <div style={{ flex: 1, backgroundColor: 'hsl(var(--success))' }} />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Owned Properties */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Briefcase size={18} style={{ color: 'hsl(var(--info))' }} /> 법인 소유 부동산 자산 목록 ({ownedProperties.length})
              </h4>
              {ownedProperties.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {ownedProperties.map(prop => {
                    const ltv = Math.round((prop.mortgageAmount / prop.valuation) * 100);
                    return (
                      <div key={prop.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.5fr', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid hsl(var(--border-color))', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'white' }}>{prop.name}</p>
                            {prop.ownershipRestrictions && prop.ownershipRestrictions !== '없음' && (
                              <span style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: 'hsl(var(--danger))', border: '1px solid rgba(239,68,68,0.3)', padding: '0.1rem 0.3rem', borderRadius: '2px', fontSize: '0.6rem', fontWeight: 700 }}>권리제한</span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))', display: 'flex', gap: '0.4rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><MapPin size={10} /> {prop.address.substring(0, 15)}...</span>
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
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--danger))' }}>{formatKRW(prop.mortgageAmount)} ({ltv}%)</span>
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

      {/* ═══ 재무제표 PDF 업로드 모달 ════════════════════════════════════════ */}
      {showFsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '680px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={20} style={{ color: 'hsl(var(--brand-primary))' }} />
                재무제표 PDF 업로드 — {selectedCorp?.name}
              </h3>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => { setShowFsModal(false); resetFsModal(); }}><X size={20} /></button>
            </div>

            {/* Drop Zone */}
            {(fsState === 'idle' || fsState === 'error') && (
              <div
                onDragOver={e => { e.preventDefault(); setIsDraggingFs(true); }}
                onDragLeave={() => setIsDraggingFs(false)}
                onDrop={handleFsDrop}
                onClick={() => fsFileInputRef.current?.click()}
                style={{ border: `2px dashed ${isDraggingFs ? 'hsl(var(--brand-primary))' : 'hsl(var(--border-color))'}`, borderRadius: 'var(--radius-sm)', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: isDraggingFs ? 'rgba(99,102,241,0.05)' : 'transparent' }}
              >
                <input ref={fsFileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) processFsFile(f); }} />
                <Upload size={36} style={{ margin: '0 auto 1rem', color: 'hsl(var(--text-muted))', opacity: 0.6 }} />
                <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>재무제표 PDF를 드래그하거나 클릭하여 업로드</p>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.5rem' }}>손익계산서 · 재무상태표 포함 PDF (전자공시 DART, 세무사 발급 등)</p>
                {fsState === 'error' && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--danger))', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={14} /> {fsError}
                  </div>
                )}
              </div>
            )}

            {/* Loading */}
            {(fsState === 'reading' || fsState === 'parsing') && (
              <div style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Loader2 size={36} style={{ color: 'hsl(var(--brand-primary))', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'hsl(var(--text-secondary))' }}>{fsState === 'reading' ? 'PDF 텍스트 추출 중...' : '재무 데이터 분석 중...'}</p>
              </div>
            )}

            {/* Done: Review Form */}
            {fsState === 'done' && (
              <>
                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'hsl(var(--success))' }}>
                  <CheckCircle2 size={16} />
                  {fsFile?.name} — OCR 완료 ({fsAutoFilled.size}개 필드 자동 입력). 내용을 확인 후 저장하세요.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--brand-primary))', fontWeight: 600 }}>1. 기본 정보</h4>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      회계연도 * {fsAutoFilled.has('fiscalYear') && <span style={{ fontSize: '0.6rem', backgroundColor: 'rgba(16,185,129,0.15)', color: 'hsl(var(--success))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '3px', padding: '0.05rem 0.3rem' }}>✦ OCR</span>}
                    </label>
                    <input type="text" className="form-input" style={autoStyle('fiscalYear')} placeholder="예: 2024" value={fsFiscalYear} onChange={e => { setFsFiscalYear(e.target.value); if (fsAutoFilled.has('fiscalYear')) { const n = new Set(fsAutoFilled); n.delete('fiscalYear'); setFsAutoFilled(n); } }} required />
                  </div>

                  <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--success))', fontWeight: 600 }}>2. 손익계산서</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FsField label="매출액 (원)" value={fsRevenue} setter={setFsRevenue} fieldKey="revenue" placeholder="예: 5000000000" />
                    <FsField label="영업이익 (원)" value={fsOperatingIncome} setter={setFsOperatingIncome} fieldKey="operatingIncome" placeholder="예: 800000000" />
                    <FsField label="당기순이익 (원)" value={fsNetIncome} setter={setFsNetIncome} fieldKey="netIncome" placeholder="예: 600000000" />
                  </div>

                  <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--info))', fontWeight: 600 }}>3. 재무상태표</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <FsField label="자산총계 (원)" value={fsTotalAssets} setter={setFsTotalAssets} fieldKey="totalAssets" placeholder="예: 10000000000" />
                    <FsField label="부채총계 (원)" value={fsTotalLiabilities} setter={setFsTotalLiabilities} fieldKey="totalLiabilities" placeholder="예: 6000000000" />
                    <FsField label="자본총계 (원)" value={fsEquity} setter={setFsEquity} fieldKey="equity" placeholder="예: 4000000000" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => { setFsState('idle'); setFsFile(null); }}>다시 업로드</button>
                  <div style={{ flex: 1 }} />
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowFsModal(false); resetFsModal(); }}>취소</button>
                  <button type="button" className="btn btn-primary" onClick={handleFsSave} disabled={fsSaving || !fsFiscalYear} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {fsSaving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 저장 중...</> : '재무제표 저장'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ 신규 법인 등록 모달 ═══════════════════════════════════════════ */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={20} /> 신규 법인 등록</h3>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--brand-primary))', fontWeight: 600 }}>1. 법인 기본 등기 정보</h4>
              </div>
              <div className="form-group"><label className="form-label">법인명 *</label><input type="text" className="form-input" placeholder="예: 주식회사 이조원" value={name} onChange={e => setName(e.target.value)} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">대표이사 *</label><input type="text" className="form-input" placeholder="예: 이조원" value={representative} onChange={e => setRepresentative(e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">자본금 (원)</label><input type="number" className="form-input" placeholder="예: 500000000" value={capital} onChange={e => setCapital(e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">법인등록번호</label><input type="text" className="form-input" placeholder="예: 110111-2345678" value={regNumber} onChange={e => setRegNumber(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">사업자등록번호 *</label><input type="text" className="form-input" placeholder="예: 104-81-12345" value={bizNumber} onChange={e => setBizNumber(e.target.value)} required /></div>
              </div>
              <div className="form-group"><label className="form-label">본점 소재지 주소</label><input type="text" className="form-input" placeholder="예: 서울특별시 중구 을지로 88" value={address} onChange={e => setAddress(e.target.value)} /></div>
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--success))', fontWeight: 600 }}>2. 재무 지표 (선택 — PDF로 나중에 추가 가능)</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">연 매출액 (원)</label><input type="number" className="form-input" placeholder="예: 1200000000" value={revenue} onChange={e => setRevenue(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">당기순이익 (원)</label><input type="number" className="form-input" placeholder="예: 180000000" value={netIncome} onChange={e => setNetIncome(e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">자산 총계 (원)</label><input type="number" className="form-input" placeholder="예: 5000000000" value={totalAssets} onChange={e => setTotalAssets(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">부채 총계 (원)</label><input type="number" className="form-input" placeholder="예: 2000000000" value={totalLiabilities} onChange={e => setTotalLiabilities(e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">결산 기준일</label><input type="text" className="form-input" placeholder="예: 2025-12-31" value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>법인 등록 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ 법인 정보 수정 모달 ═══════════════════════════════════════════ */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Building2 size={20} /> 법인 정보 수정</h3>
              <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--brand-primary))', fontWeight: 600 }}>1. 법인 기본 등기 정보</h4>
              </div>
              <div className="form-group"><label className="form-label">법인명 *</label><input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">대표이사 *</label><input type="text" className="form-input" value={representative} onChange={e => setRepresentative(e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">자본금 (원)</label><input type="number" className="form-input" value={capital} onChange={e => setCapital(e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">법인등록번호</label><input type="text" className="form-input" value={regNumber} onChange={e => setRegNumber(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">사업자등록번호 *</label><input type="text" className="form-input" value={bizNumber} onChange={e => setBizNumber(e.target.value)} required /></div>
              </div>
              <div className="form-group"><label className="form-label">본점 소재지 주소</label><input type="text" className="form-input" value={address} onChange={e => setAddress(e.target.value)} /></div>
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'hsl(var(--success))', fontWeight: 600 }}>2. 재무 지표</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">연 매출액 (원)</label><input type="number" className="form-input" value={revenue} onChange={e => setRevenue(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">당기순이익 (원)</label><input type="number" className="form-input" value={netIncome} onChange={e => setNetIncome(e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group"><label className="form-label">자산 총계 (원)</label><input type="number" className="form-input" value={totalAssets} onChange={e => setTotalAssets(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">부채 총계 (원)</label><input type="number" className="form-input" value={totalLiabilities} onChange={e => setTotalLiabilities(e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">결산 기준일</label><input type="text" className="form-input" value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} /></div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>정보 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CorporateLedger;
