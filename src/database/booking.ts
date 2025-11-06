import type { SupabaseClient } from "@supabase/supabase-js";

type BookingWithRelations = Omit<Booking, "user_id" | "property_id"> & {
  user: {
    id: string;
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

export async function getBookings(
  sb: SupabaseClient,
  query: BookingListQuery
): Promise<{ data: BookingWithRelations[]; count: number | null; offset: number; limit: number }> {
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
      `,
      { count: "exact" }
    )
    .range(offset, offset + limit - 1)
    .order("created_at", { ascending: false });

  console.log("Fetched bookings:", { data, error, count });

  if (error) throw error;

  return {
    data: (data ?? []) as unknown as BookingWithRelations[],
    count,
    offset,
    limit,
  };
}


