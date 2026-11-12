import { supabaseUrl, supabasePublishableKey } from './auth-config.js';

let clientPromise;
export function getAuthClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Account access is being set up. Please contact management at +91 72000 60377 for assistance.');
  }
  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2')
      .then(({ createClient }) => createClient(supabaseUrl, supabasePublishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      }))
      .catch((error) => {
        clientPromise = undefined;
        throw error;
      });
  }
  return clientPromise;
}

const pageNames = new Set(['index.html', 'rooms.html', 'facilities.html', 'gallery.html', 'about-us.html', 'contact.html', 'rules.html']);
export function bookingDestination() {
  const requested = new URLSearchParams(location.search).get('next') || 'index.html';
  const siteDirectory = new URL('./', location.href);
  let destination;
  try {
    destination = new URL(requested, location.href);
  } catch {
    return new URL('index.html?book=1', siteDirectory);
  }
  if (destination.origin !== siteDirectory.origin || new URL('./', destination).pathname !== siteDirectory.pathname || !pageNames.has(destination.pathname.split('/').pop())) {
    return new URL('index.html?book=1', siteDirectory);
  }
  destination.searchParams.set('book', '1');
  return destination;
}

export async function requireBookingAccount() {
  try {
    const client = await getAuthClient();
    const { data, error } = await client.auth.getUser();
    if (!error && data.user && data.user.email_confirmed_at) return data.user;
  } catch (error) {
    console.info('Booking account access requires authentication.');
  }
  const login = new URL('../auth.html', import.meta.url);
  const current = new URL(location.href);
  current.searchParams.delete('book');
  login.searchParams.set('next', current.pathname.split('/').pop() + current.search + current.hash);
  location.assign(login.href);
  return null;
}
