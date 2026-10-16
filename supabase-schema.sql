-- Paranoid Noise Database Schema for Supabase
-- Run this script in the Supabase SQL Editor if you want to store bookings & ticket RSVPs in Supabase
-- Next (optional): run supabase-admin.sql for shared site content and admin access to these tables.

-- 1. Table for Band Booking Inquiries
CREATE TABLE IF NOT EXISTS booking_inquiries (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  organizer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  city TEXT NOT NULL,
  venue TEXT,
  event_type TEXT,
  budget_estimate TEXT,
  message TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE booking_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous insert
CREATE POLICY "Allow public insert for booking inquiries"
  ON booking_inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 2. Table for Tour Ticket Reservations / RSVPs
CREATE TABLE IF NOT EXISTS ticket_rsvps (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  fan_name TEXT NOT NULL,
  fan_email TEXT NOT NULL,
  fan_phone TEXT NOT NULL,
  ticket_count INT DEFAULT 1,
  notes TEXT
);

ALTER TABLE ticket_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert for ticket rsvps"
  ON ticket_rsvps
  FOR INSERT
  TO anon
  WITH CHECK (true);
