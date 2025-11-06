import type { Context, Next } from "hono";
import { setCookie } from "hono/cookie";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { HTTPException } from "hono/http-exception";

import { supabaseUrl, supabaseAnonKey } from "../lib/supabase.js";

declare module "hono" {
    interface ContextVariableMap {
        supabase: SupabaseClient;
        user: User | null
    }
}

function createSupabaseForRequest(c: Context) {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return parseCookieHeader(c.req.header("Cookie") ?? "").map(
                    ({name, value}) => ({name, value: value ?? ""})
                );
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({name, value, options}) => {
                    setCookie(c, name, value, {
                        ...options,
                        httpOnly: true,
                        secure: true,
                        sameSite: "none",
                        path: "/",
                    })
                })
            }
        }
    })
}

async function withSupabase(c: Context, next: Next) {
    if (!c.get("supabase")) {
        const sb = createSupabaseForRequest(c);
        c.set("supabase", sb)

        const {
            data: {user},
            error,
        } = await sb.auth.getUser();

        if (error && error.code === "session_expired") {
            console.log("session has expired. Trying to refresh the session")
            const { data: refreshData, error: refreshError} =
             await sb.auth.refreshSession();

            if(!refreshError && refreshData.user)  {
                c.set("user", refreshData.user);
            } else {
                c.set("user", null);
            }
        } else {
            c.set("user", error ? null : user);
        }
    }
    return next();
}

export async function optionalAuth(c: Context, next: Next) {
    return withSupabase(c, next);
}

export async function requireAuth(c: Context, next: Next) {
    return next()
    await withSupabase(c, async () => {});
    const user = c.get("user");
    if (!user) {
        throw new HTTPException(401, { message: "Unauthorized"});
    }
    return next()
}