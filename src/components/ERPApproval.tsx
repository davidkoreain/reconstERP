import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileCheck, PenTool, XCircle, ArrowRight, UserCheck } from 'lucide-react';

export const ERPApproval: React.FC = () => {
  const { approvalItems, approveItem, rejectItem, currentUser, properties } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(approvalItems[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Closed'>('Pending');

  // Filter items based on tab
  const filteredItems = approvalItems.filter(item => {
    if (activeTab === 'Pending') {
      return item.status === 'Pending';
    } else {
      return item.status === 'Approved' || item.status === 'Rejected';
    }
  });

  const selectedItem = approvalItems.find(item => item.id === selectedId);

  // Check if current user is the pending signer
  const isCurrentSigner = selectedItem 
    ? selectedItem.status === 'Pending' && selectedItem.approvalLine[selectedItem.currentSignerIdx]?.userName === currentUser.name 
    : false;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>ERP 전자 결재 라인</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            자산 지출 및 중요 보고 사항에 대해 부서 간 검토 및 승인을 수행합니다. (현재 접속 계정: <strong>{currentUser.name} [{currentUser.position}]</strong>)
          </p>
        </div>

        {/* Tab triggers */}
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'hsl(var(--bg-secondary))', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
          <button 
            className={`btn ${activeTab === 'Pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            onClick={() => { setActiveTab('Pending'); setSelectedId(null); }}
          >
            결재 대기함
          </button>
          <button 
            className={`btn ${activeTab === 'Closed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            onClick={() => { setActiveTab('Closed'); setSelectedId(null); }}
          >
            결재 완료함
          </button>
        </div>
      </div>

      <div className="grid-cols-1-2">
        {/* Left: Document List */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>결재 문서 목록</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => {
                const isActive = item.id === selectedId;
                const isMyTurn = item.status === 'Pending' && item.approvalLine[item.currentSignerIdx]?.userName === currentUser.name;

                return (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isActive ? 'rgba(99,102,241,0.1)' : 'hsl(var(--bg-tertiary))',
                      border: isActive ? '1px solid hsl(var(--brand-primary))' : isMyTurn ? '1px solid hsl(var(--warning))' : '1px solid hsl(var(--border-color))',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      position: 'relative'
                    }}
                  >
                    {isMyTurn && (
                      <span className="badge badge-warning" style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.6rem' }}>
                        내 결재 차례
                      </span>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.title}
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                        <span>기안자: {item.drafter}</span>
                        <span>•</span>
                        <span>{item.createdAt}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {item.amount ? (
                        <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{item.amount.toLocaleString()}원</span>
                      ) : (
                        <span style={{ color: 'hsl(var(--text-muted))' }}>일반 보고문서</span>
                      )}

                      <span className={`badge ${
                        item.status === 'Pending' ? 'badge-warning' : 
                        item.status === 'Approved' ? 'badge-success' : 'badge-danger'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {item.status === 'Pending' ? '결재 대기' : item.status === 'Approved' ? '최종 승인' : '기안 반려'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                보관함이 비어 있습니다.
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Document Detail Review */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedItem ? (
            <>
              {/* Doc Title & Info */}
              <div style={{ borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span className={`badge ${selectedItem.type === 'Expense' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>
                  {selectedItem.type === 'Expense' ? '지출 결재' : '문서 결재'}
                </span>
                <h3 style={{ fontSize: '1.35rem', color: 'white' }}>{selectedItem.title}</h3>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
                  <span>기안자: {selectedItem.drafter}</span>
                  <span>•</span>
                  <span>상신일자: {selectedItem.createdAt}</span>
                </div>
              </div>

              {/* Approval Line Tracker (Stepper UI) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <UserCheck size={14} /> ERP 결재 라인 현황
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', backgroundColor: 'hsl(var(--bg-tertiary))', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--border-color))' }}>
                  {selectedItem.approvalLine.map((step, idx) => {
                    const isCurrent = selectedItem.status === 'Pending' && selectedItem.currentSignerIdx === idx;
                    
                    return (
                      <React.Fragment key={idx}>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: isCurrent ? '1px solid hsl(var(--warning))' : '1px solid transparent',
                          backgroundColor: isCurrent ? 'rgba(245,158,11,0.05)' : 'transparent'
                        }}>
                          <span style={{ fontSize: '0.6rem', color: 'hsl(var(--text-muted))' }}>{step.role}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', marginTop: '0.1rem' }}>{step.userName}</span>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            marginTop: '0.15rem',
                            color: step.status === 'Signed' ? 'hsl(var(--success))' : step.status === 'Rejected' ? 'hsl(var(--danger))' : 'hsl(var(--warning))'
                          }}>
                            {step.status === 'Signed' ? '서명완료' : step.status === 'Rejected' ? '반려됨' : '대기중'}
                          </span>
                        </div>
                        {idx < selectedItem.approvalLine.length - 1 && <ArrowRight size={14} style={{ color: 'hsl(var(--text-muted))' }} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Document Text Content */}
              <div style={{ flex: 1, backgroundColor: 'hsl(var(--bg-tertiary))', border: '1px solid hsl(var(--border-color))', borderRadius: 'var(--radius-sm)', padding: '1.25rem', fontSize: '0.85rem', lineHeight: '1.6', color: 'hsl(var(--text-primary))', whiteSpace: 'pre-wrap', minHeight: '150px' }}>
                {selectedItem.content}
              </div>

              {/* Expense details summary if applicable */}
              {selectedItem.type === 'Expense' && selectedItem.expenseData && (
                <div style={{ border: '1px solid hsl(var(--border-color))', borderRadius: 'var(--radius-sm)', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
                  <span style={{ fontWeight: 600, color: 'white' }}>지출 세부 명세</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>신청 금액:</span>
                    <span style={{ fontWeight: 600 }}>{selectedItem.expenseData.amount.toLocaleString()}원</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>일자:</span>
                    <span>{selectedItem.expenseData.date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>소속 부동산:</span>
                    <span>
                      {selectedItem.expenseData.propertyId 
                        ? properties.find(p => p.id === selectedItem.expenseData?.propertyId)?.name 
                        : '사무국 공통'}
                    </span>
                  </div>
                </div>
              )}

              {/* Approvals Action Buttons panel */}
              {selectedItem.status === 'Pending' && (
                <div style={{ 
                  borderTop: '1px solid hsl(var(--border-color))', 
                  paddingTop: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {isCurrentSigner ? (
                    <>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => rejectItem(selectedItem.id)}>
                          <XCircle size={16} /> 반려하기
                        </button>
                        <button className="btn btn-success" style={{ flex: 1 }} onClick={() => approveItem(selectedItem.id)}>
                          <PenTool size={16} /> 결재 서명하기
                        </button>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'hsl(var(--warning))', textAlign: 'center' }}>
                        * 본인 서명 시 결재 라인의 다음 검토자에게 문서가 이송됩니다.
                      </span>
                    </>
                  ) : (
                    <div style={{ 
                      backgroundColor: 'rgba(255,255,255,0.02)', 
                      border: '1px dashed hsl(var(--border-color))', 
                      padding: '1rem', 
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      color: 'hsl(var(--text-secondary))'
                    }}>
                      현재 결재 대기 중인 결재권자가 아닙니다. (대기자: <strong>{selectedItem.approvalLine[selectedItem.currentSignerIdx]?.userName}</strong>)
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '350px', color: 'hsl(var(--text-muted))', gap: '0.5rem' }}>
              <FileCheck size={40} strokeWidth={1} />
              <span style={{ fontSize: '0.85rem' }}>검토할 결재 문서를 왼쪽 목록에서 선택하세요.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ERPApproval;
