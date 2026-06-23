import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Trash2, Calendar, ClipboardCheck, Send } from 'lucide-react';

export const ExpenseManager: React.FC = () => {
  const { expenses, addExpense, submitExpenseForApproval, deleteExpense, properties, currentUser } = useApp();
  
  // Form fields state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Labor' | 'Maintenance' | 'Utility' | 'Tax' | 'RehabDebt' | 'Other'>('Maintenance');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [description, setDescription] = useState('');
  const [routeToApproval, setRouteToApproval] = useState(true); // Default to route to ERP line

  // Category Translators
  const categoryLabels = {
    Labor: '인건비',
    Maintenance: '수선유지비',
    Utility: '공과금/관리비',
    Tax: '세금/공과금',
    RehabDebt: '회생채무변제',
    Other: '기타비용'
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !date) {
      alert('필수 입력 항목을 확인해 주세요.');
      return;
    }

    const payload = {
      title,
      category,
      amount: Number(amount),
      date,
      propertyId: propertyId || undefined,
      description
    };

    if (routeToApproval) {
      // Create ERP Approval Document
      const content = `${categoryLabels[category]} 결재 건입니다.
사유: ${description}
지출 대상 자산: ${propertyId ? properties.find(p => p.id === propertyId)?.name : '사무국/공통'}
예정 일자: ${date}
신청인: ${currentUser.name} (${currentUser.position})`;

      submitExpenseForApproval(payload, `[지출기안] ${title}`, content);
      alert('ERP 전자결재 라인에 기안문서가 전송되었습니다. [전자결재] 탭에서 단계별 서명을 완료해야 지출로 확정됩니다.');
    } else {
      // Standard Direct Input
      addExpense(payload);
      alert('지출 항목이 ERP 장부에 직접 반영되었습니다.');
    }

    // Reset Form
    setTitle('');
    setCategory('Maintenance');
    setAmount('');
    setDate('');
    setPropertyId('');
    setDescription('');
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>비용 및 지출 결재 관리</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
          인건비, 자산 수선비, 공과금 등의 비용을 지출 기안하고 ERP 결재 라인을 통해 집행합니다.
        </p>
      </div>

      <div className="grid-cols-1-2">
        {/* Left: Input Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.75rem' }}>
            <Plus size={18} /> 지출 기안서 작성
          </h3>

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">지출 및 기안명 *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="예: 7월 사무실 임차료 지급" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">비용 분류 *</label>
                <select 
                  className="form-select" 
                  value={category} 
                  onChange={e => setCategory(e.target.value as any)}
                >
                  <option value="Labor">인건비 (Salary)</option>
                  <option value="Maintenance">수선유지비 (Maintenance)</option>
                  <option value="Utility">공과금/관리비 (Utilities)</option>
                  <option value="Tax">세금/공과금 (Tax)</option>
                  <option value="RehabDebt">회생채무변제 (Rehab Debt)</option>
                  <option value="Other">기타비용 (Other)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">해당 부동산 자산</label>
                <select 
                  className="form-select" 
                  value={propertyId} 
                  onChange={e => setPropertyId(e.target.value)}
                >
                  <option value="">사무국 공통 / 해당없음</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">지출 금액 (원) *</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="금액 입력" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">지출(예정) 일자 *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">상세 내용 및 사유</label>
              <textarea 
                className="form-textarea" 
                rows={3} 
                placeholder="지출에 대한 상세 근거 자료 혹은 사유를 기입하세요."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Approval Routing Options */}
            <div style={{ 
              backgroundColor: 'hsl(var(--bg-tertiary))', 
              padding: '0.85rem 1rem', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border-color))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>전자결재 라인 기안</span>
                <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-secondary))' }}>검토/결재자 승인을 거칩니다.</span>
              </div>
              <input 
                type="checkbox" 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={routeToApproval}
                onChange={e => setRouteToApproval(e.target.checked)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
              {routeToApproval ? <Send size={16} /> : <ClipboardCheck size={16} />}
              {routeToApproval ? 'ERP 전자 결재 기안' : '장부에 직접 반영'}
            </button>
          </form>
        </div>

        {/* Right: Expense Ledger */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.75rem' }}>
            승인 완료 지출 대장
          </h3>

          <div className="custom-table-wrapper" style={{ flex: 1 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>지출명</th>
                  <th>분류</th>
                  <th>금액</th>
                  <th>일자</th>
                  <th>지출자산</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map(exp => (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: 500 }}>{exp.title}</td>
                      <td>
                        <span className={`badge ${
                          exp.category === 'Labor' ? 'badge-info' : 
                          exp.category === 'RehabDebt' ? 'badge-danger' : 
                          exp.category === 'Maintenance' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {categoryLabels[exp.category]}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                        {exp.amount.toLocaleString()}원
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                          <Calendar size={12} /> {exp.date}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                        {exp.propertyId ? properties.find(p => p.id === propertyId)?.name || '지정 자산' : '공통'}
                      </td>
                      <td>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '0.25rem', color: 'hsl(var(--danger))' }}
                          onClick={() => deleteExpense(exp.id)}
                          title="지출 삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
                      기록된 승인 지출 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ExpenseManager;
