import type { SupabaseClient } from "@supabase/supabase-js";

export interface Booking {
  id: string;
  property_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  created_at: string;
}

export interface BookingWithRelations extends Booking {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;

  property: {
    id: string;
    name: string;
    location: string;
    price_per_night: number;
  } | null;
}

export async function getBookings(
  sb: SupabaseClient,
  query: BookingListQuery
) {
  const { limit = 10, offset = 0 } = query;

  const { data, count, error } = await sb
    .from("bookings")
    .select(
      `
      *,
      user:user_profiles ( id, name, email ),
      property:properties ( id, name, location, price_per_night )
      `,
      { count: "exact" }
    )
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return {
    data: (data ?? []) as BookingWithRelations[],
    count,
    offset,
    limit,
  };
}

export async function getBooking(
  sb: SupabaseClient,
  id: string
): Promise<BookingWithRelations> {
  const { data, error } = await sb
    .from("bookings")
    .select(
      `
      *,
      user:user_profiles ( id, name, email ),
      property:properties ( id, name, location, price_per_night )
      `
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as BookingWithRelations;
}

export async function getBookingsForUser(
  sb: SupabaseClient,
  userId: string,
  query: BookingListQuery
) {
  const { limit = 10, offset = 0 } = query;

  const { data, count, error } = await sb
    .from("bookings")
    .select(
      `
      *,
      user:user_profiles ( id, name, email ),
      property:properties ( id, name, location, price_per_night )
      `
    )
    .eq("user_id", userId)
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return {
    data: (data ?? []) as BookingWithRelations[],
    count,
    offset,
    limit,
  };
}

export async function createBooking(
  sb: SupabaseClient,
  booking: NewBooking
) {
  const { data, error } = await sb
    .from("bookings")
    .insert(booking)
    .select()
    .single();

  if (error) throw error;

  await sb
    .from("properties")
    .update({ availability: false })
    .eq("id", booking.property_id);

  return data;
}

export async function updateBooking(
  sb: SupabaseClient,
  id: string,
  booking: Partial<NewBooking>
): Promise<Booking> {
  const { data, error } = await sb
    .from("bookings")
    .update(booking)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Booking;
}

export async function deleteBooking(sb: SupabaseClient, id: string) {
  const { data: booking } = await sb
    .from("bookings")
    .select("property_id")
    .eq("id", id)
    .single();

  if (!booking) return null;

  await sb.from("bookings").delete().eq("id", id);

  await sb
    .from("properties")
    .update({ availability: true })
    .eq("id", booking.property_id);

  return true;
}