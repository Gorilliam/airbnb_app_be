interface NewUserProfile {
  user_id?: string;
  name?: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  role?: "guest" | "host" | "admin";
  created_at?: string;
}

interface UserProfile extends NewUserProfile {
  user_id: string;
}
