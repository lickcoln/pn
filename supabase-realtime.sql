-- Paranoid Noise: live updates for visitors
-- Run once in the Supabase SQL Editor, AFTER supabase-admin.sql. Safe to run again.
--
-- What it does: tells Supabase Realtime to announce every change of the site_content table (the content the
-- admin portal publishes). Visitors who have the website open then receive the change within a second or
-- two and the page updates by itself, without a refresh.
--
-- It changes no data and no permissions. Only rows that visitors can already read are announced
-- (site_content is public by design); booking requests and ticket reservations are NOT part of this.
--
-- Until this file has been run the website still updates by itself, only slower: every open page checks for
-- new content about every 30 seconds (and whenever the visitor comes back to the tab).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- every Supabase project has this publication already; this only covers a project where it was removed
    CREATE PUBLICATION supabase_realtime FOR TABLE public.site_content;
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'site_content'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
  END IF;
END
$$;
