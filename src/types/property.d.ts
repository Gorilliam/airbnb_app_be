interface NewProperty {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  location: string;
  price_per_night: number;
  availability?: boolean;
  created_at?: string;
}

interface Property extends NewProperty {
  id: string;
}

interface PropertyListQuery {
  q?: string;
  location?: string;
  sort_by?: "name" | "price_per_night" | "created_at";
  offset?: number;
  limit?: number;
}
