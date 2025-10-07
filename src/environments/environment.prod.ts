export const environment = {
  production: true,
  supabase: {
    url: process.env['SUPABASE_URL'] || '',
    anonKey: process.env['SUPABASE_ANON_KEY'] || '',
  },
  apiUrl: process.env['API_URL'] || 'https://votre-domaine.vercel.app/api',
  stripe: {
    publishableKey: process.env['STRIPE_PUBLISHABLE_KEY'] || ''
  },
  ga4: {
    measurementId: process.env['GA4_MEASUREMENT_ID'] || ''
  }
};

