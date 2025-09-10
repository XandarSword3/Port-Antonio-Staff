-- Fix database policies for staff portal
-- Run this in Supabase SQL Editor to allow write access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow read access to dishes" ON dishes;
DROP POLICY IF EXISTS "Allow read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow read access to reservations" ON reservations;
DROP POLICY IF EXISTS "Allow read access to staff_users" ON staff_users;

-- Create permissive policies for development
CREATE POLICY "Allow all access to categories" ON categories USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dishes" ON dishes USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to orders" ON orders USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to reservations" ON reservations USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to staff_users" ON staff_users USING (true) WITH CHECK (true);

-- Or temporarily disable RLS for easier development
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE dishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users DISABLE ROW LEVEL SECURITY;
