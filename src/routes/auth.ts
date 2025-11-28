import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { registerValidator } from "../validators/authValidator.js";
import { requireAuth } from "../middlewares/auth.js";
import * as userDb from "../database/user.js";

export const authApp = new Hono();


authApp.post("/register", registerValidator, async (c) => {
  const { email, password, name } = await c.req.json();
  const sb = c.get("supabase");

  const result = await sb.auth.signUp({ email, password });

  if (result.error) {
    console.error("Supabase signup error:", result.error);
    return c.json({ error: result.error.message || "Registration failed" }, 400);
  }

  const user = result.data.user;
  if (!user) {
    console.error("Supabase signup returned null user");
    return c.json({ error: "User not created yet (email confirmation required)" }, 400);
  }

  await sb.from("user_profiles").insert({
    user_id: user.id,
    name,
    email,
    role: "guest",
  });

  return c.json(user, 200);
});




authApp.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  const sb = c.get("supabase");
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new HTTPException(400, {
      res: c.json({ error: "Invalid credentials" }, 400),
    });
  }


  return c.json(data.user, 200);
});


authApp.post("/refresh", async (c) => {
  const sb = c.get("supabase");
  const { data, error } = await sb.auth.refreshSession();

  if (error) {
    throw new HTTPException(401, {
      res: c.json({ error: "Unable to refresh session" }, 401),
    });
  }

  return c.json(
    {
      user: data.user,
      session: data.session,
    },
    200
  );
});


authApp.post("/logout", async (c) => {
  const sb = c.get("supabase");
  const { error } = await sb.auth.signOut();

  if (error) {
    throw new HTTPException(400, {
      res: c.json({ error: "Unable to sign out" }, 400),
    });
  }

  return c.json({ message: "Successfully logged out" }, 200);
});


authApp.get("/me", requireAuth, async (c) => {
  try {
    const sb = c.get("supabase");
    const user = c.get("user");

    if (!user) {
      return c.json({ user: null }, 200);
    }

    const profile = await userDb.getProfile(sb, user.id);

    if (!profile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    return c.json(profile, 200);
  } catch (err) {
    console.error("Error in /auth/me:", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});



authApp.patch("/me", requireAuth, async (c) => {
  const sb = c.get("supabase");
  const authUser = c.get("user");

  if (!authUser) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = authUser.id;
  const body: Partial<NewUserProfile> & { toggleRole?: boolean } = await c.req.json();

  const currentProfile = await userDb.getProfile(sb, userId);
  if (!currentProfile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  const updateData: Partial<NewUserProfile> = {};

  // Editable fields
  if (body.name !== undefined) updateData.name = body.name;
  if (body.bio !== undefined) updateData.bio = body.bio;
  if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url;

  if (body.toggleRole) {
    updateData.role = currentProfile.role === "guest" ? "host" : "guest";
  }

  if (Object.keys(updateData).length === 0) {
    return c.json({ error: "No valid fields were provided" }, 400);
  }

  const updatedProfile = await userDb.updateProfile(sb, userId, updateData);

  return c.json(updatedProfile, 200);
});

export default authApp;
