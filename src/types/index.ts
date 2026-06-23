export interface Corporation {
  id: string;
  name: string;
  regNumber: string;       // 법인등록번호
  bizNumber: string;       // 사업자등록번호
  representative: string;  // 대표이사
  address: string;         // 본점 소재지
  capital: number;         // 자본금
  // Financial metrics (from Financial Statements)
  revenue?: number;        // 매출액
  netIncome?: number;      // 당기순이익
  totalAssets?: number;    // 자산총계
  totalLiabilities?: number; // 부채총계
  fiscalYear?: string;     // 회계연도 기준일
}

export interface Property {
  id: string;
  name: string;
  address: string;
  acquisitionCost: number;
  valuation: number;
  mortgageAmount: number;
  monthlyRent: number;
  monthlyMaintenance: number;
  tenantName: string;
  imageUrl?: string;
  investorIds: string[];   // Investors tied to this property
  ownerCorpId?: string;    // ID of the Corporation owning this property

  // 표제부 관련 (Description of Real Estate)
  purpose?: string;           // 용도 (예: 근린생활시설, 업무시설)
  area?: number;              // 전용면적 (㎡)
  structure?: string;         // 건물 구조 (예: 철근콘크리트조)

  // 갑구 관련 (Ownership & Restrictions)
  acquisitionDate?: string;   // 소유권 취득일자 (YYYY-MM-DD)
  acquisitionReason?: string; // 소유권 취득원인 (예: 매매)
  ownershipShare?: string;    // 소유 지분 (예: 1/1, 50/100)
  ownershipRestrictions?: string; // 권리 제한 사항 (예: 가압류, 임차권등기)

  // 을구 관련 (Mortgage & Creditors)
  creditorName?: string;      // 채권기관/근저당권자 (예: 신한은행)
  maxDebtLimit?: number;      // 채권최고액
  debtorName?: string;        // 채무자
}

export interface Expense {
  id: string;
  title: string;
  category: 'Labor' | 'Maintenance' | 'Utility' | 'Tax' | 'RehabDebt' | 'Other';
  amount: number;
  date: string; // YYYY-MM-DD
  propertyId?: string; // Optional property reference
  description: string;
  isApproved: boolean;
  approvalId?: string;
}

export interface Investor {
  id: string;
  name: string;
  capitalInvested: number;
  ownershipRatio: number; // calculated or fixed
  properties: string[]; // property IDs invested in
  bankAccount: string;
  totalDividendsPaid: number;
}

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ApprovalLine {
  role: 'Drafter' | 'Reviewer' | 'Approver';
  userName: string;
  status: 'Pending' | 'Signed' | 'Rejected';
  signedAt?: string;
}

export interface ApprovalItem {
  id: string;
  title: string;
  type: 'Expense' | 'Document';
  content: string;
  amount?: number;
  drafter: string;
  createdAt: string;
  status: ApprovalStatus;
  approvalLine: ApprovalLine[];
  currentSignerIdx: number;
  expenseData?: Omit<Expense, 'id' | 'isApproved' | 'approvalId'>;
}

export interface Transaction {
  id: string;
  type: 'Inflow' | 'Outflow';
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  isActual: boolean; // false = Expected, true = Actual
  propertyId?: string;
  referenceId?: string; // references Expense ID or Settlement ID
}

export type OCRDocType = 'PropertyLedger' | 'CorporateRegistry' | 'FinancialStatement';

export interface OCRDocument {
  id: string;
  fileName: string;
  fileSize: string;
  source: 'GoogleDrive' | 'Local';
  status: 'Pending' | 'Success' | 'Failed';
  docType?: OCRDocType; // Selected document type for OCR parsing
  parsedData?: {
    propertiesFound?: Omit<Property, 'id' | 'investorIds'>[];
    corporationFound?: Omit<Corporation, 'id'>;
  };
}

export interface User {
  id: string;
  name: string;
  role: 'Drafter' | 'Reviewer' | 'Approver';
  position: string;
}
