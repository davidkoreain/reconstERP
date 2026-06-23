import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type {
  Property, Expense, Investor, ApprovalItem, Transaction,
  OCRDocument, User, Corporation, OCRDocType
} from '../types';

// ─── Row mappers (snake_case DB → camelCase TS) ───────────────────────────

const mapCorp = (r: Record<string, unknown>): Corporation => ({
  id: r.id as string,
  name: r.name as string,
  regNumber: (r.reg_number as string) ?? '',
  bizNumber: (r.biz_number as string) ?? '',
  representative: (r.representative as string) ?? '',
  address: (r.address as string) ?? '',
  capital: (r.capital as number) ?? 0,
  revenue: r.revenue as number | undefined,
  netIncome: r.net_income as number | undefined,
  totalAssets: r.total_assets as number | undefined,
  totalLiabilities: r.total_liabilities as number | undefined,
  fiscalYear: r.fiscal_year as string | undefined,
});

const mapProperty = (r: Record<string, unknown>): Property => ({
  id: r.id as string,
  name: r.name as string,
  address: r.address as string,
  acquisitionCost: (r.acquisition_cost as number) ?? 0,
  valuation: (r.valuation as number) ?? 0,
  mortgageAmount: (r.mortgage_amount as number) ?? 0,
  monthlyRent: (r.monthly_rent as number) ?? 0,
  monthlyMaintenance: (r.monthly_maintenance as number) ?? 0,
  tenantName: (r.tenant_name as string) ?? '',
  imageUrl: r.image_url as string | undefined,
  investorIds: (r.investor_ids as string[]) ?? [],
  ownerCorpId: r.owner_corp_id as string | undefined,
  purpose: r.purpose as string | undefined,
  area: r.area as number | undefined,
  structure: r.structure as string | undefined,
  acquisitionDate: r.acquisition_date as string | undefined,
  acquisitionReason: r.acquisition_reason as string | undefined,
  ownershipShare: r.ownership_share as string | undefined,
  ownershipRestrictions: r.ownership_restrictions as string | undefined,
  creditorName: r.creditor_name as string | undefined,
  maxDebtLimit: r.max_debt_limit as number | undefined,
  debtorName: r.debtor_name as string | undefined,
});

const mapInvestor = (r: Record<string, unknown>): Investor => ({
  id: r.id as string,
  name: r.name as string,
  capitalInvested: (r.capital_invested as number) ?? 0,
  ownershipRatio: (r.ownership_ratio as number) ?? 0,
  properties: (r.property_ids as string[]) ?? [],
  bankAccount: (r.bank_account as string) ?? '',
  totalDividendsPaid: (r.total_dividends_paid as number) ?? 0,
});

const mapExpense = (r: Record<string, unknown>): Expense => ({
  id: r.id as string,
  title: r.title as string,
  category: r.category as Expense['category'],
  amount: r.amount as number,
  date: r.date as string,
  propertyId: r.property_id as string | undefined,
  description: (r.description as string) ?? '',
  isApproved: (r.is_approved as boolean) ?? false,
  approvalId: r.approval_id as string | undefined,
});

const mapTransaction = (r: Record<string, unknown>): Transaction => ({
  id: r.id as string,
  type: r.type as Transaction['type'],
  title: r.title as string,
  amount: r.amount as number,
  date: r.date as string,
  category: (r.category as string) ?? '',
  isActual: (r.is_actual as boolean) ?? false,
  propertyId: r.property_id as string | undefined,
  referenceId: r.reference_id as string | undefined,
});

const mapApproval = (r: Record<string, unknown>): ApprovalItem => ({
  id: r.id as string,
  title: r.title as string,
  type: r.type as ApprovalItem['type'],
  content: (r.content as string) ?? '',
  amount: r.amount as number | undefined,
  drafter: r.drafter as string,
  createdAt: r.created_at as string,
  status: r.status as ApprovalItem['status'],
  approvalLine: (r.approval_line as ApprovalItem['approvalLine']) ?? [],
  currentSignerIdx: (r.current_signer_idx as number) ?? 0,
  expenseData: r.expense_data as ApprovalItem['expenseData'],
});

const mapOcr = (r: Record<string, unknown>): OCRDocument => ({
  id: r.id as string,
  fileName: r.file_name as string,
  fileSize: (r.file_size as string) ?? '',
  source: r.source as OCRDocument['source'],
  status: r.status as OCRDocument['status'],
  docType: r.doc_type as OCRDocType | undefined,
  parsedData: r.parsed_data as OCRDocument['parsedData'],
});

const mapUser = (r: Record<string, unknown>): User => ({
  id: r.id as string,
  name: r.name as string,
  role: r.role as User['role'],
  position: r.position as string,
});

// ─── Context Type ──────────────────────────────────────────────────────────

interface AppContextType {
  properties: Property[];
  expenses: Expense[];
  investors: Investor[];
  transactions: Transaction[];
  approvalItems: ApprovalItem[];
  ocrDocuments: OCRDocument[];
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  corporations: Corporation[];
  addCorporation: (corp: Omit<Corporation, 'id'>) => void;
  updateCorporation: (corp: Corporation) => void;
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
  googleClientId: string;
  setGoogleClientId: (id: string) => void;
  googleApiKey: string;
  setGoogleApiKey: (key: string) => void;
  addProperty: (property: Omit<Property, 'id'>) => void;
  updateProperty: (property: Property) => void;
  deleteProperty: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'isApproved'>) => void;
  submitExpenseForApproval: (expenseData: Omit<Expense, 'id' | 'isApproved' | 'approvalId'>, title: string, content: string) => void;
  deleteExpense: (id: string) => void;
  approveItem: (id: string) => void;
  rejectItem: (id: string) => void;
  addInvestor: (investor: Omit<Investor, 'id'>) => void;
  runSettlement: (propertyId: string, distributionAmount: number) => void;
  toggleTransactionActual: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  importOcrDocument: (doc: OCRDocument) => void;
  updateOcrDocumentType: (id: string, type: OCRDocType) => void;
  processOcrDocument: (id: string) => void;
  dbLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_USER: User = { id: '', name: '로딩 중', role: 'Drafter', position: '' };

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();

  const [dbLoading, setDbLoading] = useState(true);
  const [currentUser, setCurrentUserState] = useState<User>(DEFAULT_USER);
  const [users, setUsers] = useState<User[]>([]);
  const [corporations, setCorporations] = useState<Corporation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([]);
  const [ocrDocuments, setOcrDocuments] = useState<OCRDocument[]>([]);

  // Google OAuth (still local – doesn't need DB)
  const [googleAccessToken, setGoogleAccessTokenState] = useState<string | null>(
    () => localStorage.getItem('google_access_token')
  );
  const [googleClientId, setGoogleClientIdState] = useState(
    () => localStorage.getItem('google_client_id') || ''
  );
  const [googleApiKey, setGoogleApiKeyState] = useState(
    () => localStorage.getItem('google_api_key') || ''
  );

  const setGoogleAccessToken = (t: string | null) => {
    setGoogleAccessTokenState(t);
    t ? localStorage.setItem('google_access_token', t) : localStorage.removeItem('google_access_token');
  };
  const setGoogleClientId = (id: string) => { setGoogleClientIdState(id); localStorage.setItem('google_client_id', id); };
  const setGoogleApiKey   = (k: string)  => { setGoogleApiKeyState(k);  localStorage.setItem('google_api_key', k); };

  // ─── 초기 데이터 로드 ─────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setDbLoading(true);
    const [
      { data: profs },
      { data: corps },
      { data: props },
      { data: invs },
      { data: exps },
      { data: txs },
      { data: apprs },
      { data: ocrs },
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('corporations').select('*').order('created_at'),
      supabase.from('properties').select('*').order('created_at'),
      supabase.from('investors').select('*').order('created_at'),
      supabase.from('expenses').select('*').order('created_at'),
      supabase.from('transactions').select('*').order('date'),
      supabase.from('approval_items').select('*').order('created_at', { ascending: false }),
      supabase.from('ocr_documents').select('*').order('created_at', { ascending: false }),
    ]);

    const mappedUsers = (profs ?? []).map(r => mapUser(r as Record<string, unknown>));
    setUsers(mappedUsers);

    // 현재 로그인한 사용자를 currentUser로 설정
    const me = mappedUsers.find(u => u.id === authUser?.id);
    if (me) setCurrentUserState(me);

    setCorporations((corps ?? []).map(r => mapCorp(r as Record<string, unknown>)));
    setProperties((props ?? []).map(r => mapProperty(r as Record<string, unknown>)));
    setInvestors((invs ?? []).map(r => mapInvestor(r as Record<string, unknown>)));
    setExpenses((exps ?? []).map(r => mapExpense(r as Record<string, unknown>)));
    setTransactions((txs ?? []).map(r => mapTransaction(r as Record<string, unknown>)));
    setApprovalItems((apprs ?? []).map(r => mapApproval(r as Record<string, unknown>)));
    setOcrDocuments((ocrs ?? []).map(r => mapOcr(r as Record<string, unknown>)));
    setDbLoading(false);
  }, [authUser?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const setCurrentUser = (user: User) => setCurrentUserState(user);

  // ─── Corporations ──────────────────────────────────────────────────────
  const addCorporation = async (data: Omit<Corporation, 'id'>) => {
    const row = {
      name: data.name, reg_number: data.regNumber, biz_number: data.bizNumber,
      representative: data.representative, address: data.address, capital: data.capital,
      revenue: data.revenue, net_income: data.netIncome, total_assets: data.totalAssets,
      total_liabilities: data.totalLiabilities, fiscal_year: data.fiscalYear,
    };
    const { data: inserted } = await supabase.from('corporations').insert(row).select().single();
    if (inserted) setCorporations(prev => [...prev, mapCorp(inserted as Record<string, unknown>)]);
  };

  const updateCorporation = async (corp: Corporation) => {
    const row = {
      name: corp.name, reg_number: corp.regNumber, biz_number: corp.bizNumber,
      representative: corp.representative, address: corp.address, capital: corp.capital,
      revenue: corp.revenue, net_income: corp.netIncome, total_assets: corp.totalAssets,
      total_liabilities: corp.totalLiabilities, fiscal_year: corp.fiscalYear,
    };
    await supabase.from('corporations').update(row).eq('id', corp.id);
    setCorporations(prev => prev.map(c => c.id === corp.id ? corp : c));
  };

  // ─── Properties ───────────────────────────────────────────────────────
  const addProperty = async (data: Omit<Property, 'id'>) => {
    const row = {
      name: data.name, address: data.address,
      acquisition_cost: data.acquisitionCost, valuation: data.valuation,
      mortgage_amount: data.mortgageAmount, monthly_rent: data.monthlyRent,
      monthly_maintenance: data.monthlyMaintenance, tenant_name: data.tenantName,
      image_url: data.imageUrl, investor_ids: data.investorIds,
      owner_corp_id: data.ownerCorpId || null, purpose: data.purpose, area: data.area,
      structure: data.structure, acquisition_date: data.acquisitionDate || null,
      acquisition_reason: data.acquisitionReason, ownership_share: data.ownershipShare,
      ownership_restrictions: data.ownershipRestrictions, creditor_name: data.creditorName,
      max_debt_limit: data.maxDebtLimit, debtor_name: data.debtorName,
    };
    const { data: inserted } = await supabase.from('properties').insert(row).select().single();
    if (inserted) setProperties(prev => [...prev, mapProperty(inserted as Record<string, unknown>)]);
  };

  const updateProperty = async (prop: Property) => {
    const row = {
      name: prop.name, address: prop.address,
      acquisition_cost: prop.acquisitionCost, valuation: prop.valuation,
      mortgage_amount: prop.mortgageAmount, monthly_rent: prop.monthlyRent,
      monthly_maintenance: prop.monthlyMaintenance, tenant_name: prop.tenantName,
      image_url: prop.imageUrl, investor_ids: prop.investorIds,
      owner_corp_id: prop.ownerCorpId || null, purpose: prop.purpose, area: prop.area,
      structure: prop.structure, acquisition_date: prop.acquisitionDate || null,
      acquisition_reason: prop.acquisitionReason, ownership_share: prop.ownershipShare,
      ownership_restrictions: prop.ownershipRestrictions, creditor_name: prop.creditorName,
      max_debt_limit: prop.maxDebtLimit, debtor_name: prop.debtorName,
    };
    await supabase.from('properties').update(row).eq('id', prop.id);
    setProperties(prev => prev.map(p => p.id === prop.id ? prop : p));
  };

  const deleteProperty = async (id: string) => {
    await supabase.from('properties').delete().eq('id', id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  // ─── Expenses ─────────────────────────────────────────────────────────
  const addExpense = async (data: Omit<Expense, 'id' | 'isApproved'>) => {
    const expRow = {
      title: data.title, category: data.category, amount: data.amount,
      date: data.date, property_id: data.propertyId || null,
      description: data.description, is_approved: true,
    };
    const { data: exp } = await supabase.from('expenses').insert(expRow).select().single();
    if (!exp) return;
    const newExp = mapExpense(exp as Record<string, unknown>);
    setExpenses(prev => [...prev, newExp]);

    const categoryLabel: Record<string, string> = {
      Labor: '인건비', Maintenance: '수선유지비', Utility: '공과금', Tax: '세금', RehabDebt: '회생채무변제', Other: '기타',
    };
    const txRow = {
      type: 'Outflow', title: newExp.title, amount: newExp.amount,
      date: newExp.date, category: categoryLabel[newExp.category] || '기타',
      is_actual: false, property_id: newExp.propertyId || null, reference_id: newExp.id,
    };
    const { data: tx } = await supabase.from('transactions').insert(txRow).select().single();
    if (tx) setTransactions(prev => [...prev, mapTransaction(tx as Record<string, unknown>)]);
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    await supabase.from('transactions').delete().eq('reference_id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    setTransactions(prev => prev.filter(t => t.referenceId !== id));
  };

  // ─── Approval ─────────────────────────────────────────────────────────
  const submitExpenseForApproval = async (
    expenseData: Omit<Expense, 'id' | 'isApproved' | 'approvalId'>,
    title: string, content: string
  ) => {
    const approvalLine: ApprovalItem['approvalLine'] = [
      { role: 'Drafter', userName: currentUser.name, status: 'Signed', signedAt: new Date().toISOString().substring(0, 16).replace('T', ' ') },
      { role: 'Reviewer', userName: users.find(u => u.role === 'Reviewer')?.name ?? '검토자', status: 'Pending' },
      { role: 'Approver', userName: users.find(u => u.role === 'Approver')?.name ?? '결재자', status: 'Pending' },
    ];
    const row = {
      title, type: 'Expense', content, amount: expenseData.amount,
      drafter: currentUser.name, status: 'Pending',
      approval_line: approvalLine, current_signer_idx: 1,
      expense_data: expenseData,
    };
    const { data: inserted } = await supabase.from('approval_items').insert(row).select().single();
    if (inserted) setApprovalItems(prev => [mapApproval(inserted as Record<string, unknown>), ...prev]);
  };

  const approveItem = async (id: string) => {
    const item = approvalItems.find(a => a.id === id);
    if (!item) return;

    const updatedLine = item.approvalLine.map((signer, index) => {
      if (index === item.currentSignerIdx && signer.userName === currentUser.name) {
        return { ...signer, status: 'Signed' as const, signedAt: new Date().toISOString().substring(0, 16).replace('T', ' ') };
      }
      return signer;
    });
    const nextIdx = item.currentSignerIdx + 1;
    const isComplete = nextIdx >= item.approvalLine.length;
    const newStatus = isComplete ? 'Approved' as const : 'Pending' as const;

    const updated: ApprovalItem = {
      ...item, approvalLine: updatedLine,
      currentSignerIdx: isComplete ? item.currentSignerIdx : nextIdx,
      status: newStatus,
    };

    await supabase.from('approval_items').update({
      approval_line: updatedLine, current_signer_idx: updated.currentSignerIdx, status: newStatus,
    }).eq('id', id);
    setApprovalItems(prev => prev.map(a => a.id === id ? updated : a));

    // 최종 결재 완료 → 비용 + 거래 내역 자동 등록
    if (isComplete && item.type === 'Expense' && item.expenseData) {
      const expRow = {
        title: item.expenseData.title, category: item.expenseData.category,
        amount: item.expenseData.amount, date: item.expenseData.date,
        property_id: item.expenseData.propertyId || null,
        description: item.expenseData.description, is_approved: true, approval_id: id,
      };
      const { data: exp } = await supabase.from('expenses').insert(expRow).select().single();
      if (exp) {
        const newExp = mapExpense(exp as Record<string, unknown>);
        setExpenses(exps => [...exps, newExp]);
        const categoryLabel: Record<string, string> = {
          Labor: '인건비', Maintenance: '수선유지비', Utility: '공과금', Tax: '세금', RehabDebt: '회생채무변제', Other: '기타',
        };
        const txRow = {
          type: 'Outflow', title: newExp.title, amount: newExp.amount, date: newExp.date,
          category: categoryLabel[newExp.category] || '기타',
          is_actual: false, property_id: newExp.propertyId || null, reference_id: newExp.id,
        };
        const { data: tx } = await supabase.from('transactions').insert(txRow).select().single();
        if (tx) setTransactions(txs => [...txs, mapTransaction(tx as Record<string, unknown>)]);
      }
    }
  };

  const rejectItem = async (id: string) => {
    const item = approvalItems.find(a => a.id === id);
    if (!item) return;
    const updatedLine = item.approvalLine.map((signer, index) => {
      if (index === item.currentSignerIdx && signer.userName === currentUser.name) {
        return { ...signer, status: 'Rejected' as const, signedAt: new Date().toISOString().substring(0, 16).replace('T', ' ') };
      }
      return signer;
    });
    await supabase.from('approval_items').update({ approval_line: updatedLine, status: 'Rejected' }).eq('id', id);
    setApprovalItems(prev => prev.map(a => a.id === id ? { ...a, approvalLine: updatedLine, status: 'Rejected' } : a));
  };

  // ─── Investors ────────────────────────────────────────────────────────
  const addInvestor = async (data: Omit<Investor, 'id'>) => {
    const row = {
      name: data.name, capital_invested: data.capitalInvested,
      ownership_ratio: data.ownershipRatio, property_ids: data.properties,
      bank_account: data.bankAccount, total_dividends_paid: data.totalDividendsPaid,
    };
    const { data: inserted } = await supabase.from('investors').insert(row).select().single();
    if (inserted) setInvestors(prev => [...prev, mapInvestor(inserted as Record<string, unknown>)]);
  };

  const runSettlement = async (propertyId: string, distributionAmount: number) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return;
    const targets = investors.filter(inv => inv.properties.includes(propertyId));
    if (!targets.length) return;
    const totalCapital = targets.reduce((s, inv) => s + inv.capitalInvested, 0);

    await Promise.all(targets.map(async inv => {
      const payout = Math.floor(distributionAmount * (inv.capitalInvested / totalCapital));
      const newTotal = inv.totalDividendsPaid + payout;
      await supabase.from('investors').update({ total_dividends_paid: newTotal }).eq('id', inv.id);
    }));
    setInvestors(prev => prev.map(inv => {
      if (!inv.properties.includes(propertyId)) return inv;
      const payout = Math.floor(distributionAmount * (inv.capitalInvested / totalCapital));
      return { ...inv, totalDividendsPaid: inv.totalDividendsPaid + payout };
    }));

    const txRow = {
      type: 'Outflow', title: `${prop.name} 투자자 정기 수익분배금 정산`,
      amount: distributionAmount, date: new Date().toISOString().split('T')[0],
      category: '투자수익분배', is_actual: true, property_id: propertyId,
    };
    const { data: tx } = await supabase.from('transactions').insert(txRow).select().single();
    if (tx) setTransactions(prev => [...prev, mapTransaction(tx as Record<string, unknown>)]);
  };

  // ─── Transactions ─────────────────────────────────────────────────────
  const toggleTransactionActual = async (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    await supabase.from('transactions').update({ is_actual: !tx.isActual }).eq('id', id);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, isActual: !t.isActual } : t));
  };

  const addTransaction = async (data: Omit<Transaction, 'id'>) => {
    const row = {
      type: data.type, title: data.title, amount: data.amount, date: data.date,
      category: data.category, is_actual: data.isActual,
      property_id: data.propertyId || null, reference_id: data.referenceId || null,
    };
    const { data: inserted } = await supabase.from('transactions').insert(row).select().single();
    if (inserted) setTransactions(prev => [...prev, mapTransaction(inserted as Record<string, unknown>)]);
  };

  // ─── OCR ──────────────────────────────────────────────────────────────
  const importOcrDocument = async (doc: OCRDocument) => {
    const row = {
      id: doc.id, file_name: doc.fileName, file_size: doc.fileSize,
      source: doc.source, status: doc.status, doc_type: doc.docType || null,
    };
    const { data: inserted } = await supabase.from('ocr_documents').insert(row).select().single();
    if (inserted) setOcrDocuments(prev => [mapOcr(inserted as Record<string, unknown>), ...prev]);
    else setOcrDocuments(prev => [doc, ...prev]);
  };

  const updateOcrDocumentType = async (id: string, docType: OCRDocType) => {
    await supabase.from('ocr_documents').update({ doc_type: docType }).eq('id', id);
    setOcrDocuments(prev => prev.map(d => d.id === id ? { ...d, docType } : d));
  };

  const processOcrDocument = async (id: string) => {
    const doc = ocrDocuments.find(d => d.id === id);
    if (!doc) return;
    const fileNameLower = doc.fileName.toLowerCase();
    const isHighTouch = fileNameLower.includes('hightouch') || fileNameLower.includes('하이터치');
    const isMock = ['2026_pacific_med_ledger','yeouido_asset_valuation_report','이조원','하이터치','hightouch']
      .some(k => fileNameLower.includes(k));

    let parsedData: OCRDocument['parsedData'] = {};
    const type = doc.docType || 'PropertyLedger';

    if (type === 'CorporateRegistry') {
      parsedData = { corporationFound: isMock ? (isHighTouch ? {
        name: '주식회사 하이터치 솔루션', regNumber: '110111-8765432', bizNumber: '120-86-54321',
        representative: '김하이터치', address: '서울특별시 마포구 마포대로 12', capital: 300000000,
      } : { name: '주식회사 이조원', regNumber: '110111-2345678', bizNumber: '104-81-12345',
        representative: '이조원', address: '서울특별시 중구 을지로 88', capital: 500000000,
      }) : { name: '', regNumber: '', bizNumber: '', representative: '', address: '', capital: 0 } };
    } else if (type === 'FinancialStatement') {
      parsedData = { corporationFound: isMock ? (isHighTouch ? {
        name: '주식회사 하이터치 솔루션', regNumber: '110111-8765432', bizNumber: '120-86-54321',
        representative: '김하이터치', address: '서울특별시 마포구 마포대로 12', capital: 300000000,
        revenue: 980000000, netIncome: 110000000, totalAssets: 4100000000, totalLiabilities: 1500000000, fiscalYear: '2025-12-31',
      } : { name: '주식회사 이조원', regNumber: '110111-2345678', bizNumber: '104-81-12345',
        representative: '이조원', address: '서울특별시 중구 을지로 88', capital: 500000000,
        revenue: 1450000000, netIncome: 220000000, totalAssets: 5500000000, totalLiabilities: 1800000000, fiscalYear: '2025-12-31',
      }) : { name: '', regNumber: '', bizNumber: '', representative: '', address: '', capital: 0,
        revenue: 0, netIncome: 0, totalAssets: 0, totalLiabilities: 0, fiscalYear: '' } };
    } else {
      parsedData = { propertiesFound: [isMock ? {
        name: isHighTouch ? '하이터치 마포 빌딩 2층' : '서초 테크노타워 4층',
        address: isHighTouch ? '서울특별시 마포구 마포대로 15' : '서울특별시 서초구 서초대로 324',
        acquisitionCost: isHighTouch ? 4200000000 : 3500000000,
        valuation: isHighTouch ? 4500000000 : 3800000000,
        mortgageAmount: isHighTouch ? 1800000000 : 1400000000,
        monthlyRent: isHighTouch ? 16000000 : 12000000,
        monthlyMaintenance: isHighTouch ? 2500000 : 2200000,
        tenantName: isHighTouch ? '대원 아이씨티' : '네오 소프트랩',
        ownerCorpId: isHighTouch ? '' : '',
        purpose: isHighTouch ? '업무시설 (사무소)' : '근린생활시설 (소매점)',
        area: isHighTouch ? 245.5 : 120.8, structure: '철근콘크리트 구조',
        acquisitionDate: isHighTouch ? '2024-05-18' : '2023-11-20',
        acquisitionReason: '매매', ownershipShare: '1/1 (단독소유)',
        ownershipRestrictions: isHighTouch ? '가압류 (서울마포지방법원)' : '없음',
        creditorName: isHighTouch ? '하나은행' : '신한은행',
        maxDebtLimit: isHighTouch ? 2160000000 : 1680000000,
        debtorName: isHighTouch ? '주식회사 하이터치 솔루션' : '주식회사 이조원',
      } : {
        name: '', address: '', acquisitionCost: 0, valuation: 0, mortgageAmount: 0,
        monthlyRent: 0, monthlyMaintenance: 0, tenantName: '', ownerCorpId: '',
        purpose: '', area: 0, structure: '', acquisitionDate: '',
        acquisitionReason: '', ownershipShare: '', ownershipRestrictions: '',
        creditorName: '', maxDebtLimit: 0, debtorName: '',
      }] };
    }

    await supabase.from('ocr_documents').update({ status: 'Success', parsed_data: parsedData }).eq('id', id);
    setOcrDocuments(prev => prev.map(d => d.id === id ? { ...d, status: 'Success', parsedData } : d));
  };

  return (
    <AppContext.Provider value={{
      properties, expenses, investors, transactions, approvalItems, ocrDocuments,
      users, currentUser, setCurrentUser, corporations, addCorporation, updateCorporation,
      googleAccessToken, setGoogleAccessToken, googleClientId, setGoogleClientId, googleApiKey, setGoogleApiKey,
      addProperty, updateProperty, deleteProperty,
      addExpense, submitExpenseForApproval, deleteExpense,
      approveItem, rejectItem,
      addInvestor, runSettlement,
      toggleTransactionActual, addTransaction,
      importOcrDocument, updateOcrDocumentType, processOcrDocument,
      dbLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
