import type { SupabaseClient } from "@supabase/supabase-js";


type BookingWithRelations = Omit<Booking, "user_id" | "property_id"> & {
  user: {
    user_id: string;
    name: string;
    email: string;
  } | null;
  property: {
    id: string;
    name: string;
    location: string;
    price_per_night: number;
  } | null;
};


export async function getBookings(
  sb: SupabaseClient,
  query: BookingListQuery
): Promise<{
  data: BookingWithRelations[];
  count: number | null;
  offset: number;
  limit: number;
}> {
  const { limit = 10, offset = 0 } = query;

  const { data, error, count } = await sb
    .from("bookings")
    .select(
      `
      id,
      user_id,
      property_id,
      check_in_date,
      check_out_date,
      total_price,
      created_at,
      user:user_profiles (
        user_id,
        name,
        email
      ),
      property:properties (
        id,
        name,
        location,
        price_per_night
      )
      `,
      { count: "exact" }
    )
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return {
    data: (data ?? []) as unknown as BookingWithRelations[],
    count,
    offset,
    limit,
  };
}


export async function getBooking(
  sb: SupabaseClient,
  id: string
): Promise<Booking> {
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Booking;
}


export async function createBooking(
  sb: SupabaseClient,
  booking: NewBooking
): Promise<Booking> {
  const { data, error } = await sb
    .from("bookings")
    .insert(booking)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
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


export async function deleteBooking(
  sb: SupabaseClient,
  id: string
): Promise<Booking> {
  const { data, error } = await sb
    .from("bookings")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}


