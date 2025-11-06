import type {
  SupabaseClient,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";


/** Booking joined with its related user and property info */
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

/** List result type for paginated bookings */
export interface BookingListResponse {
  data: BookingWithRelations[];
  count: number | null;
  offset: number;
  limit: number;
}

export async function getBookings(
  sb: SupabaseClient,
  query: Partial<BookingListQuery> = {}
): Promise<BookingListResponse> {
  const { limit = 10, offset = 0 } = query;

  const { data, error, count } = await sb
    .from("bookings")
    .select(
      `
      id,
      check_in_date,
      check_out_date,
      total_price,
      created_at,
      user:profiles (
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
      `,
      { count: "exact" }
    )
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  if (error) throw error;

return {
  data: (data as unknown as BookingWithRelations[]) ?? [],
  count,
  offset,
  limit,
};

}

export async function getBooking(
  sb: SupabaseClient,
  id: string
): Promise<Booking> {
  const { data, error }: PostgrestSingleResponse<Booking> = await sb
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createBooking(
  sb: SupabaseClient,
  booking: NewBooking
): Promise<Booking> {
  const { data, error }: PostgrestSingleResponse<Booking> = await sb
    .from("bookings")
    .insert(booking)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBooking(
  sb: SupabaseClient,
  id: string,
  booking: Partial<NewBooking>
): Promise<Booking> {
  const { data, error }: PostgrestSingleResponse<Booking> = await sb
    .from("bookings")
    .update(booking)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBooking(
  sb: SupabaseClient,
  id: string
): Promise<Booking> {
  const { data, error }: PostgrestSingleResponse<Booking> = await sb
    .from("bookings")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

