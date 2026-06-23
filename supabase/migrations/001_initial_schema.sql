-- =============================================
-- 태평양 자산관리 ERP — 초기 데이터베이스 스키마
-- Supabase SQL 에디터에서 실행하세요
-- =============================================

-- ① 프로필 (auth.users 연장)
CREATE TABLE IF NOT EXISTS public.profiles (
  id        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name      TEXT NOT NULL DEFAULT '',
  role      TEXT NOT NULL DEFAULT 'Drafter' CHECK (role IN ('Drafter', 'Reviewer', 'Approver')),
  position  TEXT NOT NULL DEFAULT '실무 담당자',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ② 법인 대장
CREATE TABLE IF NOT EXISTS public.corporations (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name              TEXT NOT NULL,
  reg_number        TEXT DEFAULT '',
  biz_number        TEXT DEFAULT '',
  representative    TEXT DEFAULT '',
  address           TEXT DEFAULT '',
  capital           BIGINT DEFAULT 0,
  revenue           BIGINT,
  net_income        BIGINT,
  total_assets      BIGINT,
  total_liabilities BIGINT,
  fiscal_year       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ③ 부동산 자산
CREATE TABLE IF NOT EXISTS public.properties (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                   TEXT NOT NULL,
  address                TEXT NOT NULL DEFAULT '',
  acquisition_cost       BIGINT DEFAULT 0,
  valuation              BIGINT DEFAULT 0,
  mortgage_amount        BIGINT DEFAULT 0,
  monthly_rent           BIGINT DEFAULT 0,
  monthly_maintenance    BIGINT DEFAULT 0,
  tenant_name            TEXT DEFAULT '',
  image_url              TEXT,
  investor_ids           TEXT[] DEFAULT '{}',
  owner_corp_id          UUID REFERENCES public.corporations(id) ON DELETE SET NULL,
  -- 표제부
  purpose                TEXT,
  area                   NUMERIC,
  structure              TEXT,
  -- 갑구
  acquisition_date       DATE,
  acquisition_reason     TEXT,
  ownership_share        TEXT,
  ownership_restrictions TEXT,
  -- 을구
  creditor_name          TEXT,
  max_debt_limit         BIGINT,
  debtor_name            TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ④ 투자자
CREATE TABLE IF NOT EXISTS public.investors (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                 TEXT NOT NULL,
  capital_invested     BIGINT DEFAULT 0,
  ownership_ratio      NUMERIC DEFAULT 0,
  property_ids         TEXT[] DEFAULT '{}',
  bank_account         TEXT DEFAULT '',
  total_dividends_paid BIGINT DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ⑤ 비용·지출
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Other'
              CHECK (category IN ('Labor','Maintenance','Utility','Tax','RehabDebt','Other')),
  amount      BIGINT NOT NULL DEFAULT 0,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  is_approved BOOLEAN DEFAULT FALSE,
  approval_id UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ⑥ 자금 거래 내역
CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type         TEXT NOT NULL CHECK (type IN ('Inflow','Outflow')),
  title        TEXT NOT NULL,
  amount       BIGINT NOT NULL DEFAULT 0,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  category     TEXT DEFAULT '',
  is_actual    BOOLEAN DEFAULT FALSE,
  property_id  UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  reference_id UUID,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ⑦ ERP 전자결재
CREATE TABLE IF NOT EXISTS public.approval_items (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title              TEXT NOT NULL,
  type               TEXT NOT NULL DEFAULT 'Expense' CHECK (type IN ('Expense','Document')),
  content            TEXT DEFAULT '',
  amount             BIGINT,
  drafter            TEXT NOT NULL DEFAULT '',
  created_at         DATE DEFAULT CURRENT_DATE,
  status             TEXT NOT NULL DEFAULT 'Pending'
                     CHECK (status IN ('Pending','Approved','Rejected')),
  approval_line      JSONB DEFAULT '[]',
  current_signer_idx INTEGER DEFAULT 0,
  expense_data       JSONB
);

-- ⑧ OCR 문서 허브
CREATE TABLE IF NOT EXISTS public.ocr_documents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name   TEXT NOT NULL,
  file_size   TEXT DEFAULT '',
  source      TEXT DEFAULT 'Local' CHECK (source IN ('GoogleDrive','Local')),
  status      TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Success','Failed')),
  doc_type    TEXT CHECK (doc_type IN ('PropertyLedger','CorporateRegistry','FinancialStatement')),
  parsed_data JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_documents ENABLE ROW LEVEL SECURITY;

-- profiles: 본인 읽기 + 인증된 사용자 전체 목록 조회
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 나머지 테이블: 인증된 사용자 전체 CRUD
CREATE POLICY "corp_all"    ON public.corporations  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "prop_all"    ON public.properties    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inv_all"     ON public.investors     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "exp_all"     ON public.expenses      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tx_all"      ON public.transactions  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "appr_all"    ON public.approval_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ocr_all"     ON public.ocr_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- 신규 가입 시 자동으로 profile 생성하는 트리거
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'Drafter',
    '실무 담당자'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
