import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Cloud, FileText, Play, CheckCircle, Loader2, Edit3, Save, Key, HelpCircle, Folder, ChevronRight, ArrowLeft } from 'lucide-react';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

// 1. Local Virtual Folder Tree structure for Offline Mock testing
const OFFLINE_DRIVE_TREE: Record<string, DriveItem[]> = {
  'root': [
    { id: 'folder-reconst-docs', name: '법인 등기부등본 (Corporate Registry)', mimeType: 'application/vnd.google-apps.folder' },
    { id: 'folder-prop-docs', name: '회생 부동산 서류 (Property)', mimeType: 'application/vnd.google-apps.folder' },
    { id: 'folder-finance-docs', name: '재무제표 및 결산서 (Financial Statements)', mimeType: 'application/vnd.google-apps.folder' },
    { id: 'doc-2', name: 'seocho_bill_2026_06.jpg', mimeType: 'image/jpeg', size: '850 KB' }
  ],
  'folder-reconst-docs': [
    { id: 'doc-corp-reg-jowon', name: '주식회사_이조원_법인등기부등본.pdf', mimeType: 'application/pdf', size: '1.2 MB' },
    { id: 'doc-corp-reg-hightouch', name: '주식회사_하이터치솔루션_법인등기부등본.pdf', mimeType: 'application/pdf', size: '1.1 MB' }
  ],
  'folder-prop-docs': [
    { id: 'doc-1', name: '2026_pacific_med_ledger.pdf', mimeType: 'application/pdf', size: '4.2 MB' },
    { id: 'doc-3', name: 'yeouido_asset_valuation_report.pdf', mimeType: 'application/pdf', size: '3.1 MB' }
  ],
  'folder-finance-docs': [
    { id: 'doc-corp-fin-jowon', name: '주식회사_이조원_2025년도_재무제표.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: '150 KB' },
    { id: 'doc-corp-fin-hightouch', name: '주식회사_하이터치솔루션_2025년도_재무제표.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: '145 KB' },
    { id: 'doc-4', name: 'yeouido_tax_invoice_07.pdf', mimeType: 'application/pdf', size: '1.4 MB' }
  ]
};

export const DocOCRHub: React.FC = () => {
  const { 
    ocrDocuments, 
    processOcrDocument, 
    addProperty, 
    importOcrDocument,
    googleAccessToken,
    setGoogleAccessToken,
    googleClientId,
    setGoogleClientId,
    googleApiKey,
    setGoogleApiKey,
    corporations,
    updateCorporation,
    addCorporation,
    updateOcrDocumentType
  } = useApp();

  const [selectedId, setSelectedId] = useState<string | null>(ocrDocuments[0]?.id || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [showDeveloperGuide, setShowDeveloperGuide] = useState(false);

  // Settings inputs
  const [clientIdInput, setClientIdInput] = useState(googleClientId);
  const [apiKeyInput, setApiKeyInput] = useState(googleApiKey);

  // --- Folder Explorer Navigation State ---
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: '내 드라이브' }
  ]);
  const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id;
  const [driveItems, setDriveItems] = useState<DriveItem[]>(OFFLINE_DRIVE_TREE['root']);

  // Editable parsed property states
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editValuation, setEditValuation] = useState('');
  const [editMortgage, setEditMortgage] = useState('');
  const [editRent, setEditRent] = useState('');
  const [editMaintenance, setEditMaintenance] = useState('');
  const [editTenant, setEditTenant] = useState('');
  const [editOwnerCorpId, setEditOwnerCorpId] = useState('');

  // Editable parsed registry fields
  const [editPurpose, setEditPurpose] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editStructure, setEditStructure] = useState('');
  const [editAcquisitionDate, setEditAcquisitionDate] = useState('');
  const [editAcquisitionReason, setEditAcquisitionReason] = useState('');
  const [editOwnershipShare, setEditOwnershipShare] = useState('');
  const [editOwnershipRestrictions, setEditOwnershipRestrictions] = useState('');
  const [editCreditorName, setEditCreditorName] = useState('');
  const [editMaxDebtLimit, setEditMaxDebtLimit] = useState('');
  const [editDebtorName, setEditDebtorName] = useState('');

  // Editable parsed corporation states
  const [editCorpName, setEditCorpName] = useState('');
  const [editRepresentative, setEditRepresentative] = useState('');
  const [editCapital, setEditCapital] = useState('');
  const [editRegNumber, setEditRegNumber] = useState('');
  const [editBizNumber, setEditBizNumber] = useState('');
  const [editCorpAddress, setEditCorpAddress] = useState('');

  // Editable financial statements states
  const [editRevenue, setEditRevenue] = useState('');
  const [editNetIncome, setEditNetIncome] = useState('');
  const [editTotalAssets, setEditTotalAssets] = useState('');
  const [editTotalLiabilities, setEditTotalLiabilities] = useState('');
  const [editFiscalYear, setEditFiscalYear] = useState('');
  const [editTargetCorpId, setEditTargetCorpId] = useState('');

  const selectedDoc = ocrDocuments.find(d => d.id === selectedId);



  // Update explorer items when offline breadcrumbs change
  useEffect(() => {
    if (!googleAccessToken) {
      setDriveItems(OFFLINE_DRIVE_TREE[currentFolderId] || []);
    } else {
      fetchDriveFiles(googleAccessToken, currentFolderId);
    }
  }, [breadcrumbs, googleAccessToken]);

  // Fetch files/folders in the specified folder from actual Google Drive
  const fetchDriveFiles = async (token: string, folderId: string) => {
    setIsSyncing(true);
    try {
      // Query items under the parent folderId (fetching all files and folders, excluding trashed)
      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,size,mimeType)&key=${googleApiKey}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        // Token has expired or is invalid. Reset it.
        setGoogleAccessToken(null);
        throw new Error('인증 세션이 만료되었거나 권한이 없습니다. 다시 구글 드라이브 연동을 진행해 주세요.');
      }
      
      if (!response.ok) {
        throw new Error(`Google API returned status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.files) {
        const mappedItems: DriveItem[] = data.files.map((file: any) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size ? `${(Number(file.size) / (1024 * 1024)).toFixed(2)} MB` : undefined
        }));
        setDriveItems(mappedItems);
      }
    } catch (err: any) {
      console.error(err);
      alert(`[드라이브 오류] 폴더(${folderId}) 파일 조회 실패: ` + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect Google Drive popup trigger
  const handleConnectDrive = () => {
    if (!googleClientId) {
      alert('먼저 우측의 개발자 설정 패널에서 구글 클라이언트 ID를 등록해 주세요.');
      return;
    }

    // Check if google SDK is loaded
    // @ts-ignore
    if (typeof google === 'undefined' || !google.accounts) {
      alert('구글 인증 라이브러리(GSI)가 로드되지 않았습니다. 인터넷 연결 상태를 확인하시거나 브라우저 광고 차단기(AdBlock)를 비활성화한 후 다시 시도해 주세요.');
      return;
    }

    try {
      // @ts-ignore
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: (response: any) => {
          if (response.error) {
            console.error(response);
            alert('구글 인증 오류: ' + response.error);
            return;
          }
          if (response.access_token) {
            setGoogleAccessToken(response.access_token);
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      console.error(err);
      alert('Google OAuth 클라이언트를 로드할 수 없습니다. 스크립트 로드 중이거나 설정 오류일 수 있습니다.');
    }
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleClientId(clientIdInput);
    setGoogleApiKey(apiKeyInput);
    alert('구글 API 설정 정보가 안전하게 로컬 환경에 저장되었습니다.');
  };

  const isMockFile = (fileName: string): boolean => {
    const lower = fileName.toLowerCase();
    return (
      lower.includes('2026_pacific_med_ledger') ||
      lower.includes('yeouido_asset_valuation_report') ||
      lower.includes('이조원') ||
      lower.includes('하이터치') ||
      lower.includes('hightouch')
    );
  };

  const populateFormStates = (doc: { fileName: string; docType?: string; parsedData?: any }) => {
    const type = doc.docType || 'PropertyLedger';
    const fileNameLower = doc.fileName.toLowerCase();
    const isHighTouch = fileNameLower.includes('hightouch') || fileNameLower.includes('하이터치');
    const isMock = isMockFile(doc.fileName);
    
    if (type === 'CorporateRegistry') {
      const corp = doc.parsedData?.corporationFound || (isMock ? {
        name: isHighTouch ? '주식회사 하이터치 솔루션' : '주식회사 이조원',
        representative: isHighTouch ? '김하이터치' : '이조원',
        capital: isHighTouch ? 300000000 : 500000000,
        regNumber: isHighTouch ? '110111-8765432' : '110111-2345678',
        bizNumber: isHighTouch ? '120-86-54321' : '104-81-12345',
        address: isHighTouch ? '서울특별시 마포구 마포대로 12' : '서울특별시 중구 을지로 88'
      } : {
        name: '',
        representative: '',
        capital: 0,
        regNumber: '',
        bizNumber: '',
        address: ''
      });
      setEditCorpName(corp.name || '');
      setEditRepresentative(corp.representative || '');
      setEditCapital(corp.capital ? String(corp.capital) : '');
      setEditRegNumber(corp.regNumber || '');
      setEditBizNumber(corp.bizNumber || '');
      setEditCorpAddress(corp.address || '');
    } else if (type === 'FinancialStatement') {
      const corp = doc.parsedData?.corporationFound || (isMock ? {
        name: isHighTouch ? '주식회사 하이터치 솔루션' : '주식회사 이조원',
        revenue: isHighTouch ? 980000000 : 1450000000,
        netIncome: isHighTouch ? 110000000 : 220000000,
        totalAssets: isHighTouch ? 4100000000 : 5500000000,
        totalLiabilities: isHighTouch ? 1500000000 : 1800000000,
        fiscalYear: '2025-12-31'
      } : {
        name: '',
        revenue: 0,
        netIncome: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        fiscalYear: ''
      });
      setEditCorpName(corp.name || '');
      setEditRevenue(corp.revenue ? String(corp.revenue) : '');
      setEditNetIncome(corp.netIncome ? String(corp.netIncome) : '');
      setEditTotalAssets(corp.totalAssets ? String(corp.totalAssets) : '');
      setEditTotalLiabilities(corp.totalLiabilities ? String(corp.totalLiabilities) : '');
      setEditFiscalYear(corp.fiscalYear || '');
      const matched = corporations.find(c => c.name.includes(corp.name || '') || (corp.name || '').includes(c.name));
      setEditTargetCorpId(matched ? matched.id : corporations[0]?.id || '');
    } else {
      const prop = doc.parsedData?.propertiesFound?.[0] || (isMock ? {
        name: isHighTouch ? '하이터치 마포 빌딩 2층' : '서초 테크노타워 4층',
        address: isHighTouch ? '서울특별시 마포구 마포대로 15' : '서울특별시 서초구 서초대로 324 (테크노타워)',
        acquisitionCost: isHighTouch ? 4200000000 : 3500000000,
        valuation: isHighTouch ? 4500000000 : 3800000000,
        mortgageAmount: isHighTouch ? 1800000000 : 1400000000,
        monthlyRent: isHighTouch ? 16000000 : 12000000,
        monthlyMaintenance: isHighTouch ? 2500000 : 2200000,
        tenantName: isHighTouch ? '대원 아이씨티' : '네오 소프트랩',
        ownerCorpId: isHighTouch ? 'corp-2' : 'corp-1',
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
      } : {
        name: '',
        address: '',
        acquisitionCost: 0,
        valuation: 0,
        mortgageAmount: 0,
        monthlyRent: 0,
        monthlyMaintenance: 0,
        tenantName: '',
        ownerCorpId: '',
        purpose: '',
        area: 0,
        structure: '',
        acquisitionDate: '',
        acquisitionReason: '',
        ownershipShare: '',
        ownershipRestrictions: '',
        creditorName: '',
        maxDebtLimit: 0,
        debtorName: ''
      });
      setEditName(prop.name || '');
      setEditAddress(prop.address || '');
      setEditCost(prop.acquisitionCost ? String(prop.acquisitionCost) : '');
      setEditValuation(prop.valuation ? String(prop.valuation) : '');
      setEditMortgage(prop.mortgageAmount ? String(prop.mortgageAmount) : '');
      setEditRent(prop.monthlyRent ? String(prop.monthlyRent) : '');
      setEditMaintenance(prop.monthlyMaintenance ? String(prop.monthlyMaintenance) : '');
      setEditTenant(prop.tenantName || '');
      setEditOwnerCorpId(prop.ownerCorpId || corporations[0]?.id || '');

      setEditPurpose(prop.purpose || '');
      setEditArea(prop.area ? String(prop.area) : '');
      setEditStructure(prop.structure || '');
      setEditAcquisitionDate(prop.acquisitionDate || '');
      setEditAcquisitionReason(prop.acquisitionReason || '');
      setEditOwnershipShare(prop.ownershipShare || '');
      setEditOwnershipRestrictions(prop.ownershipRestrictions || '');
      setEditCreditorName(prop.creditorName || '');
      setEditMaxDebtLimit(prop.maxDebtLimit ? String(prop.maxDebtLimit) : '');
      setEditDebtorName(prop.debtorName || '');
    }
  };

  // Handle Double Click or Click on item
  const handleItemClick = (item: DriveItem) => {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      // Open Folder: Push to breadcrumb trail
      setBreadcrumbs(prev => [...prev, { id: item.id, name: item.name }]);
    } else {
      // Select File for OCR: Register document to context registry if missing
      const isAlreadyInQueue = ocrDocuments.some(d => d.id === item.id);
      
      // Auto-classify document type based on folder and name
      let inferredType: 'PropertyLedger' | 'CorporateRegistry' | 'FinancialStatement' = 'PropertyLedger';
      if (currentFolderId === 'folder-reconst-docs' || item.name.includes('등기부')) {
        inferredType = 'CorporateRegistry';
      } else if (currentFolderId === 'folder-finance-docs' || item.name.includes('재무제표')) {
        inferredType = 'FinancialStatement';
      }

      if (!isAlreadyInQueue) {
        importOcrDocument({
          id: item.id,
          fileName: item.name,
          fileSize: item.size || 'Unknown Size',
          source: 'GoogleDrive',
          status: 'Pending',
          docType: inferredType
        });
      }
      setSelectedId(item.id);
      
      // We will look up the newly selected or existing document
      // and populate fields if it has success status
      setTimeout(() => {
        const doc = ocrDocuments.find(d => d.id === item.id);
        if (doc && doc.status === 'Success') {
          populateFormStates(doc);
          setShowImportPreview(true);
        } else {
          // If not analyzed, set fields anyway based on initial inferred defaults
          populateFormStates({ fileName: item.name, docType: inferredType });
          setShowImportPreview(false);
        }
      }, 50);
    }
  };

  // Jump to specific breadcrumb level
  const handleBreadcrumbClick = (idx: number) => {
    setBreadcrumbs(prev => prev.slice(0, idx + 1));
  };

  // Move back one folder level
  const handleGoBack = () => {
    if (breadcrumbs.length > 1) {
      setBreadcrumbs(prev => prev.slice(0, prev.length - 1));
    }
  };

  const handleRunOcr = (id: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      processOcrDocument(id);
      setIsProcessing(false);

      const doc = ocrDocuments.find(d => d.id === id);
      const type = doc?.docType || 'PropertyLedger';
      const fileNameLower = doc?.fileName.toLowerCase() || '';
      const isHighTouch = fileNameLower.includes('hightouch') || fileNameLower.includes('하이터치');
      const isMock = doc ? isMockFile(doc.fileName) : false;

      if (type === 'CorporateRegistry') {
        const corpName = isMock ? (isHighTouch ? '주식회사 하이터치 솔루션' : '주식회사 이조원') : '';
        const rep = isMock ? (isHighTouch ? '김하이터치' : '이조원') : '';
        const cap = isMock ? (isHighTouch ? '300000000' : '500000000') : '';
        const reg = isMock ? (isHighTouch ? '110111-8765432' : '110111-2345678') : '';
        const biz = isMock ? (isHighTouch ? '120-86-54321' : '104-81-12345') : '';
        const addr = isMock ? (isHighTouch ? '서울특별시 마포구 마포대로 12' : '서울특별시 중구 을지로 88') : '';

        setEditCorpName(corpName);
        setEditRepresentative(rep);
        setEditCapital(cap);
        setEditRegNumber(reg);
        setEditBizNumber(biz);
        setEditCorpAddress(addr);
      } else if (type === 'FinancialStatement') {
        const corpName = isMock ? (isHighTouch ? '주식회사 하이터치 솔루션' : '주식회사 이조원') : '';
        const rev = isMock ? (isHighTouch ? '980000000' : '1450000000') : '';
        const net = isMock ? (isHighTouch ? '110000000' : '220000000') : '';
        const ast = isMock ? (isHighTouch ? '4100000000' : '5500000000') : '';
        const lia = isMock ? (isHighTouch ? '1500000000' : '1800000000') : '';
        const fy = isMock ? '2025-12-31' : '';

        setEditCorpName(corpName);
        setEditRevenue(rev);
        setEditNetIncome(net);
        setEditTotalAssets(ast);
        setEditTotalLiabilities(lia);
        setEditFiscalYear(fy);
        const matched = corporations.find(c => c.name.includes(corpName) || corpName.includes(c.name));
        setEditTargetCorpId(matched ? matched.id : corporations[0]?.id || '');
      } else {
        // PropertyLedger
        let pName = isMock ? (isHighTouch ? '하이터치 마포 빌딩 2층' : '서초 테크노타워 4층') : '';
        let addr = isMock ? (isHighTouch ? '서울특별시 마포구 마포대로 15' : '서울특별시 서초구 서초대로 324 (테크노타워)') : '';
        let cost = isMock ? (isHighTouch ? '4200000000' : '3500000000') : '';
        let valuation = isMock ? (isHighTouch ? '4500000000' : '3800000000') : '';
        let mortgage = isMock ? (isHighTouch ? '1800000000' : '1400000000') : '';
        let rent = isMock ? (isHighTouch ? '16000000' : '12000000') : '';
        let maint = isMock ? (isHighTouch ? '2500000' : '2200000') : '';
        let tenant = isMock ? (isHighTouch ? '대원 아이씨티' : '네오 소프트랩') : '';

        let purpose = isMock ? (isHighTouch ? '업무시설 (사무소)' : '근린생활시설 (소매점)') : '';
        let area = isMock ? (isHighTouch ? '245.5' : '120.8') : '';
        let structure = isMock ? '철근콘크리트 구조' : '';
        let acqDate = isMock ? (isHighTouch ? '2024-05-18' : '2023-11-20') : '';
        let acqReason = isMock ? '매매' : '';
        let ownShare = isMock ? '1/1 (단독소유)' : '';
        let ownRestr = isMock ? (isHighTouch ? '가압류 (서울마포지방법원)' : '없음') : '';
        let creditor = isMock ? (isHighTouch ? '하나은행' : '신한은행') : '';
        let maxLimit = isMock ? (isHighTouch ? '2160000000' : '1680000000') : '';
        let debtor = isMock ? (isHighTouch ? '주식회사 하이터치 솔루션' : '주식회사 이조원') : '';

        setEditName(pName);
        setEditAddress(addr);
        setEditCost(cost);
        setEditValuation(valuation);
        setEditMortgage(mortgage);
        setEditRent(rent);
        setEditMaintenance(maint);
        setEditTenant(tenant);
        setEditOwnerCorpId(isMock ? (isHighTouch ? 'corp-2' : 'corp-1') : corporations[0]?.id || '');

        setEditPurpose(purpose);
        setEditArea(area);
        setEditStructure(structure);
        setEditAcquisitionDate(acqDate);
        setEditAcquisitionReason(acqReason);
        setEditOwnershipShare(ownShare);
        setEditOwnershipRestrictions(ownRestr);
        setEditCreditorName(creditor);
        setEditMaxDebtLimit(maxLimit);
        setEditDebtorName(debtor);
      }
      
      setShowImportPreview(true);
    }, 2500);
  };

  const handleCommitToLedger = () => {
    const type = selectedDoc?.docType || 'PropertyLedger';

    if (type === 'CorporateRegistry') {
      if (!editCorpName || !editBizNumber || !editRepresentative) {
        alert('필수 입력 필드가 누락되었습니다.');
        return;
      }
      const existing = corporations.find(c => c.name === editCorpName);
      if (existing) {
        updateCorporation({
          ...existing,
          representative: editRepresentative,
          capital: Number(editCapital) || 0,
          regNumber: editRegNumber,
          bizNumber: editBizNumber,
          address: editCorpAddress
        });
        alert(`[법인 등기 업데이트 완료] '${editCorpName}'의 법인 등기 정보가 성공적으로 업데이트되었습니다.`);
      } else {
        addCorporation({
          name: editCorpName,
          representative: editRepresentative,
          capital: Number(editCapital) || 0,
          regNumber: editRegNumber,
          bizNumber: editBizNumber,
          address: editCorpAddress
        });
        alert(`[신규 법인 등록 완료] '${editCorpName}'이(가) 신규 법인 대장에 성공적으로 등록되었습니다.`);
      }
    } else if (type === 'FinancialStatement') {
      const targetCorp = corporations.find(c => c.id === editTargetCorpId);
      if (!targetCorp) {
        alert('재무 지표를 반영할 대상 법인이 없습니다.');
        return;
      }
      updateCorporation({
        ...targetCorp,
        revenue: Number(editRevenue) || 0,
        netIncome: Number(editNetIncome) || 0,
        totalAssets: Number(editTotalAssets) || 0,
        totalLiabilities: Number(editTotalLiabilities) || 0,
        fiscalYear: editFiscalYear
      });
      alert(`[재무 제표 반영 완료] '${targetCorp.name}'의 ${editFiscalYear} 회계 결산 정보가 성공적으로 반영되었습니다.`);
    } else {
      if (!editName || !editAddress || !editRent) {
        alert('필수 파라미터가 유효하지 않습니다.');
        return;
      }

      addProperty({
        name: editName,
        address: editAddress,
        acquisitionCost: Number(editCost) || 0,
        valuation: Number(editValuation) || 0,
        mortgageAmount: Number(editMortgage) || 0,
        monthlyRent: Number(editRent) || 0,
        monthlyMaintenance: Number(editMaintenance) || 0,
        tenantName: editTenant,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        investorIds: [],
        ownerCorpId: editOwnerCorpId || undefined,
        purpose: editPurpose || undefined,
        area: Number(editArea) || undefined,
        structure: editStructure || undefined,
        acquisitionDate: editAcquisitionDate || undefined,
        acquisitionReason: editAcquisitionReason || undefined,
        ownershipShare: editOwnershipShare || undefined,
        ownershipRestrictions: editOwnershipRestrictions || undefined,
        creditorName: editCreditorName || undefined,
        maxDebtLimit: Number(editMaxDebtLimit) || undefined,
        debtorName: editDebtorName || undefined
      });

      alert('OCR 판독 결과가 성공적으로 부동산 통합 자산 대장에 등록되었습니다.');
    }
    setShowImportPreview(false);
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>구글 드라이브 폴더 탐색기 & OCR</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
            구글 드라이브의 폴더 트리를 검색하고 개별 파일을 선택하여 광학 문자 판독(OCR)을 실행합니다.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowDeveloperGuide(!showDeveloperGuide)}>
            <HelpCircle size={16} /> API 연동 가이드
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleConnectDrive} 
            disabled={isSyncing}
          >
            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
            {googleAccessToken ? '구글 계정 연동 완료' : '구글 드라이브 연동'}
          </button>
        </div>
      </div>

      {/* Guide Banner */}
      {showDeveloperGuide && (
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid hsl(var(--info))', fontSize: '0.85rem', lineHeight: '1.6', color: 'hsl(var(--text-secondary))' }}>
          <h4 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>구글 클라우드 콘솔 연동 설정법</h4>
          <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li>[Google Cloud Console](https://console.cloud.google.com)에 로그인합니다.</li>
            <li><strong>Google Drive API</strong>를 활성화합니다.</li>
            <li><strong>Credentials</strong>에서 <strong>API Key</strong>와 <strong>OAuth Client ID</strong>를 발급받습니다.</li>
            <li>OAuth 생성 시 승인된 자바스크립트 원본(Authorized JavaScript Origins)에 <code>{window.location.origin}</code> 및 <code>http://localhost:5173</code>을 모두 등록해 주세요.</li>
            <li>하단의 키 설정 카드에 저장하신 후 로그인 연동을 진행하면 실제 구글 드라이브 폴더 조회가 활성화됩니다.</li>
          </ol>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="grid-cols-1-2">
        {/* Left column: Folder Tree Explorer and Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Nested Folder Explorer */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: '380px', maxHeight: '420px', overflowY: 'auto' }}>
            {/* Folder Navigation Header & Breadcrumbs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>구글 드라이브 파일 탐색</span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                {breadcrumbs.length > 1 && (
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '0.2rem', color: 'white' }}
                    onClick={handleGoBack}
                    title="상위 폴더로"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}

                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.id}>
                    {idx > 0 && <ChevronRight size={12} style={{ color: 'hsl(var(--text-muted))' }} />}
                    <span 
                      style={{ 
                        color: idx === breadcrumbs.length - 1 ? 'white' : 'hsl(var(--brand-primary))',
                        fontWeight: idx === breadcrumbs.length - 1 ? 700 : 500,
                        cursor: idx === breadcrumbs.length - 1 ? 'default' : 'pointer'
                      }}
                      onClick={() => idx !== breadcrumbs.length - 1 && handleBreadcrumbClick(idx)}
                    >
                      {crumb.name}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Folder Grid/List Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {isSyncing ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0', color: 'hsl(var(--text-muted))', gap: '0.5rem' }}>
                  <Loader2 size={24} className="animate-spin" />
                  <span style={{ fontSize: '0.8rem' }}>파일 목록 동기화 중...</span>
                </div>
              ) : driveItems.length > 0 ? (
                driveItems.map(item => {
                  const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
                  const isSelected = selectedId === item.id;
                  
                  return (
                    <div 
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSelected ? 'rgba(99,102,241,0.1)' : 'hsl(var(--bg-tertiary))',
                        border: isSelected ? '1px solid hsl(var(--brand-primary))' : '1px solid hsl(var(--border-color))',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background-color var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: isFolder ? 'hsl(var(--warning))' : 'hsl(var(--brand-primary))' }}>
                          {isFolder ? <Folder size={18} /> : <FileText size={18} />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>
                            {item.name}
                          </span>
                          {item.size && (
                            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>{item.size}</span>
                          )}
                        </div>
                      </div>

                      {isFolder && (
                        <ChevronRight size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>
                  이 폴더는 비어 있습니다.
                </div>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.5rem' }}>
              <Key size={16} /> 구글 연동 프로젝트 키 설정
            </h3>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Google OAuth Client ID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                  placeholder="클라이언트 ID 입력"
                  value={clientIdInput}
                  onChange={e => setClientIdInput(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Google API Key</label>
                <input 
                  type="password" 
                  className="form-input" 
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                  placeholder="API Key 입력"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '0.5rem' }}>
                설정 저장
              </button>
            </form>
          </div>
        </div>

        {/* Right column: OCR Analysis Preview */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '450px' }}>
          {selectedDoc ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: 'white' }}>{selectedDoc.fileName}</h4>
                  <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-secondary))' }}>가상 자산 ID: {selectedDoc.id}</span>
                </div>

                {selectedDoc.status === 'Pending' && !isProcessing && (
                  <button className="btn btn-success" onClick={() => handleRunOcr(selectedDoc.id)}>
                    <Play size={14} /> OCR 텍스트 추출 실행
                  </button>
                )}
              </div>

              {/* Document Type Selector */}
              <div style={{ 
                backgroundColor: 'hsl(var(--bg-tertiary))', 
                padding: '0.85rem 1rem', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid hsl(var(--border-color))',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                  OCR 파서 문서 유형 선택 *
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {(['PropertyLedger', 'CorporateRegistry', 'FinancialStatement'] as const).map(type => {
                    const isSelected = (selectedDoc.docType || 'PropertyLedger') === type;
                    const label = type === 'PropertyLedger' ? '부동산 등기/대장' 
                                : type === 'CorporateRegistry' ? '법인 등기부등본' 
                                : '재무제표';
                    
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          updateOcrDocumentType(selectedDoc.id, type);
                          // Re-populate initial fields when type changes
                          populateFormStates({ fileName: selectedDoc.fileName, docType: type });
                        }}
                        disabled={selectedDoc.status === 'Success'}
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: isSelected ? '1px solid hsl(var(--brand-primary))' : '1px solid hsl(var(--border-color))',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(0,0,0,0.15)',
                          color: isSelected ? 'white' : 'hsl(var(--text-secondary))',
                          cursor: selectedDoc.status === 'Success' ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isProcessing && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem', padding: '3rem 0' }}>
                  <Loader2 size={40} className="animate-spin" style={{ color: 'hsl(var(--brand-primary))' }} />
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>문서 레이아웃 인식 및 광학 스캔(OCR) 실행 중...</p>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '0.25rem' }}>
                      {selectedDoc.docType === 'CorporateRegistry' ? '법인 등기 기재사항 및 대표정보 추출 중' :
                       selectedDoc.docType === 'FinancialStatement' ? '회계연도 재무 지표 및 수지 계정 분석 중' :
                       '재무 구조 매핑 및 부동산 소유 내역 추출 중'}
                    </p>
                  </div>
                </div>
              )}

              {!isProcessing && selectedDoc.status === 'Success' && showImportPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ 
                    height: '110px', 
                    backgroundColor: 'rgba(255,255,255,0.02)', 
                    border: '1px solid hsl(var(--border-color))', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '1rem',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}>
                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', position: 'absolute', top: '5px', left: '10px' }}>
                      [PDF 원본 파일 레이아웃 분석]
                    </div>
                    
                    {selectedDoc.docType === 'CorporateRegistry' ? (
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                        <div style={{ border: '1px dashed hsl(var(--success))', backgroundColor: 'rgba(16,185,129,0.08)', padding: '0.25rem', fontSize: '0.65rem', color: 'hsl(var(--success))', borderRadius: '2px' }}>
                          [법인명 판독 완료]: {editCorpName}
                        </div>
                        <div style={{ border: '1px dashed hsl(var(--success))', backgroundColor: 'rgba(16,185,129,0.08)', padding: '0.25rem', fontSize: '0.65rem', color: 'hsl(var(--success))', borderRadius: '2px' }}>
                          [자본금 판독 완료]: {Number(editCapital).toLocaleString()}원
                        </div>
                      </div>
                    ) : selectedDoc.docType === 'FinancialStatement' ? (
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                        <div style={{ border: '1px dashed hsl(var(--success))', backgroundColor: 'rgba(16,185,129,0.08)', padding: '0.25rem', fontSize: '0.65rem', color: 'hsl(var(--success))', borderRadius: '2px' }}>
                          [매출 판독 완료]: {Number(editRevenue).toLocaleString()}원
                        </div>
                        <div style={{ border: '1px dashed hsl(var(--success))', backgroundColor: 'rgba(16,185,129,0.08)', padding: '0.25rem', fontSize: '0.65rem', color: 'hsl(var(--success))', borderRadius: '2px' }}>
                          [당기순이익 판독 완료]: {Number(editNetIncome).toLocaleString()}원
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                        <div style={{ border: '1px dashed hsl(var(--success))', backgroundColor: 'rgba(16,185,129,0.08)', padding: '0.25rem', fontSize: '0.65rem', color: 'hsl(var(--success))', borderRadius: '2px' }}>
                          [자산명 판독 완료]: {editName}
                        </div>
                        <div style={{ border: '1px dashed hsl(var(--success))', backgroundColor: 'rgba(16,185,129,0.08)', padding: '0.25rem', fontSize: '0.65rem', color: 'hsl(var(--success))', borderRadius: '2px' }}>
                          [임대료 판독 완료]: {Number(editRent).toLocaleString()}원
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedDoc.docType === 'CorporateRegistry' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>
                        <Edit3 size={14} /> 등기부 추출 데이터 보정
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">법인명</label>
                          <input type="text" className="form-input" value={editCorpName} onChange={e => setEditCorpName(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">대표이사</label>
                          <input type="text" className="form-input" value={editRepresentative} onChange={e => setEditRepresentative(e.target.value)} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">법인등록번호</label>
                          <input type="text" className="form-input" value={editRegNumber} onChange={e => setEditRegNumber(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">사업자등록번호</label>
                          <input type="text" className="form-input" value={editBizNumber} onChange={e => setEditBizNumber(e.target.value)} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">설립 자본금 (원)</label>
                          <input type="number" className="form-input" value={editCapital} onChange={e => setEditCapital(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">본점 주소</label>
                          <input type="text" className="form-input" value={editCorpAddress} onChange={e => setEditCorpAddress(e.target.value)} />
                        </div>
                      </div>

                      <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleCommitToLedger}>
                        <Save size={16} /> ERP 법인 대장에 등록/업데이트
                      </button>
                    </div>
                  )}

                  {selectedDoc.docType === 'FinancialStatement' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>
                        <Edit3 size={14} /> 재무제표 추출 데이터 보정
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">판독 대상 법인</label>
                          <select 
                            className="form-input"
                            value={editTargetCorpId}
                            onChange={e => setEditTargetCorpId(e.target.value)}
                            style={{ backgroundColor: 'hsl(var(--bg-tertiary))', color: 'white', border: '1px solid hsl(var(--border-color))', width: '100%' }}
                          >
                            {corporations.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">결산 기준년도</label>
                          <input type="text" className="form-input" value={editFiscalYear} onChange={e => setEditFiscalYear(e.target.value)} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">연 매출액 (원)</label>
                          <input type="number" className="form-input" value={editRevenue} onChange={e => setEditRevenue(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">당기순이익 (원)</label>
                          <input type="number" className="form-input" value={editNetIncome} onChange={e => setEditNetIncome(e.target.value)} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">자산 총계 (원)</label>
                          <input type="number" className="form-input" value={editTotalAssets} onChange={e => setEditTotalAssets(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">부채 총계 (원)</label>
                          <input type="number" className="form-input" value={editTotalLiabilities} onChange={e => setEditTotalLiabilities(e.target.value)} />
                        </div>
                      </div>

                      <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleCommitToLedger}>
                        <Save size={16} /> ERP 법인 재무정보 반영
                      </button>
                    </div>
                  )}

                  {(selectedDoc.docType === 'PropertyLedger' || !selectedDoc.docType) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>
                        <Edit3 size={14} /> 등기부 추출 데이터 보정 (표제부/갑구/을구)
                      </div>

                      {/* 1. 기본 정보 */}
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--brand-primary))' }}>기본 정보</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">부동산명 *</label>
                          <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">소재지 주소 *</label>
                          <input type="text" className="form-input" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">소유 법인 *</label>
                          <select 
                            className="form-input"
                            value={editOwnerCorpId}
                            onChange={e => setEditOwnerCorpId(e.target.value)}
                            style={{ backgroundColor: 'hsl(var(--bg-tertiary))', color: 'white', border: '1px solid hsl(var(--border-color))', width: '100%' }}
                          >
                            <option value="">법인 선택</option>
                            {corporations.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">임차인 상호</label>
                          <input type="text" className="form-input" value={editTenant} onChange={e => setEditTenant(e.target.value)} />
                        </div>
                      </div>

                      {/* 2. 표제부 */}
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.35rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--success))' }}>표제부 정보 (건물 개요)</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">건물 용도</label>
                          <input type="text" className="form-input" placeholder="예: 근린생활시설" value={editPurpose} onChange={e => setEditPurpose(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">전용면적 (㎡)</label>
                          <input type="number" step="0.01" className="form-input" placeholder="예: 120.8" value={editArea} onChange={e => setEditArea(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">건물 구조</label>
                          <input type="text" className="form-input" placeholder="예: 철근콘크리트조" value={editStructure} onChange={e => setEditStructure(e.target.value)} />
                        </div>
                      </div>

                      {/* 3. 갑구 */}
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.35rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--info))' }}>갑구 정보 (소유권 및 제한)</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">소유권취득일</label>
                          <input type="text" className="form-input" placeholder="YYYY-MM-DD" value={editAcquisitionDate} onChange={e => setEditAcquisitionDate(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">취득 원인</label>
                          <input type="text" className="form-input" placeholder="예: 매매" value={editAcquisitionReason} onChange={e => setEditAcquisitionReason(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">소유권 지분</label>
                          <input type="text" className="form-input" placeholder="예: 1/1" value={editOwnershipShare} onChange={e => setEditOwnershipShare(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">권리제한사항</label>
                          <input type="text" className="form-input" placeholder="예: 압류, 가압류 또는 없음" value={editOwnershipRestrictions} onChange={e => setEditOwnershipRestrictions(e.target.value)} />
                        </div>
                      </div>

                      {/* 4. 을구 */}
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.35rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--danger))' }}>을구 정보 (근저당 설정)</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">채권최고액 (원)</label>
                          <input type="number" className="form-input" placeholder="예: 1680000000" value={editMaxDebtLimit} onChange={e => setEditMaxDebtLimit(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">채권기관명</label>
                          <input type="text" className="form-input" placeholder="예: 신한은행" value={editCreditorName} onChange={e => setEditCreditorName(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">채무자 상호</label>
                          <input type="text" className="form-input" placeholder="예: 주식회사 이조원" value={editDebtorName} onChange={e => setEditDebtorName(e.target.value)} />
                        </div>
                      </div>

                      {/* 5. 재무 회계 정보 */}
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.35rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>회계 및 재무 지표</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">취득가액 (원)</label>
                          <input type="number" className="form-input" value={editCost} onChange={e => setEditCost(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">감정가액 (원)</label>
                          <input type="number" className="form-input" value={editValuation} onChange={e => setEditValuation(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">담보대출금 (원)</label>
                          <input type="number" className="form-input" value={editMortgage} onChange={e => setEditMortgage(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">월 임대료 (원)</label>
                          <input type="number" className="form-input" value={editRent} onChange={e => setEditRent(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">월 관리비 (원)</label>
                          <input type="number" className="form-input" value={editMaintenance} onChange={e => setEditMaintenance(e.target.value)} />
                        </div>
                      </div>

                      <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleCommitToLedger}>
                        <Save size={16} /> ERP 부동산 자산 대장에 저장
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedDoc.status === 'Pending' && !isProcessing && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'hsl(var(--text-muted))', gap: '0.5rem', padding: '3rem 0' }}>
                  <FileText size={36} strokeWidth={1} />
                  <span style={{ fontSize: '0.85rem' }}>이 문서는 아직 OCR 분석이 실행되지 않았습니다. 상단 버튼을 클릭하세요.</span>
                </div>
              )}

              {selectedDoc.status === 'Success' && !showImportPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'hsl(var(--success))', gap: '0.5rem', padding: '3rem 0' }}>
                  <CheckCircle size={36} strokeWidth={1} />
                  <span style={{ fontSize: '0.85rem' }}>이미 이전에 파싱되어 데이터베이스 변환 처리가 완료된 문서입니다.</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '350px', color: 'hsl(var(--text-muted))', gap: '0.5rem' }}>
              <Cloud size={40} strokeWidth={1} />
              <span style={{ fontSize: '0.85rem' }}>스캔할 클라우드 문서를 왼쪽 목록에서 선택해 주세요.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DocOCRHub;
