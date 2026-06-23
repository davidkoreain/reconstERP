-- =============================================
-- 002: Supabase Storage 버킷 + properties 테이블에 document_url 추가
-- Supabase SQL 에디터에서 실행하세요
-- =============================================

-- properties 테이블에 원본 등기부 PDF URL 컬럼 추가
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Storage 버킷 생성 (비공개 – 인증된 사용자만 접근)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-docs',
  'property-docs',
  false,
  52428800,   -- 50MB 제한
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 인증된 사용자만 업로드/다운로드 가능
CREATE POLICY "Authenticated upload property docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-docs');

CREATE POLICY "Authenticated read property docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'property-docs');

CREATE POLICY "Authenticated delete property docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-docs');
