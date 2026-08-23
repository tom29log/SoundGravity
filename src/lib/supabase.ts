import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = 'https://arndqdrposydzyllljbv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybmRxZHJwb3N5ZHp5bGxsamJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDc3MDgsImV4cCI6MjEwMTU4MzcwOH0.Sylpwo3xGdqfMgj_me2wsC5dgHDbo8n85_8Ot4zJe7s'

// 클라이언트 컴포넌트용 (use client)
export const createClient = () =>
  createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
