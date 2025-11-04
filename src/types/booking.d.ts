interface NewBooking {
  id?: string;
  property_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  total_price?: number;
  created_at?: string;
}

interface Booking extends NewBooking {
  id: string;
}

interface BookingListQuery {
  q?: string; // optional search, e.g., by property name or location
  sort_by?: "check_in_date" | "check_out_date" | "created_at";
  offset?: number;
  limit?: number;
}
