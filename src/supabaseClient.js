import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://htzizfqxkbblhxkvbvys.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0eml6ZnF4a2JibGh4a3ZidnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNTE1MDgsImV4cCI6MjA4ODkyNzUwOH0.ohbWoDknCrUt6krZ7LZzsmJxVx8Vc3TYtCcaXLTqWDA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
