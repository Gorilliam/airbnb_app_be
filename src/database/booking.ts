import type { SupabaseClient, PostgrestSingleResponse } from "@supabase/supabase-js";

export async function getBookings(
  sb: SupabaseClient,
  query: BookingListQuery = {}
): Promise<PaginatedListResponse<Booking>> {
  const sortable = new Set(["check_in_date", "check_out_date", "created_at"]);
  const order = query.sort_by && sortable.has(query.sort_by)
    ? query.sort_by
    : "created_at";
  const startIndex = query.offset || 0;
  const endIndex = startIndex + (query.limit || 10) - 1;

  const _query = sb
    .from("bookings")
    .select("*", { count: "exact" })
    .order(order, { ascending: true })
    .range(startIndex, endIndex);

  if (query.q) {
    _query.or(`id.ilike.%${query.q}%`);
  }

  const { data, count, error }: PostgrestSingleResponse<Booking[]> & { count: number | null } = await _query;
  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
    offset: startIndex,
    limit: query.limit || 10,
  };
}

export async function getBooking(sb: SupabaseClient, id: string): Promise<Booking> {
  const { data, error }: PostgrestSingleResponse<Booking> = await sb
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createBooking(sb: SupabaseClient, booking: NewBooking): Promise<Booking> {
  const { data, error }: PostgrestSingleResponse<Booking> = await sb
    .from("bookings")
    .insert(booking)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBooking(sb: SupabaseClient, id: string, booking: Partial<NewBooking>): Promise<Booking> {
  const { data, error }: PostgrestSingleResponse<Booking> = await sb
    .from("bookings")
    .update(booking)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBooking(sb: SupabaseClient, id: string): Promise<Booking> {
  const { data, error }: PostgrestSingleResponse<Booking> = await sb
    .from("bookings")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
