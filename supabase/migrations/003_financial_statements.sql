-- =============================================
-- 003: 연도별 재무제표 테이블 + financial-docs 버킷
-- Supabase SQL 에디터에서 실행하세요
-- =============================================

-- 재무제표 이력 테이블 생성
CREATE TABLE IF NOT EXISTS public.financial_statements (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  corporation_id   UUID        NOT NULL REFERENCES public.corporations(id) ON DELETE CASCADE,
  fiscal_year      TEXT        NOT NULL,          -- 회계연도 (예: "2024")
  revenue          BIGINT,                        -- 매출액
  operating_income BIGINT,                        -- 영업이익
  net_income       BIGINT,                        -- 당기순이익
  total_assets     BIGINT,                        -- 자산총계
  total_liabilities BIGINT,                       -- 부채총계
  equity           BIGINT,                        -- 자본총계
  document_url     TEXT,                          -- Supabase Storage PDF URL
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated CRUD financial_statements"
  ON public.financial_statements FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- financial-docs Storage 버킷 생성 (비공개)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'financial-docs',
  'financial-docs',
  false,
  52428800,   -- 50MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "Authenticated upload financial docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'financial-docs');

CREATE POLICY "Authenticated read financial docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'financial-docs');

CREATE POLICY "Authenticated delete financial docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'financial-docs');
