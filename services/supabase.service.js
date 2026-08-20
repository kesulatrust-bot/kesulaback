import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yagerehtuprnwiwkindg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ2VyZWh0dXBybndpd2tpbmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMDcxMTgsImV4cCI6MjA5OTU4MzExOH0.0WxTdmyZMVT41c5Y3De7N1S2m-TgdIkkGOFpdq9QxoY';

export const supabase = createClient(supabaseUrl, supabaseKey);
