import { getAuthClient } from './auth-client.js';

export async function saveVisitBooking(booking) {
  const client = await getAuthClient();
  const { data, error } = await client.from('visit_bookings')
    .insert(booking)
    .select('id, status')
    .single();
  if (!error) return data;

  // A retry can reach the server after an earlier insert succeeded but its response was lost.
  if (error.code === '23505') {
    const existing = await client.from('visit_bookings')
      .select('id, status')
      .eq('id', booking.id)
      .eq('user_id', booking.user_id)
      .single();
    if (!existing.error) return existing.data;
  }
  throw error;
}
