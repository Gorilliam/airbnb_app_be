import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { registerValidator } from "../validators/authValidator.js";
import { requireAuth } from "../middlewares/auth.js";
import * as userDb from "../database/user.js";

export const authApp = new Hono();


authApp.post("/register", registerValidator, async (c) => {
  const { email, password } = await c.req.json();
  const sb = c.get("supabase");
  const response = await sb.auth.signUp({ email, password });

  if (response.error) {
    throw new HTTPException(400, {
      res: c.json({ error: response.error.message }, 400),
    });
  }

  return c.json(response.data.user, 200);
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
      return c.json({ error: "Unauthorized" }, 401);
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
  const user = c.get("user")!;
  const body: Partial<any> = await c.req.json();

  const updatedProfile = await userDb.updateProfile(sb, user.id, body);

  return c.json(updatedProfile, 200);
});

export default authApp;
