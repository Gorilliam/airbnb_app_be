import type { SupabaseClient } from "@supabase/supabase-js";


export type BookingWithRelations = {
  id: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  created_at: string;

  user: {
    user_id: string;
    name: string;
    email: string;
  };

  property: {
    id: string;
    name: string;
    location: string;
    price_per_night: number;
  };
};


export async function getBookingsForUser(
  sb: SupabaseClient,
  userId: string,
  query: BookingListQuery
) {
  const { limit = 10, offset = 0 } = query;

 const { data, error, count } = await sb
  .from("bookings")
  .select(`
      *,
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
  `)
  .eq("user_id", userId)
  .range(offset, offset + limit - 1)
  .order("created_at", { ascending: false })



  if (error) throw error;

  return {
    data: (data ?? []) as BookingWithRelations[],
    count,
    offset,
    limit,
  };
}

export async function getBookingWithRelations(
  sb: SupabaseClient,
  id: string
): Promise<BookingWithRelations> {
  const { data, error } = await sb
    .from("bookings")
    .select(`
      id,
      check_in_date,
      check_out_date,
      total_price,
      created_at,
      user:user_profiles!inner (
        user_id,
        name,
        email
      ),
      property:properties!inner (
        id,
        name,
        location,
        price_per_night
      )
    `)
    .eq("id", id)
    .single<BookingWithRelations>();

  if (error || !data) {
    throw error ?? new Error("Booking not found");
  }

  return data;
}

export async function createBooking(sb: SupabaseClient, booking: NewBooking) {
  console.log("Incoming booking payload:", booking);

  const { data, error } = await sb
    .from("bookings")
    .insert(booking)
    .select()
    .single();

  if (error) throw error;


  const { error: updateError } = await sb
    .from("properties")
    .update({ availability: false })
    .eq("id", booking.property_id)
    .select();

  if (updateError) throw updateError;

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
    .single<Booking>();

  if (error) throw error;
  return data as Booking;
}


export async function deleteBooking(
  sb: SupabaseClient,
  id: string
) {
  const { data: booking } = await sb
    .from("bookings")
    .select("property_id")
    .eq("id", id)
    .single();

  if (!booking) return null;

  const { error: deleteError } = await sb
    .from("bookings")
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;

  const { error: propertyError } = await sb
    .from("properties")
    .update({ availability: true })
    .eq("id", booking.property_id);

  if (propertyError) throw propertyError;

  return true;
}