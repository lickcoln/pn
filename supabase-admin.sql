-- Paranoid Noise: shared site content + admin access for Supabase
-- Run once in the Supabase SQL Editor, AFTER supabase-schema.sql. Safe to run again.
--
-- Adds:
--   1. site_content: the content edited in the admin portal. Everyone can read it, only the admin can write it.
--   2. is_admin(): true only for users whose app_metadata.role = 'admin'.
--   3. Admin-only read access to booking_inquiries and ticket_rsvps (anon still cannot read them).
--
-- app_metadata can only be changed server-side (SQL Editor / service role), never by the signed-in
-- user, so a visitor who signs up on their own cannot make themselves admin.
--
-- Until this file has been run, the website keeps working as before (admin edits stay in one browser).

-- 1. Admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- 2. Shared site content: a single row (id = 'main') holding the whole config as JSON
CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON site_content TO authenticated;

DROP POLICY IF EXISTS "Public can read site content" ON site_content;
CREATE POLICY "Public can read site content"
  ON site_content
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can insert site content" ON site_content;
CREATE POLICY "Admin can insert site content"
  ON site_content
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin can update site content" ON site_content;
CREATE POLICY "Admin can update site content"
  ON site_content
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin can delete site content" ON site_content;
CREATE POLICY "Admin can delete site content"
  ON site_content
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

-- 3. Form submissions: visitors insert, only the admin reads.
--    The insert policies now also cover signed-in users, otherwise the forms would stop saving
--    to Supabase in the admin's own browser while the admin is logged in.
GRANT INSERT ON booking_inquiries, ticket_rsvps TO anon, authenticated;
GRANT SELECT ON booking_inquiries, ticket_rsvps TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

DROP POLICY IF EXISTS "Allow public insert for booking inquiries" ON booking_inquiries;
CREATE POLICY "Allow public insert for booking inquiries"
  ON booking_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert for ticket rsvps" ON ticket_rsvps;
CREATE POLICY "Allow public insert for ticket rsvps"
  ON ticket_rsvps
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read booking inquiries" ON booking_inquiries;
CREATE POLICY "Admin can read booking inquiries"
  ON booking_inquiries
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admin can read ticket rsvps" ON ticket_rsvps;
CREATE POLICY "Admin can read ticket rsvps"
  ON ticket_rsvps
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

-- 4. Make your admin user (do this part by hand, it is intentionally commented out)
--    a. Dashboard -> Authentication -> Users -> Add user: enter your email + a strong password
--       (tick "Auto Confirm User"). Also turn off "Allow new users to sign up" under
--       Authentication -> Sign In / Providers, so nobody else can create accounts.
--    b. Replace the email below with the one from step a, uncomment, and run it on its own.
--       Do not commit your real email to the repository.
--    c. Log out and in again on the website so the new role is in your login token.
--
-- UPDATE auth.users
-- SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
-- WHERE email = 'your-admin-email@example.com';
