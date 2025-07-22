// Vercel環境変数デバッグスクリプト
console.log('Environment Debug Information:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

// Check if import.meta.env is available
if (typeof import !== 'undefined' && import.meta && import.meta.env) {
  console.log('import.meta.env available');
  console.log('import.meta.env.VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('import.meta.env.VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
} else {
  console.log('import.meta.env not available');
}

// Check actual URLs being used
try {
  const actualUrl = process.env.VITE_SUPABASE_URL || 'https://eqirzbuqgymrtnfmvwhq.supabase.co';
  const actualKey = process.env.VITE_SUPABASE_ANON_KEY || 'NOT_FOUND';
  
  console.log('Actual Supabase URL:', actualUrl);
  console.log('Actual Anon Key length:', actualKey !== 'NOT_FOUND' ? actualKey.length : 0);
  console.log('Anon Key starts with:', actualKey !== 'NOT_FOUND' ? actualKey.substring(0, 20) + '...' : 'NOT_FOUND');
} catch (error) {
  console.error('Error checking environment:', error);
}