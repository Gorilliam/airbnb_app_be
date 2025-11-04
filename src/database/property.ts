import type { SupabaseClient, PostgrestSingleResponse } from "@supabase/supabase-js";

export async function getProperties(
  sb: SupabaseClient,
  query: PropertyListQuery = {}
): Promise<PaginatedListResponse<Property>> {
  const sortable = new Set(["name", "price_per_night", "created_at"]);
  const order = query.sort_by && sortable.has(query.sort_by)
    ? query.sort_by
    : "name";
  const startIndex = query.offset || 0;
  const endIndex = startIndex + (query.limit || 10) - 1;

  const _query = sb
    .from("properties")
    .select("*", { count: "exact" })
    .order(order, { ascending: true })
    .range(startIndex, endIndex);

  if (query.q) {
    _query.or(`name.ilike.%${query.q}%,description.ilike.%${query.q}%,location.ilike.%${query.q}%`);
  }

  const { data, count, error }: PostgrestSingleResponse<Property[]> & { count: number | null } = await _query;
  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
    offset: startIndex,
    limit: query.limit || 10,
  };
}

export async function getProperty(sb: SupabaseClient, id: string): Promise<Property> {
  const { data, error }: PostgrestSingleResponse<Property> = await sb
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProperty(sb: SupabaseClient, property: NewProperty): Promise<Property> {
  const { data, error }: PostgrestSingleResponse<Property> = await sb
    .from("properties")
    .insert(property)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProperty(sb: SupabaseClient, id: string, property: Partial<NewProperty>): Promise<Property> {
  const { data, error }: PostgrestSingleResponse<Property> = await sb
    .from("properties")
    .update(property)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProperty(sb: SupabaseClient, id: string): Promise<Property> {
  const { data, error }: PostgrestSingleResponse<Property> = await sb
    .from("properties")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

