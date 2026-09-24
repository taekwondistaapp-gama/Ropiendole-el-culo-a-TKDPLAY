import { createClient } from '@supabase/supabase-js';

// 1. Pegás tu URL cortita acá, solo entre comillas:
const supabaseUrl = 'https://xjvusrgxwhchxhriwedt.supabase.co';

// 2. Pegás tu clave "anon" (la larguísima) acá, solo entre comillas:
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdnVzcmd4d2hjaHhocml3ZWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTg5MTQsImV4cCI6MjA5NTM5NDkxNH0.71av-GKLhzZxOFjjqdu_eoKQg2aqrJ65UjtC6liBbbE';

// 3. Esta es la línea que enciende el motor (esta sí lleva los paréntesis de la función):
export const supabase = createClient(supabaseUrl, supabaseAnonKey);