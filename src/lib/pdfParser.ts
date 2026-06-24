import * as pdfjsLib from 'pdfjs-dist';

// CDN worker – version-matched to the installed pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedLedgerData {
  address?: string;
  purpose?: string;
  area?: number;
  structure?: string;
  acquisitionDate?: string;
  acquisitionReason?: string;
  ownershipShare?: string;
  ownershipRestrictions?: string;
  creditorName?: string;
  maxDebtLimit?: number;
  debtorName?: string;
}

// ─── PDF 텍스트 추출 ──────────────────────────────────────────────────────────

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(pageText);
  }

  return pages.join('\n');
}

// ─── 등기부등본 필드 파싱 ──────────────────────────────────────────────────────

export function parsePropertyLedger(text: string): ParsedLedgerData {
  const result: ParsedLedgerData = {};

  // ── 소재지 / 주소 ──────────────────────────────────────────────────────────
  // 패턴: "소재지번" 또는 "소  재  지" 등 다양한 공백 표기
  const addressPatterns = [
    /소\s*재\s*지\s*번?\s+([가-힣0-9\s\-()（）,\.]+?)(?=\s{2,}|\s+건물내역|\s+[표갑을]\s*구)/,
    /서울(?:특별시|시)?\s+[가-힣]+[구군]\s+[가-힣0-9\s\-]+/,
    /경기도\s+[가-힣]+[시군]\s+[가-힣0-9\s\-]+/,
  ];
  for (const pat of addressPatterns) {
    const m = text.match(pat);
    if (m) { result.address = m[0].trim().replace(/\s+/g, ' '); break; }
  }

  // ── 용도 ────────────────────────────────────────────────────────────────────
  const purposeMatch = text.match(/주\s*용\s*도\s*[:：]?\s*([가-힣\s()（）]+?)(?:\s{2,}|\s+면적|\s+구조|$)/);
  if (purposeMatch) result.purpose = purposeMatch[1].trim();

  // ── 면적 ────────────────────────────────────────────────────────────────────
  const areaMatch = text.match(/([\d,]+\.?\d*)\s*㎡/);
  if (areaMatch) result.area = parseFloat(areaMatch[1].replace(/,/g, ''));

  // ── 구조 ────────────────────────────────────────────────────────────────────
  const structurePatterns = [
    /주\s*구\s*조\s*[:：]?\s*([가-힣\s]+?조)/,
    /(철근콘크리트|철골철근콘크리트|철골조|목조|조적조|경량철골조)[가-힣\s]*/,
  ];
  for (const pat of structurePatterns) {
    const m = text.match(pat);
    if (m) { result.structure = m[1]?.trim() || m[0].trim(); break; }
  }

  // ── 소유권 취득일 ───────────────────────────────────────────────────────────
  const dateMatch = text.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(매매|증여|상속|경매|공매|신탁|판결)/);
  if (dateMatch) {
    result.acquisitionDate =
      `${dateMatch[1]}-${String(dateMatch[2]).padStart(2, '0')}-${String(dateMatch[3]).padStart(2, '0')}`;
    result.acquisitionReason = dateMatch[4];
  }

  // 원인만 따로 추출 (날짜 없이 원인만 나오는 경우)
  if (!result.acquisitionReason) {
    const reasonMatch = text.match(/등\s*기\s*원\s*인\s*[:：]?\s*(매매|증여|상속|경매|공매|신탁)/);
    if (reasonMatch) result.acquisitionReason = reasonMatch[1];
  }

  // ── 소유 지분 ───────────────────────────────────────────────────────────────
  const shareMatch = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (shareMatch) {
    const a = parseInt(shareMatch[1]);
    const b = parseInt(shareMatch[2]);
    result.ownershipShare = a === b ? '1/1 (단독소유)' : `${shareMatch[1]}/${shareMatch[2]}`;
  } else {
    result.ownershipShare = '1/1 (단독소유)';
  }

  // ── 소유권 제한 (가압류·압류) ───────────────────────────────────────────────
  if (text.includes('가압류')) {
    const courtMatch = text.match(/가압류.*?([가-힣]+(?:지방)?법원)/);
    result.ownershipRestrictions = courtMatch
      ? `가압류 (${courtMatch[1].trim()})`
      : '가압류';
  } else if (text.includes('압류')) {
    result.ownershipRestrictions = '압류';
  } else if (text.includes('가처분')) {
    result.ownershipRestrictions = '가처분';
  } else {
    result.ownershipRestrictions = '없음';
  }

  // ── 근저당권자 (채권기관) ────────────────────────────────────────────────────
  const creditorPatterns = [
    /근\s*저\s*당\s*권\s*자\s*[:：]?\s*([가-힣\s]+?(?:은행|금고|조합|보험|신탁|캐피탈))/,
    /채\s*권\s*자\s*[:：]?\s*([가-힣\s]+?(?:은행|금고|조합|보험|신탁|캐피탈))/,
  ];
  for (const pat of creditorPatterns) {
    const m = text.match(pat);
    if (m) { result.creditorName = m[1].trim(); break; }
  }

  // ── 채권최고액 ──────────────────────────────────────────────────────────────
  const debtLimitPatterns = [
    /채\s*권\s*최\s*고\s*액\s*금?\s*([\d,]+)\s*원/,
    /채권최고액\s*:\s*금\s*([\d,]+)\s*원/,
    /금\s*([\d,]+)\s*원\s*(?=.*채권)/,
  ];
  for (const pat of debtLimitPatterns) {
    const m = text.match(pat);
    if (m) { result.maxDebtLimit = parseInt(m[1].replace(/,/g, '')); break; }
  }

  // ── 채무자 ──────────────────────────────────────────────────────────────────
  const debtorPatterns = [
    /채\s*무\s*자\s*[:：]?\s*(주식회사\s*[가-힣\s]+|[가-힣\s]{2,20}(?:\s+주식회사)?)/,
    /채무자\s+(주식회사[가-힣\s]+)/,
  ];
  for (const pat of debtorPatterns) {
    const m = text.match(pat);
    if (m) { result.debtorName = m[1].trim().replace(/\s+/g, ' '); break; }
  }

  return result;
}

// ─── 자동 입력된 필드 개수 계산 ───────────────────────────────────────────────

export function countFilledFields(data: ParsedLedgerData): number {
  return Object.values(data).filter(v => v !== undefined && v !== '' && v !== '없음').length;
}

// ─── 재무제표 파싱 ────────────────────────────────────────────────────────────

export interface ParsedFinancialData {
  fiscalYear?: string;        // 회계연도 (예: "2024")
  revenue?: number;           // 매출액
  operatingIncome?: number;   // 영업이익
  netIncome?: number;         // 당기순이익
  totalAssets?: number;       // 자산총계
  totalLiabilities?: number;  // 부채총계
  equity?: number;            // 자본총계
}

export function parseFinancialStatement(text: string): ParsedFinancialData {
  const result: ParsedFinancialData = {};

  // 단위 검출 (천원, 백만원)
  let unit = 1;
  if (/(단위\s*:\s*천\s*원|천원\s*단위)/i.test(text)) unit = 1000;
  else if (/(단위\s*:\s*백만\s*원|백만원\s*단위)/i.test(text)) unit = 1000000;

  // 키워드 뒤 첫 번째 금액 추출
  const findAmount = (keyword: string): number | undefined => {
    const idx = text.indexOf(keyword);
    if (idx < 0) return undefined;
    const slice = text.substring(idx + keyword.length, idx + keyword.length + 200);
    // 천 단위 콤마 숫자 (1,234,567)
    const m = slice.match(/([\d]{1,3}(?:,[\d]{3})+)/);
    if (m && m.index !== undefined) {
      const prefix = slice.substring(Math.max(0, m.index - 3), m.index);
      const isNeg = prefix.includes('△') || prefix.includes('▲') || prefix.trimEnd().endsWith('(');
      const val = parseInt(m[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) return (isNeg ? -val : val) * unit;
    }
    // 콤마 없는 7자리 이상 숫자 (fallback)
    const m2 = slice.match(/(\d{6,})/);
    if (m2) {
      const val = parseInt(m2[1]);
      if (!isNaN(val) && val > 0) return val * unit;
    }
    return undefined;
  };

  // 회계연도 추출
  const yearPats: RegExp[] = [
    /(\d{4})년\s*(?:1월|01월)\s*(?:1일|01일)/,
    /당기\s*:?\s*(\d{4})년/,
    /제\s*\d+\s*기\s*(\d{4})년/,
    /(\d{4})\s*회계연도/,
  ];
  for (const p of yearPats) {
    const m = text.match(p);
    if (m) { result.fiscalYear = m[1]; break; }
  }

  // 손익계산서 항목
  result.revenue = findAmount('매출액') ?? findAmount('수익(매출액)') ?? findAmount('영업수익');
  result.operatingIncome =
    findAmount('영업이익(손실)') ?? findAmount('영업이익') ?? findAmount('영업손실');
  result.netIncome =
    findAmount('당기순이익(손실)') ?? findAmount('당기순이익') ??
    findAmount('당기순손실') ?? findAmount('당기순손익');

  // 재무상태표 항목
  result.totalAssets = findAmount('자산 총계') ?? findAmount('자산총계') ?? findAmount('자산합계');
  result.totalLiabilities = findAmount('부채 총계') ?? findAmount('부채총계') ?? findAmount('부채합계');
  result.equity = findAmount('자본 총계') ?? findAmount('자본총계') ?? findAmount('자본합계');

  return result;
}
