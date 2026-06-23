import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Property, Expense, Investor, ApprovalItem, Transaction, OCRDocument, User, Corporation, OCRDocType } from '../types';

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
  
  // Corporations
  corporations: Corporation[];
  addCorporation: (corp: Omit<Corporation, 'id'>) => void;
  updateCorporation: (corp: Corporation) => void;
  
  // Google OAuth Credentials
  googleAccessToken: string | null;
  setGoogleAccessToken: (token: string | null) => void;
  googleClientId: string;
  setGoogleClientId: (id: string) => void;
  googleApiKey: string;
  setGoogleApiKey: (key: string) => void;
  
  // Property Actions
  addProperty: (property: Omit<Property, 'id'>) => void;
  updateProperty: (property: Property) => void;
  deleteProperty: (id: string) => void;
  
  // Expense Actions
  addExpense: (expense: Omit<Expense, 'id' | 'isApproved'>) => void;
  submitExpenseForApproval: (expenseData: Omit<Expense, 'id' | 'isApproved' | 'approvalId'>, title: string, content: string) => void;
  deleteExpense: (id: string) => void;
  
  // Approval Actions
  approveItem: (id: string) => void;
  rejectItem: (id: string) => void;
  
  // Investor Actions
  addInvestor: (investor: Omit<Investor, 'id'>) => void;
  runSettlement: (propertyId: string, distributionAmount: number) => void;
  
  // Transaction Actions
  toggleTransactionActual: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  
  // OCR Actions
  importOcrDocument: (doc: OCRDocument) => void;
  updateOcrDocumentType: (id: string, type: OCRDocType) => void;
  processOcrDocument: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Core Mock Users
const MOCK_USERS: User[] = [
  { id: '1', name: '김대리', role: 'Drafter', position: '실무 담당자' },
  { id: '2', name: '이과장', role: 'Reviewer', position: '검토 총괄자' },
  { id: '3', name: '박부장', role: 'Approver', position: '최종 결재권자' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const saved = localStorage.getItem('rehab_user');
    return saved ? JSON.parse(saved) : MOCK_USERS[0];
  });

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem('rehab_user', JSON.stringify(user));
  };

  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleClientId, setGoogleClientIdState] = useState<string>(() => localStorage.getItem('google_client_id') || '');
  const [googleApiKey, setGoogleApiKeyState] = useState<string>(() => localStorage.getItem('google_api_key') || '');

  const setGoogleClientId = (id: string) => {
    setGoogleClientIdState(id);
    localStorage.setItem('google_client_id', id);
  };

  const setGoogleApiKey = (key: string) => {
    setGoogleApiKeyState(key);
    localStorage.setItem('google_api_key', key);
  };

  // Corporations State
  const [corporations, setCorporations] = useState<Corporation[]>(() => {
    const saved = localStorage.getItem('rehab_corporations');
    return saved ? JSON.parse(saved) : [];
  });

  // 1. Properties State
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('rehab_properties');
    return saved ? JSON.parse(saved) : [];
  });

  // 2. Expenses State
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('rehab_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. Investors State
  const [investors, setInvestors] = useState<Investor[]>(() => {
    const saved = localStorage.getItem('rehab_investors');
    return saved ? JSON.parse(saved) : [];
  });

  // 4. Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('rehab_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // 5. ERP Approval State
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>(() => {
    const saved = localStorage.getItem('rehab_approvals');
    return saved ? JSON.parse(saved) : [];
  });

  // 6. OCR Document Queue State
  const [ocrDocuments, setOcrDocuments] = useState<OCRDocument[]>(() => {
    const saved = localStorage.getItem('rehab_ocr');
    return saved ? JSON.parse(saved) : [];
  });

  // One-time cleanup to clear dummy data from browser session
  useEffect(() => {
    const cleared = localStorage.getItem('rehab_dummy_cleared_v2');
    if (!cleared) {
      localStorage.removeItem('rehab_properties');
      localStorage.removeItem('rehab_expenses');
      localStorage.removeItem('rehab_investors');
      localStorage.removeItem('rehab_transactions');
      localStorage.removeItem('rehab_approvals');
      localStorage.removeItem('rehab_ocr');
      localStorage.removeItem('rehab_corporations');
      localStorage.setItem('rehab_dummy_cleared_v2', 'true');
      
      setProperties([]);
      setExpenses([]);
      setInvestors([]);
      setTransactions([]);
      setApprovalItems([]);
      setOcrDocuments([]);
      setCorporations([]);
    }
  }, []);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('rehab_properties', JSON.stringify(properties)); }, [properties]);
  useEffect(() => { localStorage.setItem('rehab_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('rehab_investors', JSON.stringify(investors)); }, [investors]);
  useEffect(() => { localStorage.setItem('rehab_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('rehab_approvals', JSON.stringify(approvalItems)); }, [approvalItems]);
  useEffect(() => { localStorage.setItem('rehab_ocr', JSON.stringify(ocrDocuments)); }, [ocrDocuments]);
  useEffect(() => { localStorage.setItem('rehab_corporations', JSON.stringify(corporations)); }, [corporations]);

  // --- ACTIONS IMPLEMENTATION ---

  // Corporations Action
  const addCorporation = (corpData: Omit<Corporation, 'id'>) => {
    const newCorp: Corporation = {
      ...corpData,
      id: `corp-${Date.now()}`
    };
    setCorporations(prev => [...prev, newCorp]);
  };

  const updateCorporation = (updated: Corporation) => {
    setCorporations(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  // Properties Action
  const addProperty = (propData: Omit<Property, 'id'>) => {
    const newProp: Property = {
      ...propData,
      id: `prop-${Date.now()}`,
    };
    setProperties(prev => [...prev, newProp]);
  };

  const updateProperty = (updated: Property) => {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const updateOcrDocumentType = (id: string, docType: OCRDocType) => {
    setOcrDocuments(prev => prev.map(d => d.id === id ? { ...d, docType } : d));
  };

  // Expenses Action
  const addExpense = (expData: Omit<Expense, 'id' | 'isApproved'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      isApproved: true, // Direct add is approved by default
    };
    setExpenses(prev => [...prev, newExp]);

    // Directly register to transaction list as expected outflow
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'Outflow',
      title: newExp.title,
      amount: newExp.amount,
      date: newExp.date,
      category: newExp.category === 'Labor' ? '인건비' : newExp.category === 'Maintenance' ? '수선유지비' : '관리비',
      isActual: false,
      propertyId: newExp.propertyId,
      referenceId: newExp.id
    };
    setTransactions(prev => [...prev, newTx]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setTransactions(prev => prev.filter(t => t.referenceId !== id));
  };

  // Submit Expense to ERP approval
  const submitExpenseForApproval = (
    expenseData: Omit<Expense, 'id' | 'isApproved' | 'approvalId'>,
    title: string,
    content: string
  ) => {
    const appId = `app-${Date.now()}`;
    const newApproval: ApprovalItem = {
      id: appId,
      title,
      type: 'Expense',
      content,
      amount: expenseData.amount,
      drafter: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Pending',
      approvalLine: [
        { role: 'Drafter', userName: currentUser.name, status: 'Signed', signedAt: new Date().toISOString().substring(0, 16).replace('T', ' ') },
        { role: 'Reviewer', userName: '이과장', status: 'Pending' },
        { role: 'Approver', userName: '박부장', status: 'Pending' }
      ],
      currentSignerIdx: 1, // Points to Reviewer
      expenseData
    };
    setApprovalItems(prev => [newApproval, ...prev]);
  };

  // ERP Sign Action
  const approveItem = (id: string) => {
    setApprovalItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updatedLine = item.approvalLine.map((signer, index) => {
        if (index === item.currentSignerIdx && signer.userName === currentUser.name) {
          return {
            ...signer,
            status: 'Signed' as const,
            signedAt: new Date().toISOString().substring(0, 16).replace('T', ' ')
          };
        }
        return signer;
      });

      const nextSignerIdx = item.currentSignerIdx + 1;
      const isCompleted = nextSignerIdx >= item.approvalLine.length;
      const finalStatus = isCompleted ? ('Approved' as const) : ('Pending' as const);

      // If approved and has expense data, integrate into general ledger
      if (isCompleted && item.type === 'Expense' && item.expenseData) {
        const expId = `exp-${Date.now()}`;
        const finalExpense: Expense = {
          ...item.expenseData,
          id: expId,
          isApproved: true,
          approvalId: item.id
        };
        
        // Add to expenses
        setTimeout(() => {
          setExpenses(exps => [...exps, finalExpense]);
          
          // Add to expected outflow in transaction registry
          const newTx: Transaction = {
            id: `tx-app-${Date.now()}`,
            type: 'Outflow',
            title: finalExpense.title,
            amount: finalExpense.amount,
            date: finalExpense.date,
            category: finalExpense.category === 'Labor' ? '인건비' : finalExpense.category === 'Maintenance' ? '수선유지비' : '관리비',
            isActual: false,
            propertyId: finalExpense.propertyId,
            referenceId: expId
          };
          setTransactions(txs => [...txs, newTx]);
        }, 0);
      }

      return {
        ...item,
        approvalLine: updatedLine,
        currentSignerIdx: isCompleted ? item.currentSignerIdx : nextSignerIdx,
        status: finalStatus
      };
    }));
  };

  // ERP Reject Action
  const rejectItem = (id: string) => {
    setApprovalItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updatedLine = item.approvalLine.map((signer, index) => {
        if (index === item.currentSignerIdx && signer.userName === currentUser.name) {
          return {
            ...signer,
            status: 'Rejected' as const,
            signedAt: new Date().toISOString().substring(0, 16).replace('T', ' ')
          };
        }
        return signer;
      });

      return {
        ...item,
        approvalLine: updatedLine,
        status: 'Rejected' as const
      };
    }));
  };

  // Investor Management Action
  const addInvestor = (invData: Omit<Investor, 'id'>) => {
    const newInv: Investor = {
      ...invData,
      id: `inv-${Date.now()}`,
    };
    setInvestors(prev => [...prev, newInv]);
  };

  // Dividend Settlement Calculation engine
  const runSettlement = (propertyId: string, distributionAmount: number) => {
    const prop = properties.find(p => p.id === propertyId);
    if (!prop) return;

    // Filter investors tied to this property
    const targetInvestors = investors.filter(inv => inv.properties.includes(propertyId));
    if (targetInvestors.length === 0) return;

    // Compute total capital invested by target investors in this asset
    const totalPropCapital = targetInvestors.reduce((sum, inv) => sum + inv.capitalInvested, 0);

    // Update investor payout figures
    setInvestors(prev => prev.map(inv => {
      if (!inv.properties.includes(propertyId)) return inv;
      
      // Calculate proportion of capital
      const weight = inv.capitalInvested / totalPropCapital;
      const payout = Math.floor(distributionAmount * weight);

      return {
        ...inv,
        totalDividendsPaid: inv.totalDividendsPaid + payout
      };
    }));

    // Add this settlement payout into calendar transaction history
    const settleTx: Transaction = {
      id: `tx-settle-${Date.now()}`,
      type: 'Outflow',
      title: `${prop.name} 투자자 정기 수익분배금 정산`,
      amount: distributionAmount,
      date: new Date().toISOString().split('T')[0],
      category: '투자수익분배',
      isActual: true,
      propertyId: propertyId
    };
    setTransactions(prev => [...prev, settleTx]);
  };

  // Transactions Switcher
  const toggleTransactionActual = (id: string) => {
    setTransactions(prev => prev.map(tx => {
      if (tx.id !== id) return tx;
      return {
        ...tx,
        isActual: !tx.isActual
      };
    }));
  };

  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [...prev, newTx]);
  };

  // Google Drive & OCR Actions
  const importOcrDocument = (doc: OCRDocument) => {
    setOcrDocuments(prev => [doc, ...prev]);
  };

  const processOcrDocument = (id: string) => {
    setOcrDocuments(prev => prev.map(doc => {
      if (doc.id !== id) return doc;
      
      const fileNameLower = doc.fileName.toLowerCase();
      const isHighTouch = fileNameLower.includes('hightouch') || fileNameLower.includes('하이터치');
      
      // Determine what to parse based on selected docType
      let parsedData: OCRDocument['parsedData'] = {};
      const type = doc.docType || 'PropertyLedger';
      
      if (type === 'CorporateRegistry') {
        parsedData = {
          corporationFound: isHighTouch ? {
            name: '주식회사 하이터치 솔루션',
            regNumber: '110111-8765432',
            bizNumber: '120-86-54321',
            representative: '김하이터치',
            address: '서울특별시 마포구 마포대로 12',
            capital: 300000000
          } : {
            name: '주식회사 이조원',
            regNumber: '110111-2345678',
            bizNumber: '104-81-12345',
            representative: '이조원',
            address: '서울특별시 중구 을지로 88',
            capital: 500000000
          }
        };
      } else if (type === 'FinancialStatement') {
        parsedData = {
          corporationFound: isHighTouch ? {
            name: '주식회사 하이터치 솔루션',
            regNumber: '110111-8765432',
            bizNumber: '120-86-54321',
            representative: '김하이터치',
            address: '서울특별시 마포구 마포대로 12',
            capital: 300000000,
            revenue: 980000000,
            netIncome: 110000000,
            totalAssets: 4100000000,
            totalLiabilities: 1500000000,
            fiscalYear: '2025-12-31'
          } : {
            name: '주식회사 이조원',
            regNumber: '110111-2345678',
            bizNumber: '104-81-12345',
            representative: '이조원',
            address: '서울특별시 중구 을지로 88',
            capital: 500000000,
            revenue: 1450000000,
            netIncome: 220000000,
            totalAssets: 5500000000,
            totalLiabilities: 1800000000,
            fiscalYear: '2025-12-31'
          }
        };
      } else {
        // PropertyLedger
        parsedData = {
          propertiesFound: [
            {
              name: isHighTouch ? '하이터치 마포 빌딩 2층' : '서초 테크노타워 4층',
              address: isHighTouch ? '서울특별시 마포구 마포대로 15' : '서울특별시 서초구 서초대로 324 (테크노타워)',
              acquisitionCost: isHighTouch ? 4200000000 : 3500000000,
              valuation: isHighTouch ? 4500000000 : 3800000000,
              mortgageAmount: isHighTouch ? 1800000000 : 1400000000,
              monthlyRent: isHighTouch ? 16000000 : 12000000,
              monthlyMaintenance: isHighTouch ? 2500000 : 2200000,
              tenantName: isHighTouch ? '대원 아이씨티' : '네오 소프트랩',
              ownerCorpId: isHighTouch ? 'corp-2' : 'corp-1',
              
              // Register Fields
              purpose: isHighTouch ? '업무시설 (사무소)' : '근린생활시설 (소매점)',
              area: isHighTouch ? 245.5 : 120.8,
              structure: '철근콘크리트 구조',
              acquisitionDate: isHighTouch ? '2024-05-18' : '2023-11-20',
              acquisitionReason: '매매',
              ownershipShare: '1/1 (단독소유)',
              ownershipRestrictions: isHighTouch ? '가압류 (서울마포지방법원)' : '없음',
              creditorName: isHighTouch ? '하나은행' : '신한은행',
              maxDebtLimit: isHighTouch ? 2160000000 : 1680000000,
              debtorName: isHighTouch ? '주식회사 하이터치 솔루션' : '주식회사 이조원'
            }
          ]
        };
      }
      
      return {
        ...doc,
        status: 'Success' as const,
        parsedData
      };
    }));
  };

  return (
    <AppContext.Provider value={{
      properties,
      expenses,
      investors,
      transactions,
      approvalItems,
      ocrDocuments,
      users: MOCK_USERS,
      currentUser,
      setCurrentUser,
      corporations,
      addCorporation,
      updateCorporation,
      googleAccessToken,
      setGoogleAccessToken,
      googleClientId,
      setGoogleClientId,
      googleApiKey,
      setGoogleApiKey,
      
      addProperty,
      updateProperty,
      deleteProperty,
      addExpense,
      submitExpenseForApproval,
      deleteExpense,
      approveItem,
      rejectItem,
      addInvestor,
      runSettlement,
      toggleTransactionActual,
      addTransaction,
      importOcrDocument,
      updateOcrDocumentType,
      processOcrDocument
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
