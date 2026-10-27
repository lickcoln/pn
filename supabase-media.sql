-- Paranoid Noise: uploads for the admin portal (photos, MP3 songs and the WAV or MP3 stompbox sound)
-- Run once in the Supabase SQL Editor, AFTER supabase-admin.sql (it uses public.is_admin()). Safe to run again.
-- If you ran an older version of this file, run it again: the newer one also allows WAV files.
--
-- Creates a public bucket called "site-media". Everyone can download files from it (the website
-- needs that), but only the admin can upload, replace or delete them.
--
-- Free plan limits to keep in mind: 1 GB of storage, 5 GB of downloads per month. The admin portal
-- shrinks photos before uploading; for songs, 128-192 kbps MP3 files (3-6 MB each) are plenty.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  26214400, -- 25 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admin can upload media" ON storage.objects;
CREATE POLICY "Admin can upload media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND (SELECT public.is_admin()));

-- Needed so the admin can replace and remove files (the storage API reads the row first).
-- Anonymous visitors cannot list the bucket; they only download files by their exact link.
DROP POLICY IF EXISTS "Admin can read media" ON storage.objects;
CREATE POLICY "Admin can read media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'site-media' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin can replace media" ON storage.objects;
CREATE POLICY "Admin can replace media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-media' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'site-media' AND (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin can delete media" ON storage.objects;
CREATE POLICY "Admin can delete media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-media' AND (SELECT public.is_admin()));
  
