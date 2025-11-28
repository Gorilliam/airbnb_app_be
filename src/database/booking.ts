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
  `, { count: "exact" })
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
): Promise<BookingWithRelations> {
  const { data, error } = await sb
    .from("bookings")
    .select(`
      *,
      user:user_profiles (
        id,
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

  const { data, error, count } = await sb
    .from("bookings")
    .select(`
      *,
      user:user_profiles (*),
      property:properties (*)
    `)
    .eq("user_id", userId)
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return { data, count, offset, limit };
}



export async function createBooking(sb: SupabaseClient, booking: NewBooking) {

  const { data, error } = await sb
    .from("bookings")
    .insert(booking)
    .select()
    .single();


  if (error) throw error;

  console.log("🟦 Updating availability for property:", booking.property_id);

  const { data: updateData, error: updateError } = await sb
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
    .single();

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

