import type { SupabaseClient, PostgrestSingleResponse } from "@supabase/supabase-js";

export async function getProfile(sb: SupabaseClient, uid: string): Promise<UserProfile | null> {
  const { data, error }: PostgrestSingleResponse<UserProfile> = await sb
    .from("user_profiles")
    .select("*")
    .eq("user_id", uid)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(sb: SupabaseClient, uid: string, user: Partial<NewUserProfile>): Promise<UserProfile | null> {
  const { data, error }: PostgrestSingleResponse<UserProfile> = await sb
    .from("user_profiles")
    .update(user)
    .eq("user_id", uid)
    .select()
    .single();

  if (error) throw error;
  return data;
}
