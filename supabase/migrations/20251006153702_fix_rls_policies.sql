-- Fix RLS Policies for User Registration
-- This migration fixes the issue where users cannot register

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile on signup" ON users;

-- Simple and safe policies without recursion

-- 1. Allow authenticated users to insert their own profile during registration
CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. Allow users to read their own data
CREATE POLICY "Enable read access for users based on user_id" ON users
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- 3. Allow users to update their own data
CREATE POLICY "Enable update for users based on user_id" ON users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Allow service role to do everything (for backend operations)
-- No policy needed, service role bypasses RLS

